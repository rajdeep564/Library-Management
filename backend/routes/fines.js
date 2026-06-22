const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const { BorrowModel } = require("../model/BorrowModel");
const calculateFine = require("../utils/fineCalculator");
const { getFineSettings } = require("../utils/systemConfig");
const { logAction } = require("../utils/auditLogger");

function canAccessMemberFine(req, memberId) {
  return ["admin", "librarian"].includes(req.userInfo.role) || req.userInfo.id === String(memberId);
}

function fineStatus(loan) {
  if (loan.fineWaivedBy || loan.fineWaivedAt) return "WAIVED";
  if (loan.finePaid) return "PAID";
  if ((loan.fineAmount || 0) > 0) return "UNPAID";
  return "NO_FINE";
}

async function calculateAndPersistFine(loan, req) {
  const config = await getFineSettings();
  const result = calculateFine(loan.dueDate, loan.returnDate, config);
  loan.finePerDay = config.finePerDay;
  if (!loan.finePaid && !loan.fineWaivedBy) {
    loan.fineAmount = result.cappedFine;
  }
  await loan.save();

  await logAction({
    action: "FINE_CALCULATED",
    performedBy: req.userInfo.id,
    performedByName: req.userInfo.name,
    performedByRole: req.userInfo.role,
    targetId: loan._id,
    targetType: "Borrow",
    details: `Fine calculated: ₹${(result.cappedFine / 100).toFixed(2)} for loan ${loan._id}`,
    req,
  });

  return { config, result };
}

router.post("/calculate/:loanId", userAuth, async (req, res) => {
  try {
    const loan = await BorrowModel.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (!canAccessMemberFine(req, loan.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { result } = await calculateAndPersistFine(loan, req);
    res.json({
      loanId: loan._id,
      dueDate: loan.dueDate,
      daysOverdue: result.daysOverdue,
      fineAmount: loan.fineAmount,
      finePaid: loan.finePaid,
      status: fineStatus(loan),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/collect/:loanId", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const { paymentMethod = "Cash" } = req.body;
    const loan = await BorrowModel.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if ((loan.fineAmount || 0) <= 0) {
      return res.status(400).json({ message: "No outstanding fine to collect" });
    }

    loan.finePaid = true;
    loan.finePaidAt = new Date();
    loan.finePaidBy = req.userInfo.id;
    loan.paymentMethod = ["Cash", "Online", "Cheque"].includes(paymentMethod) ? paymentMethod : "Cash";
    await loan.save();

    await logAction({
      action: "FINE_PAID",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: loan._id,
      targetType: "Borrow",
      details: `Fine collected ₹${((loan.fineAmount || 0) / 100).toFixed(2)} for loan ${loan._id} by ${req.userInfo.name}`,
      req,
    });

    res.json({ message: "Fine collected successfully", loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/waive/:loanId", userAuth, checkRole("admin"), async (req, res) => {
  try {
    const { reason = "" } = req.body;
    if (reason.trim().length < 10) {
      return res.status(400).json({ message: "Waiver reason must be at least 10 characters" });
    }

    const loan = await BorrowModel.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if ((loan.fineAmount || 0) <= 0) {
      return res.status(400).json({ message: "No outstanding fine to waive" });
    }

    const waivedAmount = loan.fineAmount || 0;
    loan.fineWaivedAmount = waivedAmount;
    loan.fineAmount = 0;
    loan.finePaid = false;
    loan.fineWaivedBy = req.userInfo.id;
    loan.fineWaivedReason = reason.trim();
    loan.fineWaivedAt = new Date();
    await loan.save();

    await logAction({
      action: "FINE_WAIVED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: loan._id,
      targetType: "Borrow",
      details: `Fine waived ₹${(waivedAmount / 100).toFixed(2)} for loan ${loan._id}. Reason: ${reason.trim()}`,
      req,
    });

    res.json({ message: "Fine waived successfully", loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/outstanding", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const includePaid = req.query.includePaid === "true";
    const filter = includePaid
      ? { $or: [{ fineAmount: { $gt: 0 } }, { finePaid: true }, { fineWaivedBy: { $ne: null } }] }
      : { fineAmount: { $gt: 0 }, finePaid: { $ne: true } };

    if (req.query.memberId) filter.userId = req.query.memberId;
    if (req.query.minAmount) filter.fineAmount = { $gte: parseInt(req.query.minAmount) || 0 };
    if (req.query.fromDate || req.query.toDate) {
      filter.dueDate = {};
      if (req.query.fromDate) filter.dueDate.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) filter.dueDate.$lte = new Date(req.query.toDate);
    }

    const [loans, total] = await Promise.all([
      BorrowModel.find(filter)
        .populate("userId", "name email")
        .populate("bookId", "title author isbn")
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit),
      BorrowModel.countDocuments(filter),
    ]);

    const config = await getFineSettings();
    const data = loans.map((loan) => {
      const result = calculateFine(loan.dueDate, loan.returnDate, config);
      return { ...loan.toObject(), daysOverdue: result.daysOverdue, fineStatus: fineStatus(loan) };
    });

    res.json({ loans: data, total, page, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/member/:memberId", userAuth, async (req, res) => {
  try {
    if (!canAccessMemberFine(req, req.params.memberId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const loans = await BorrowModel.find({
      userId: req.params.memberId,
      $or: [{ fineAmount: { $gt: 0 } }, { finePaid: true }, { fineWaivedBy: { $ne: null } }],
    })
      .populate("bookId", "title author isbn")
      .populate("finePaidBy", "name email")
      .populate("fineWaivedBy", "name email")
      .sort({ updatedAt: -1 });

    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/summary", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [outstanding, collected, waived, overdueCount] = await Promise.all([
      BorrowModel.aggregate([
        { $match: { fineAmount: { $gt: 0 }, finePaid: { $ne: true } } },
        { $group: { _id: null, total: { $sum: "$fineAmount" } } },
      ]),
      BorrowModel.aggregate([
        { $match: { finePaid: true, finePaidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$fineAmount" } } },
      ]),
      BorrowModel.aggregate([
        { $match: { fineWaivedAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$fineWaivedAmount" } } },
      ]),
      BorrowModel.countDocuments({
        status: { $in: ["Issued", "Requested Return"] },
        dueDate: { $lt: new Date() },
      }),
    ]);

    res.json({
      totalOutstanding: outstanding[0]?.total || 0,
      totalCollectedThisMonth: collected[0]?.total || 0,
      totalWaived: waived[0]?.total || 0,
      overdueCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
