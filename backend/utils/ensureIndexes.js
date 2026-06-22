const { BookModel } = require("../model/BookModel");
const { BorrowModel } = require("../model/BorrowModel");
const { UserModel } = require("../model/UserModel");
const AuditLogModel = require("../model/AuditLogModel");

async function ensureIndexes() {
  await Promise.all([
    BookModel.syncIndexes(),
    BorrowModel.syncIndexes(),
    UserModel.syncIndexes(),
    AuditLogModel.syncIndexes(),
  ]);
  console.log("MongoDB indexes synced");
}

module.exports = { ensureIndexes };
