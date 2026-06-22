const booksController = {};
const { BookModel } = require("../model/BookModel");
const {BorrowModel} = require("../model/BorrowModel")
const cloudinary = require("cloudinary").v2;
const calculateFine = require("../utils/fineCalculator")
const { clearCache } = require("../utils/cache");
const { logAction } = require("../utils/auditLogger");
const { getFineSettings } = require("../utils/systemConfig");
const { buildBookQrPayload } = require("../utils/qrPayload");
const { ImportLogModel } = require("../model/ImportLogModel");
const { buildImportTemplateBuffer } = require("../utils/excelTemplate");
const {
  parseImportFile,
  validateImportRows,
  attachQrCodes,
} = require("../utils/importValidator");


booksController.addNewBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      isbn,
      availableCopies,
      totalCopies,
      coverImage,
      price,
      description,
    } = req.body;
    console.log(req.body);
    const {id} = req.userInfo;

    const existingBook = await BookModel.findOne({ isbn });
    if (existingBook) {
      return res
        .status(400)
        .json({error:true, message: "Book with this ISBN already exists" });
    }
    console.log("req.file")
    console.log(req.file)

    let coverImageUrl = req.file ? req.file.path : "";
    let cloudinaryId = req.file ? req.file.filename : "";
    console.log(coverImageUrl);

    const newBook = new BookModel({
      title,
      author,
      category,
      isbn,
      availableCopies: totalCopies,
      totalCopies,
      addedBy:id,
      coverImage:coverImageUrl,
      cloudinaryId: cloudinaryId,
      price,
      description,
    });

    await newBook.save();
    newBook.qrCode = buildBookQrPayload(newBook);
    await newBook.save();
    clearCache("homeData");

    await logAction({
      action: "BOOK_ADDED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: newBook._id,
      targetType: "Book",
      details: `Book added: "${newBook.title}" by ${newBook.author}`,
      req
    });

    res.status(201).json({error:false , message: "Book added successfully", book: newBook });
  } catch (error) {
    console.log(error);
    res.status(500).json({error:true, message: "Internal Server Error", error });
  }
};

