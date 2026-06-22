const express = require("express");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const archiver = require("archiver");
const router = express.Router();
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const { BookModel } = require("../model/BookModel");
const { UserModel } = require("../model/UserModel");
const { BorrowModel } = require("../model/BorrowModel");
const { clearCache } = require("../utils/cache");
const { getFineSettings } = require("../utils/systemConfig");
const calculateFine = require("../utils/fineCalculator");
const { logAction } = require("../utils/auditLogger");
const {
  buildBookQrPayload,
  buildMemberQrPayload,
  parseQrData,
} = require("../utils/qrPayload");

async function ensureBookQr(book) {
  if (!book.qrCode) {
    book.qrCode = buildBookQrPayload(book);
    await book.save();
  }
  return book.qrCode;
}

async function ensureMemberQr(user) {
  if (!user.qrCode) {
    user.qrCode = buildMemberQrPayload(user);
    await user.save();
  }
  return user.qrCode;
}

async function qrBuffer(payload) {
  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 420,
  });
}

function pipeBookLabelPdf(res, book, png) {
  const doc = new PDFDocument({ size: [216, 144], margin: 10 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="book-label-${book._id}.pdf"`
  );
  doc.pipe(res);
  doc.fontSize(9).font("Helvetica-Bold").text("e-GranthaAlaya", 10, 10);
  doc.fontSize(7).font("Helvetica").text("Ahmedabad Municipal Library Network", 10, 23);
  doc.image(png, 132, 18, { width: 68, height: 68 });
  doc.fontSize(8).font("Helvetica-Bold").text((book.title || "Untitled").slice(0, 42), 10, 45, { width: 112 });
  doc.fontSize(7).font("Helvetica").text(`ISBN: ${book.isbn || "-"}`, 10, 76);
  doc.text(`Accession: ${book.accessionNo || book._id}`, 10, 88, { width: 120 });
  doc.text(`Category: ${book.category || "-"}`, 10, 100, { width: 120 });
  doc.rect(6, 6, 204, 132).strokeColor("#1a3c6e").stroke();
  doc.end();
}

function pipeMemberCardPdf(res, member, png) {
  const doc = new PDFDocument({ size: [243, 153], margin: 12 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="member-card-${member._id}.pdf"`
  );
  doc.pipe(res);
  doc.rect(0, 0, 243, 34).fill("#1a3c6e");
  doc.fillColor("white").fontSize(10).font("Helvetica-Bold").text("e-GranthaAlaya", 12, 10);
  doc.fontSize(7).font("Helvetica").text("Digital Library Member Card", 12, 23);
  doc.fillColor("#1a202c").fontSize(10).font("Helvetica-Bold").text(member.name || "Member", 12, 50);
  doc.fontSize(8).font("Helvetica").text(`Member ID: ${member.memberId || member._id}`, 12, 68);
  doc.text(`Email: ${member.email || "-"}`, 12, 82, { width: 145 });
  doc.text("Valid for library circulation services", 12, 112, { width: 145 });
  doc.image(png, 166, 48, { width: 58, height: 58 });
  doc.rect(6, 6, 231, 141).strokeColor("#1a3c6e").stroke();
  doc.end();
}

router.get("/members", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const members = await UserModel.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/book/:bookId", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });
    const payload = await ensureBookQr(book);
    const png = await qrBuffer(payload);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="book-${book._id}.png"`);
    res.send(png);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/member/:memberId", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const member = await UserModel.findOne({ _id: req.params.memberId, role: "user" });
    if (!member) return res.status(404).json({ message: "Member not found" });
    const payload = await ensureMemberQr(member);
    const png = await qrBuffer(payload);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="member-${member._id}.png"`);
    res.send(png);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/book/:bookId/pdf", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });
    const payload = await ensureBookQr(book);
    const png = await qrBuffer(payload);
    pipeBookLabelPdf(res, book, png);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/member/:memberId/pdf", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const member = await UserModel.findOne({ _id: req.params.memberId, role: "user" });
    if (!member) return res.status(404).json({ message: "Member not found" });
    const payload = await ensureMemberQr(member);
    const png = await qrBuffer(payload);
    pipeMemberCardPdf(res, member, png);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/batch-generate", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const { type, ids } = req.body;
    if (!["book", "member"].includes(type) || !Array.isArray(ids)) {
      return res.status(400).json({ message: "type and ids[] are required" });
    }
    if (ids.length > 500) {
      return res.status(400).json({ message: "Maximum 500 QR codes per batch" });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-qr-codes.zip"`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const id of ids) {
      if (type === "book") {
        const book = await BookModel.findById(id);
        if (!book) continue;
        const payload = await ensureBookQr(book);
        archive.append(await qrBuffer(payload), { name: `book-${book.isbn || book._id}.png` });
      } else {
        const member = await UserModel.findOne({ _id: id, role: "user" });
        if (!member) continue;
        const payload = await ensureMemberQr(member);
        archive.append(await qrBuffer(payload), { name: `member-${member.memberId || member._id}.png` });
      }
    }

    await archive.finalize();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/scan", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const payload = parseQrData(req.body.qrData);
    if (payload.type === "BOOK") {
      const book = await BookModel.findById(payload.id);
      if (!book) return res.status(404).json({ message: "Book not found" });
      const activeBorrow = await BorrowModel.findOne({
        bookId: book._id,
        status: { $in: ["Issued", "Requested Return"] },
      })
        .populate("userId", "name email memberId")
        .populate("bookId", "title isbn author category availableCopies");
      return res.json({ type: "BOOK", data: { book, activeBorrow } });
    }

    const member = await UserModel.findOne({ _id: payload.id, role: "user" }).select("-password");
    if (!member) return res.status(404).json({ message: "Member not found" });
    const activeLoans = await BorrowModel.find({
      userId: member._id,
      status: { $in: ["Requested", "Issued", "Requested Return"] },
    }).populate("bookId", "title isbn author category");
    return res.json({ type: "MEMBER", data: { member, activeLoans } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/issue", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const { memberId, bookId } = req.body;
    const [member, book] = await Promise.all([
      UserModel.findOne({ _id: memberId, role: "user" }),
      BookModel.findById(bookId),
    ]);
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.availableCopies < 1) return res.status(400).json({ message: "No copies available" });

    const activeCount = await BorrowModel.countDocuments({
      userId: member._id,
      status: { $in: ["Requested", "Issued", "Requested Return"] },
    });
    if (activeCount >= 4) {
      return res.status(400).json({ message: "Member already has 4 active loans/requests" });
    }

    const config = await getFineSettings();
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + config.loanPeriodDays);
    const borrow = await BorrowModel.create({
      userId: member._id,
      bookId: book._id,
      issueDate,
      dueDate,
      status: "Issued",
      approvedBy: req.userInfo.id,
      finePerDay: config.finePerDay,
    });
    book.availableCopies -= 1;
    await book.save();
    clearCache("homeData");

    await logAction({
      action: "BOOK_ISSUE_APPROVED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: borrow._id,
      targetType: "Borrow",
      details: `Book issued via QR scan: "${book.title}" to ${member.email}`,
      req,
    });

    res.json({ message: "Book issued via QR scan", borrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/return", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const { borrowId, bookId } = req.body;
    const query = borrowId
      ? { _id: borrowId }
      : { bookId, status: { $in: ["Issued", "Requested Return"] } };
    const borrow = await BorrowModel.findOne(query).populate("bookId").populate("userId", "name email");
    if (!borrow) return res.status(404).json({ message: "Active borrow not found" });

    const book = await BookModel.findById(borrow.bookId._id || borrow.bookId);
    const config = await getFineSettings();
    const returnDate = new Date();
    const fineResult = calculateFine(borrow.dueDate, returnDate, config);

    borrow.status = "Returned";
    borrow.returnDate = returnDate;
    borrow.fineAmount = fineResult.cappedFine;
    borrow.finePerDay = config.finePerDay;
    borrow.finePaid = false;
    borrow.approvedBy = req.userInfo.id;
    await borrow.save();

    if (book && book.availableCopies < book.totalCopies) {
      book.availableCopies += 1;
      await book.save();
    }
    clearCache("homeData");

    await logAction({
      action: "BOOK_RETURN_APPROVED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: borrow._id,
      targetType: "Borrow",
      details: `Book returned via QR scan. Fine: ₹${(fineResult.cappedFine / 100).toFixed(2)}`,
      req,
    });

    if (fineResult.cappedFine > 0) {
      await logAction({
        action: "FINE_CALCULATED",
        performedBy: req.userInfo.id,
        performedByName: req.userInfo.name,
        performedByRole: req.userInfo.role,
        targetId: borrow._id,
        targetType: "Borrow",
        details: `Fine ₹${(fineResult.cappedFine / 100).toFixed(2)} calculated via QR return`,
        req,
      });
    }

    res.json({ message: "Book returned via QR scan", borrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
