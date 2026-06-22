const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const { BorrowModel } = require("../model/BorrowModel");
const { UserModel } = require("../model/UserModel");
const { BookModel } = require("../model/BookModel");
const { getFineSettings } = require("../utils/systemConfig");

router.get("/summary", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const now = new Date();
    const [totalBooks, totalMembers, totalBorrows, totalReturned, totalOverdue] = await Promise.all([
      BookModel.countDocuments(),
      UserModel.countDocuments({ role: "user" }),
      BorrowModel.countDocuments({ status: "Issued" }),
      BorrowModel.countDocuments({ status: "Returned" }),
      BorrowModel.countDocuments({ status: "Issued", dueDate: { $lt: now } })
    ]);
    const fineResult = await BorrowModel.aggregate([
      { $group: { _id: null, total: { $sum: "$fineAmount" } } }
    ]);
    const settings = await getFineSettings();
    res.json({
      totalBooks,
      totalMembers,
      totalBorrows,
      totalReturned,
      totalOverdue,
      totalFine: fineResult[0]?.total || 0,
      fineRatePerDay: settings.finePerDay
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/borrowed", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const records = await BorrowModel.find()
      .populate("bookId", "title author isbn category")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/overdue", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const records = await BorrowModel.find({ status: "Issued", dueDate: { $lt: new Date() } })
      .populate("bookId", "title author isbn")
      .populate("userId", "name email")
      .sort({ dueDate: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/members", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const members = await UserModel.find({ role: "user" }).select("-password").sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