booksController.getAllBooks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();

    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
        { accessionNo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const listProjection =
      "title author category isbn price availableCopies totalCopies coverImage accessionNo createdAt description";

    const [books, totalBooks] = await Promise.all([
      BookModel.find(filter)
        .select(listProjection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookModel.countDocuments(filter),
    ]);

    res.status(200).json({
      error: false,
      message: "Books fetched successfully",
      books,
      totalBooks,
      page,
      limit,
      totalPages: Math.ceil(totalBooks / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};


booksController.getIssuedRequest = async (req, res) => {
  try {
    const requestedBooks = await BorrowModel.find({ status: 'Requested' });
    const totalRequestedBooks = requestedBooks.length;
    if(!requestedBooks || requestedBooks.length === 0){
      return res.json({error:true,message:"No Books Found"});
    }


    res.status(200).json({error:false,message:"Books fetched Successfully",requestedBooks,totalRequestedBooks});
  } catch (error) {
    res.status(500).json({error:true,  message: "Internal Server Error",
      details: error.message, });
  }
};

booksController.getBookCategories = async (req, res) => {
  try {
    const categories = await BookModel.distinct("category");
    categories.sort((a, b) => a.localeCompare(b));
    res.status(200).json({ error: false, categories: ["All", ...categories] });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

booksController.getCategoryStats = async (req, res) => {
  try {
    const categories = await BookModel.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 }, coverImage: { $first: "$coverImage" } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({
      error: false,
      categories: categories.map((c) => ({
        category: c._id,
        count: c.count,
        coverImage: c.coverImage,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

booksController.getLatestBooks = async (req, res) => {
  try {
    const books = await BookModel.find().populate("addedBy", "name email role").sort({ createdAt: -1 }) ;
    console.log(books);
    const totalBooks = books.length;
    if(!books || books.length === 0){
      return res.json({error:true,message:"No Books Found"});
    }

    const uniqueCategories = new Set(books.map(book => book.category)); // Assuming the 'category' field in each book
    const totalCategories = uniqueCategories.size;

    const bookIds = books.map(book => book._id);

    // Fetch the issues related to these books
    const issuedBooks = await BorrowModel.find({
      bookId: { $in: bookIds },
      status: 'Issued',  // Only consider issued books
    }).populate('userId'); // Populate student details from the 'Student' collection

    // Get the unique active students from the issued books
    const activeStudents = new Set(issuedBooks.map(issue => issue.userId._id.toString()));
    const totalActiveStudents = activeStudents.size;



    res.status(200).json({error:false,message:"Books fetched Successfully",books,totalBooks,totalCategories,totalActiveStudents});
  } catch (error) {
    res.status(500).json({error:true,  message: "Internal Server Error",
      details: error.message, });
  }
};


booksController.getParticularBook = async (req, res) => {
  try {
    const id = req.params.id;
    const book = await BookModel.findById(id).populate(
      "addedBy",
      "name email role"
    );
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "internal server error", error });
  }
};

booksController.updateBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      isbn,
      availableCopies,
      totalCopies,
      addedBy,
      coverImage,
      price,
    } = req.body;

    const bookUpdate = await BookModel.findByIdAndUpdate(
      req.params.id,
      {
        title,
        author,
        category,
        availableCopies,
        totalCopies,
        // coverImage,
        price,
      },
      { new: true }
    );
    if (!bookUpdate) {
      return res.status(404).json({ message: "Book not found" });
    }
    clearCache("homeData");

    await logAction({
      action: "BOOK_UPDATED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: bookUpdate._id,
      targetType: "Book",
      details: `Book updated: "${bookUpdate.title}"`,
      req
    });

    res
      .status(200)
      .json({ message: "Book updated successfully", book: bookUpdate });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

booksController.deleteBook = async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ error: true, message: "Book not found" });
    if (book.cloudinaryId) {
      await cloudinary.uploader.destroy(book.cloudinaryId);
    }
    const bookId = req.params.id;
    await BookModel.findByIdAndDelete(bookId);
    clearCache("homeData");

    await logAction({
      action: "BOOK_DELETED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: bookId,
      targetType: "Book",
      details: `Book deleted: "${book.title}"`,
      req
    });

    res.status(200).json({ message: "Book Deleted Successfully" });
  } catch (error) {
    // console.log(deletedBook)
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

booksController.issueBook = async(req,res)=>{
  try {
    const {bookid} = req.params;
  const userid = req.userInfo.id;
  const book = await BookModel.findById(bookid);
  if (!book) return res.status(404).json({ message: "Book not found!" });

  const issuedBooksCount = await BorrowModel.countDocuments({ userId: userid, status: "Issued" });
  console.log("issuedBooksCount");
  console.log(issuedBooksCount);

  if (issuedBooksCount >= 4) {
    return res.status(400).json({ message: "You can issue a maximum of 4 books at a time." });
  }

  if(book.totalCopies <= 0){
    return res.status(400).json({ message: "No copies available to issue!" });
  }

  const config = await getFineSettings();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + config.loanPeriodDays);

  const borrow = new BorrowModel({
    bookId:bookid,
    userId:userid,
    issueDate: new Date(),
    dueDate,
    returnDate: null,
    fineAmount:0,
     status: "Issued"
  })

  await borrow.save();

  book.availableCopies-=1
  await book.save();

  res.status(200).json({ message: "Book issued successfully!", dueDate });
    
  } catch (error) {
    console.error("Error issuing book:", error);
    res.status(500).json({ message: "Internal server error" });    
  }
}

booksController.reqIssueBook = async (req, res) => {
  try {
    const userid = req.userInfo.id;
    const { bookid } = req.params;

    // Check if book exists
    const book = await BookModel.findById(bookid);
    if (!book) {
      return res.status(404).json({ error: true, message: "Book not found" });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({ error: true, message: "No available copies to issue" });
    }

    // Check if user already has 4 books that are either issued, requested, or requested for return
    const currentCount = await BorrowModel.countDocuments({
      userId: userid,
      status: { $in: ["Requested", "Issued", "Requested Return"] }
    });

    if (currentCount >= 4) {
      return res.status(400).json({ error: true, message: "You cannot request or issue more than 4 books at a time, including books pending return approval." });
    }

    // Check if this specific book is already requested/issued by the user
    const existingRequest = await BorrowModel.findOne({
      userId: userid,
      bookId: bookid,
      status: { $in: ["Requested", "Issued"] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: true, message: "You already requested or issued this book" });
    }

    const config = await getFineSettings();
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + config.loanPeriodDays);

    const newBorrow = new BorrowModel({
      bookId: bookid,
      userId: userid,
      issueDate: today,
      dueDate,
      status: "Requested",
    });

    await newBorrow.save();

    await logAction({
      action: "BOOK_ISSUE_REQUESTED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: book._id,
      targetType: "Book",
      details: `Issue requested for book: "${book.title}"`,
      req
    });

    res.status(200).json({
      error: false,
      message: "Book request submitted. Wait for librarian approval.",
      borrow: newBorrow
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// booksController.getIssuedBooks = async (req, res) => {
//   try {
//     const userId = req.userInfo.id; 
//     console.log("Fetching issued books for user:", userId);

//     const issuedBooks = await BorrowModel.find({ userId, returnDate: null }) 
//       .populate("bookId", "title author category isbn price coverImage")
//       .populate("userId", "name email role"); 

//     if (!issuedBooks || issuedBooks.length === 0) {
//       return res.status(404).json({ error: true, message: "No issued books found." });
//     }

//     res.json({ error: false, message: "Issued books fetched successfully", issuedBooks });
//   } catch (error) {
//     console.error("Error fetching issued books:", error);
//     res.status(500).json({ error: true, message: "Internal server error" });
//   }
// };

booksController.getIssuedBooks = async (req, res) => {
  try {
    const userId = req.userInfo.id;

    const issuedBooks = await BorrowModel.find({
      userId,
      returnDate: null,
      status: { $in: ["Issued", "Requested", "Requested Return"] }
    })
      .populate("bookId", "title author category isbn price coverImage")
      .populate("userId", "name email role")
      .sort({ issueDate: -1 });

    if (!issuedBooks || issuedBooks.length === 0) {
      return res.status(200).json({
        error: true,
        message: "No issued books found.",
        issuedBooks: []
      });
    }

    const config = await getFineSettings();
    const booksWithFine = issuedBooks.map(book => {
      const fineResult = calculateFine(book.dueDate, book.returnDate, config);
      return { ...book.toObject(), fine: fineResult.cappedFine, daysOverdue: fineResult.daysOverdue };
    });

    res.json({
      error: false,
      message: "Issued books fetched successfully",
      issuedBooks: booksWithFine
    });

  } catch (error) {
    console.error("Error fetching issued books:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
};

booksController.returnBook = async (req, res) => {
  try {
  const issueId = req.params.id;
  console.log("issueId")
  console.log(issueId)

  // Find issued book entry
  const issuedBook = await BorrowModel.findById(issueId);
  if (!issuedBook) {
      return res.status(404).json({ message: "Issued record not found" });
  }

  if (issuedBook.status === "Returned") {
      return res.status(400).json({ message: "Book already returned" });
  }

  const config = await getFineSettings();
  const returnDate = new Date();
  const fineResult = calculateFine(issuedBook.dueDate, returnDate, config);

  // Update status and set return date
  issuedBook.status = "Returned";
  issuedBook.returnDate = returnDate;
  issuedBook.fineAmount = fineResult.cappedFine;
  issuedBook.finePerDay = config.finePerDay;
  issuedBook.finePaid = false;
  await issuedBook.save();

  // Increment available copies in the Book model
  await BookModel.findByIdAndUpdate(issuedBook.bookId, {
      $inc: { availableCopies: 1 }  // Increase available copies by 1
  });

  res.json({ message: "Book returned successfully", issuedBook });
} catch (error) {
  console.error("Error returning book:", error);
  res.status(500).json({ message: "Server error" });
}
};

booksController.requestReturnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;

    const borrowRecord = await BorrowModel.findById(borrowId);
    if (!borrowRecord) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // Check if the book belongs to the logged-in user
    if (borrowRecord.userId.toString() !== req.userInfo.id.toString()) {
      return res.status(403).json({ message: "Unauthorized to request return for this book" });
    }

    // Check if status is 'Issued'
    if (borrowRecord.status !== "Issued") {
      return res.status(400).json({ message: "Only books with status 'Issued' can be requested for return" });
    }

    // Update status to "Requested Return"
    borrowRecord.status = "Requested Return";
    await borrowRecord.save();

    return res.status(200).json({ message: "Return request submitted successfully" });

  } catch (error) {
    console.error("Error in return request:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

booksController.downloadImportTemplate = async (req, res) => {
  try {
    const buffer = buildImportTemplateBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="book-import-template.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: true, message: "Failed to generate import template" });
  }
};

booksController.previewBulkImport = async (req, res) => {
  try {
    const rows = await parseImportFile(req.file);
    const validation = await validateImportRows(rows);

    await ImportLogModel.create({
      fileName: req.file?.originalname || "",
      status: validation.valid ? "PREVIEWED" : "FAILED",
      attemptedRows: validation.totalRows,
      insertedRows: 0,
      errorCount: validation.errors.length,
      uploadedBy: req.userInfo.id,
      summary: validation.valid
        ? `Preview successful for ${validation.totalRows} rows`
        : `Preview failed with ${validation.errors.length} validation errors`,
      errorDetails: validation.errors.slice(0, 100),
    });

    res.json({
      error: false,
      valid: validation.valid,
      totalRows: validation.totalRows,
      errorCount: validation.errors.length,
      errors: validation.errors,
      previewRows: validation.previewRows,
    });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message || "Failed to preview import" });
  }
};

booksController.bulkImportBooks = async (req, res) => {
  try {
    const rows = await parseImportFile(req.file);
    const validation = await validateImportRows(rows);

    if (!validation.valid) {
      await ImportLogModel.create({
        fileName: req.file?.originalname || "",
        status: "FAILED",
        attemptedRows: validation.totalRows,
        insertedRows: 0,
        errorCount: validation.errors.length,
        uploadedBy: req.userInfo.id,
        summary: `Import blocked with ${validation.errors.length} validation errors`,
        errorDetails: validation.errors.slice(0, 100),
      });
      return res.status(400).json({
        error: true,
        message: "Import has validation errors",
        totalRows: validation.totalRows,
        errorCount: validation.errors.length,
        errors: validation.errors,
      });
    }

    const preparedBooks = validation.rows.map(({ book }) => ({
      ...book,
      addedBy: req.userInfo.id,
    }));
    const insertedBooks = await BookModel.insertMany(preparedBooks, { ordered: true });
    const booksWithQr = attachQrCodes(insertedBooks.map((book) => book.toObject()));

    await Promise.all(
      booksWithQr.map((book) =>
        BookModel.findByIdAndUpdate(book._id, { qrCode: book.qrCode })
      )
    );

    const importLog = await ImportLogModel.create({
      fileName: req.file?.originalname || "",
      status: "SUCCESS",
      attemptedRows: validation.totalRows,
      insertedRows: insertedBooks.length,
      errorCount: 0,
      uploadedBy: req.userInfo.id,
      summary: `Imported ${insertedBooks.length} books successfully`,
      errorDetails: [],
    });

    clearCache("homeData");
    await logAction({
      action: "BULK_IMPORT",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: importLog._id,
      targetType: "ImportLog",
      details: `Bulk imported ${insertedBooks.length} books from ${req.file?.originalname || "uploaded file"}`,
      req,
    });

    res.status(201).json({
      error: false,
      message: "Books imported successfully",
      insertedRows: insertedBooks.length,
      importLog,
    });
  } catch (error) {
    await ImportLogModel.create({
      fileName: req.file?.originalname || "",
      status: "FAILED",
      attemptedRows: 0,
      insertedRows: 0,
      errorCount: 1,
      uploadedBy: req.userInfo.id,
      summary: error.message || "Import failed",
      errorDetails: [{ row: 0, field: "file", message: error.message || "Import failed" }],
    }).catch(() => {});
    res.status(500).json({ error: true, message: error.message || "Failed to import books" });
  }
};

booksController.getImportHistory = async (req, res) => {
  try {
    const logs = await ImportLogModel.find()
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ error: false, logs });
  } catch (error) {
    res.status(500).json({ error: true, message: "Failed to load import history" });
  }
};

module.exports = { booksController };

// status:"Issued"