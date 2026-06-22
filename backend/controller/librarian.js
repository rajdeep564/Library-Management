const { BorrowModel } = require("../model/BorrowModel");
const { BookModel } = require("../model/BookModel");
const calculateFine = require("../utils/fineCalculator");
const { clearCache } = require("../utils/cache");
const { logAction } = require("../utils/auditLogger");
const { getFineSettings } = require("../utils/systemConfig");
const librarianController = {};

librarianController.bookIssued = async (req, res) => {
  try {
    const requests = await BorrowModel.find({ status: "Issued" })
      .populate("userId", "name email")
      .populate("bookId", "title")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ message: "Requested books fetched successfully", requests });
  } catch (err) {
    console.error("Error fetching requests", err);
    res.status(500).json({ error: "Server error" });
  }
};

librarianController.issueRequest = async (req, res) => {
  try {
    const requests = await BorrowModel.find({ status: "Requested" })
      .populate("userId", "name email")
      .populate("bookId", "title")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ message: "Requested books fetched successfully", requests });
  } catch (err) {
    console.error("Error fetching requests", err);
    res.status(500).json({ error: "Server error" });
  }
};

librarianController.approveRequest = async (req, res) => {
  const requestId = req.params.id;

  try {
    const borrowRequest = await BorrowModel.findById(requestId);
    if (!borrowRequest) {
      return res.status(404).json({ error: "Borrow request not found" });
    }

    const issuedCount = await BorrowModel.countDocuments({
      userId: borrowRequest.userId,
      status: "Issued",
    });

    if (issuedCount >= 4) {
      return res.status(400).json({ error: "User already has 4 issued books" });
    }

    const book = await BookModel.findById(borrowRequest.bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({ error: "No copies available" });
    }

    book.availableCopies -= 1;
    await book.save();

    borrowRequest.status = "Issued";
    borrowRequest.approvedBy = req.userInfo.id;
    await borrowRequest.save();
    clearCache("homeData");

    await logAction({
      action: "BOOK_ISSUE_APPROVED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: borrowRequest._id,
      targetType: "Borrow",
      details: `Issue approved for member: ${borrowRequest.userId}`,
      req
    });

    res.json({ message: "Book issued successfully", borrow: borrowRequest });
  } catch (err) {
    console.error("Error approving request", err);
    res.status(500).json({ error: "Server error" });
  }
};

librarianController.returnRequest = async (req, res) => {
  try {
    const requests = await BorrowModel.find({ status: "Requested Return" })
      .populate("userId", "name email")
      .populate("bookId", "title")
      .sort({ createdAt: -1 });

    const config = await getFineSettings();
    const requestsWithFine = requests.map((req) => {
      const fineResult = calculateFine(req.dueDate, req.returnDate, config);
      return {
        ...req.toObject(),
        fine: fineResult.cappedFine,
        daysOverdue: fineResult.daysOverdue,
      };
    });

    res.status(200).json({
      message: "Requested books fetched successfully",
      requests: requestsWithFine,
    });
  } catch (err) {
    console.error("Error fetching requests", err);
    res.status(500).json({ error: "Server error" });
  }
};

librarianController.approveReturnRequest = async (req, res) => {
  try {
    const borrowId = req.params.id;

    const borrow = await BorrowModel.findById(borrowId);
    if (!borrow)
      return res.status(404).json({ message: "Borrow record not found" });

    if (borrow.status !== "Requested Return") {
      return res
        .status(400)
        .json({ message: "Book return not requested or already processed" });
    }

    const book = await BookModel.findById(borrow.bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.availableCopies < book.totalCopies) {
      book.availableCopies += 1;
      await book.save();
    }

    const returnDate = new Date();
    const config = await getFineSettings();
    const fineResult = calculateFine(borrow.dueDate, returnDate, config);
    const fine = fineResult.cappedFine;

    borrow.status = "Returned";
    borrow.returnDate = returnDate;
    borrow.fineAmount = fine;
    borrow.finePerDay = config.finePerDay;
    borrow.finePaid = false;
    borrow.approvedBy = req.userInfo.id;

    await borrow.save();
    clearCache("homeData");

    await logAction({
      action: "BOOK_RETURN_APPROVED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: borrow._id,
      targetType: "Borrow",
      details: `Return approved. Fine: ₹${(fine / 100).toFixed(2)}`,
      req
    });

    if (fine > 0) {
      await logAction({
        action: "FINE_CALCULATED",
        performedBy: req.userInfo.id,
        performedByName: req.userInfo.name,
        performedByRole: req.userInfo.role,
        targetId: borrow._id,
        targetType: "Borrow",
        details: `Fine ₹${(fine / 100).toFixed(2)} calculated for borrow ${borrow._id}`,
        req
      });
    }

    res
      .status(200)
      .json({ message: "Book return approved and updated successfully" });
  } catch (error) {
    console.error("Error approving return request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { librarianController };
