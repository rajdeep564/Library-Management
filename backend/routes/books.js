const express = require("express");
const  router = express.Router();
const {booksController} = require("../controller/books")
const {userAuth} = require("../middlewares/userAuth");
const {checkRole} = require("../middlewares/checkRole");
const {upload} = require("../utils/cloudConfig");
const multer = require("multer");
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/add",userAuth,checkRole(["admin", "librarian"]),upload.single("coverImage"),booksController.addNewBook)
router.get("/issued",userAuth,checkRole("user"),booksController.getIssuedBooks)

router.get("/",booksController.getAllBooks)
router.get("/issuedrequest", userAuth, checkRole("admin", "librarian"), booksController.getIssuedRequest)
router.get("/new",booksController.getLatestBooks)
router.get("/import-template", userAuth, checkRole(["admin", "librarian"]), booksController.downloadImportTemplate)
router.post("/bulk-import/preview", userAuth, checkRole(["admin", "librarian"]), importUpload.single("file"), booksController.previewBulkImport)
router.post("/bulk-import", userAuth, checkRole(["admin", "librarian"]), importUpload.single("file"), booksController.bulkImportBooks)
router.get("/import-history", userAuth, checkRole(["admin", "librarian"]), booksController.getImportHistory)
router.get("/:id",booksController.getParticularBook)
router.delete("/delete/:id",userAuth,checkRole(["admin", "librarian"]),booksController.deleteBook)
router.put("/update/:id",userAuth,checkRole(["admin", "librarian"]),booksController.updateBook)
router.post("/borrow/request-issue/:bookid",userAuth,checkRole("user"),booksController.reqIssueBook)
router.put("/return/:id",userAuth,checkRole("user"),booksController.returnBook)
router.put("/returnrequest/:id",userAuth,checkRole("user"),booksController.requestReturnBook)




module.exports = router 