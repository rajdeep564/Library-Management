const express = require("express");
const  router = express.Router();
const {librarianController} = require("../controller/librarian")

const {userAuth} = require("../middlewares/userAuth");
const {checkRole} = require("../middlewares/checkRole");

router.get("/bookissued",userAuth,checkRole(["admin", "librarian"]),librarianController.bookIssued)
router.get("/issuerequest",userAuth,checkRole("admin", "librarian"),librarianController.issueRequest)
router.get("/returnrequest",userAuth,checkRole("admin", "librarian"),librarianController.returnRequest)
router.put("/approverequest/:id",userAuth,checkRole("admin", "librarian"),librarianController.approveRequest)
router.put("/approvereturnrequest/:id",userAuth,checkRole("admin", "librarian"),librarianController.approveReturnRequest)



module.exports = router