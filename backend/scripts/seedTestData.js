/**
 * SVPDL master test seed — idempotent, resettable.
 * Usage:
 *   node scripts/seedTestData.js          # seed if not already seeded
 *   node scripts/seedTestData.js --clear  # wipe seed data only
 *   node scripts/seedTestData.js --reset  # wipe + seed
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { UserModel } = require("../model/UserModel");
const { BookModel } = require("../model/BookModel");
const { BorrowModel } = require("../model/BorrowModel");
const { SystemConfigModel } = require("../model/SystemConfigModel");
const AuditLogModel = require("../model/AuditLogModel");
const { NotificationModel } = require("../model/NotificationModel");
const { ImportLogModel } = require("../model/ImportLogModel");
const { buildBookQrPayload, buildMemberQrPayload } = require("../utils/qrPayload");
const { calculateFine } = require("../utils/fineCalculator");

const {
  SEED_PASSWORD,
  ACCESSION_PREFIX,
  STAFF_EMAILS,
  MEMBER_EMAILS,
  FINE_SETTINGS,
  LIBRARY_PROFILE,
} = require("./seedData/constants");
const { getAllUserDefs } = require("./seedData/users");
const { getBookDefs } = require("./seedData/books");
const { getLoanDefs, resolveLoanDates } = require("./seedData/loans");
const { getAuditLogDefs } = require("./seedData/auditLogs");
const { getNotificationDefs } = require("./seedData/notifications");
const { getImportLogDefs } = require("./seedData/importLogs");

const ALL_SEED_EMAILS = [...STAFF_EMAILS, ...MEMBER_EMAILS];
const SEED_STATE_KEY = "seed-state";

const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function log(msg, color = "") {
  console.log(color ? `${color}${msg}${c.reset}` : msg);
}

function parseFlags() {
  const args = process.argv.slice(2);
  return {
    clear: args.includes("--clear"),
    reset: args.includes("--reset"),
  };
}

async function connectDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    log("MONGO_URI is missing. Set it in backend/.env", c.red);
    process.exit(1);
  }
  await mongoose.connect(uri);
  log("Connected to MongoDB", c.green);
}

async function isAlreadySeeded() {
  const state = await SystemConfigModel.findOne({ key: SEED_STATE_KEY }).lean();
  return Boolean(state?.testDataSeeded);
}

async function getSeededUserIds() {
  const users = await UserModel.find({
    $or: [{ isSeedData: true }, { email: { $in: ALL_SEED_EMAILS } }],
  }).select("_id");
  return users.map((u) => u._id);
}

async function getSeededBookIds() {
  const books = await BookModel.find({
    accessionNo: { $regex: `^${ACCESSION_PREFIX.replace("/", "\\/")}` },
  }).select("_id");
  return books.map((b) => b._id);
}

async function wipeSeedData() {
  log("\nWiping SVPDL seed data...", c.yellow);

  const userIds = await getSeededUserIds();
  const bookIds = await getSeededBookIds();

  const borrowFilter = {
    $or: [{ userId: { $in: userIds } }, { bookId: { $in: bookIds } }],
  };

  const r1 = await BorrowModel.deleteMany(borrowFilter);
  log(`  Borrows deleted: ${r1.deletedCount}`);

  const r2 = await NotificationModel.deleteMany({ userId: { $in: userIds } });
  log(`  Notifications deleted: ${r2.deletedCount}`);

  const r3 = await AuditLogModel.deleteMany({ details: /SVPDL/ });
  log(`  Audit logs deleted: ${r3.deletedCount}`);

  const importFiles = getImportLogDefs().map((i) => i.fileName);
  const r4 = await ImportLogModel.deleteMany({ fileName: { $in: importFiles } });
  log(`  Import logs deleted: ${r4.deletedCount}`);

  const r5 = await BookModel.deleteMany({ _id: { $in: bookIds } });
  log(`  Books deleted: ${r5.deletedCount}`);

  const r6 = await UserModel.deleteMany({
    $or: [{ isSeedData: true }, { email: { $in: ALL_SEED_EMAILS } }],
  });
  log(`  Users deleted: ${r6.deletedCount}`);

  await SystemConfigModel.findOneAndUpdate(
    { key: SEED_STATE_KEY },
    { key: SEED_STATE_KEY, testDataSeeded: false },
    { upsert: true }
  );
  log("  seed-state cleared", c.green);
}

async function upsertConfigs(adminId) {
  await SystemConfigModel.findOneAndUpdate(
    { key: FINE_SETTINGS.key },
    { ...FINE_SETTINGS, updatedBy: adminId },
    { upsert: true, new: true }
  );
  await SystemConfigModel.findOneAndUpdate(
    { key: LIBRARY_PROFILE.key },
    { ...LIBRARY_PROFILE },
    { upsert: true, new: true }
  );
  log("  SystemConfig: fine-settings + library-profile", c.cyan);
}

async function seedUsers(hashedPassword) {
  const defs = getAllUserDefs();
  const created = [];
  for (const def of defs) {
    const doc = await UserModel.create({
      ...def,
      password: hashedPassword,
    });
    created.push(doc);
  }
  log(`  Users inserted: ${created.length}`, c.cyan);
  return created;
}

async function seedBooks(adminId) {
  const defs = getBookDefs();
  const created = [];
  for (const def of defs) {
    const { seq, ...bookFields } = def;
    const doc = await BookModel.create({
      ...bookFields,
      addedBy: adminId,
    });
    created.push({ seq, doc });
  }
  log(`  Books inserted: ${created.length}`, c.cyan);
  return created;
}

function buildLookupMaps(users, books) {
  const userByEmail = {};
  for (const u of users) userByEmail[u.email] = u;

  const bookBySeq = {};
  for (const { seq, doc } of books) bookBySeq[seq] = doc;

  return { userByEmail, bookBySeq };
}

async function assignQrCodes(users, books) {
  for (const u of users) {
    if (u.role === "user") {
      u.qrCode = buildMemberQrPayload(u);
      await u.save();
    }
  }
  for (const { doc } of books) {
    doc.qrCode = buildBookQrPayload(doc);
    await doc.save();
  }
  log("  QR payloads assigned to members and books", c.cyan);
}

async function seedLoans(userByEmail, bookBySeq, fineSettings) {
  const defs = getLoanDefs();
  const created = [];
  const loanKeyMap = {};

  for (const def of defs) {
    const member = userByEmail[def.memberEmail];
    const book = bookBySeq[def.bookSeq];
    const approver = userByEmail[def.approvedBy];
    if (!member || !book) {
      throw new Error(`Loan ref missing: ${def.memberEmail} / book ${def.bookSeq}`);
    }

    const { issueDate, dueDate, returnDate, finePaidAt } = resolveLoanDates(def);
    let fineAmount = 0;

    if (def.status === "Issued" && dueDate < new Date()) {
      const fine = calculateFine(dueDate, null, fineSettings);
      fineAmount = fine.cappedFine;
    } else if (def.status === "Returned" && returnDate && returnDate > dueDate) {
      const fine = calculateFine(dueDate, returnDate, fineSettings);
      fineAmount = fine.cappedFine;
    }

    const borrow = await BorrowModel.create({
      bookId: book._id,
      userId: member._id,
      issueDate,
      dueDate,
      returnDate,
      status: def.status,
      approvedBy: approver?._id || null,
      renewCount: def.renewCount ?? 0,
      finePerDay: fineSettings.finePerDay,
      fineAmount,
      finePaid: def.finePaid ?? false,
      finePaidAt: def.finePaid ? finePaidAt : null,
      finePaidBy: def.finePaid && approver ? approver._id : null,
      paymentMethod: def.paymentMethod || "",
    });

    const key = `${def.memberEmail}:${def.bookSeq}`;
    loanKeyMap[key] = borrow;
    created.push(borrow);
  }

  log(`  Borrows inserted: ${created.length}`, c.cyan);
  return { loans: created, loanKeyMap };
}

async function adjustAvailableCopies(bookBySeq) {
  const issuedCounts = {};
  for (const def of getLoanDefs()) {
    if (def.status !== "Issued") continue;
    issuedCounts[def.bookSeq] = (issuedCounts[def.bookSeq] || 0) + 1;
  }

  for (const [seqStr, count] of Object.entries(issuedCounts)) {
    const seq = Number(seqStr);
    const book = bookBySeq[seq];
    if (!book) continue;
    book.availableCopies = Math.max(0, book.totalCopies - count);
    await book.save();
  }
  log("  availableCopies decremented for active loans", c.cyan);
}

async function seedAuditLogs(userByEmail) {
  const defs = getAuditLogDefs();
  const docs = defs.map((entry) => {
    const performer = entry.performerEmail ? userByEmail[entry.performerEmail] : null;
    return {
      action: entry.action,
      performedBy: performer?._id || null,
      performedByName: performer?.name || "System Cron",
      performedByRole: performer?.role || "system",
      targetType: entry.targetType,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: entry.timestamp,
    };
  });
  await AuditLogModel.insertMany(docs);
  log(`  Audit logs inserted: ${docs.length}`, c.cyan);
}

async function seedNotifications(userByEmail, bookBySeq, loanKeyMap) {
  const defs = getNotificationDefs();
  const docs = defs.map((n) => {
    const user = userByEmail[n.userEmail];
    const book = n.bookSeq ? bookBySeq[n.bookSeq] : null;
    let loanId = null;
    if (n.loanMemberEmail && n.bookSeqForLoan) {
      const loan = loanKeyMap[`${n.loanMemberEmail}:${n.bookSeqForLoan}`];
      loanId = loan?._id || null;
    }
    return {
      userId: user._id,
      type: n.type,
      title: n.title,
      message: n.message,
      loanId,
      bookId: book?._id || null,
      isRead: n.isRead ?? false,
      readAt: n.isRead ? n.createdAt : null,
      emailSent: n.emailSent ?? false,
      emailSentAt: n.emailSentAt || null,
      createdAt: n.createdAt,
      updatedAt: n.createdAt,
    };
  });
  await NotificationModel.insertMany(docs);
  log(`  Notifications inserted: ${docs.length}`, c.cyan);
}

async function seedImportLogs(userByEmail) {
  const defs = getImportLogDefs();
  const uploader = userByEmail["librarian2@svpdl.gov.in"];
  const docs = defs.map((entry) => ({
    fileName: entry.fileName,
    status: entry.status,
    attemptedRows: entry.attemptedRows,
    insertedRows: entry.insertedRows,
    errorCount: entry.errorCount,
    uploadedBy: uploader._id,
    summary: entry.summary,
    errorDetails: entry.errorDetails,
    createdAt: entry.createdAt,
    updatedAt: entry.createdAt,
  }));
  await ImportLogModel.insertMany(docs);
  log(`  Import logs inserted: ${docs.length}`, c.cyan);
}

async function markSeeded(adminId) {
  await SystemConfigModel.findOneAndUpdate(
    { key: SEED_STATE_KEY },
    { key: SEED_STATE_KEY, testDataSeeded: true, updatedBy: adminId },
    { upsert: true }
  );
}

function printSummary(counts) {
  log("\n" + c.bold + "═══════════════════════════════════════════════════", c.cyan);
  log("  SVPDL Master Test Seed — Complete", c.bold + c.green);
  log("═══════════════════════════════════════════════════" + c.reset, c.cyan);

  const rows = [
    ["Users", counts.users],
    ["Books", counts.books],
    ["Borrows", counts.borrows],
    ["Audit Logs", counts.auditLogs],
    ["Notifications", counts.notifications],
    ["Import Logs", counts.importLogs],
    ["Overdue (unpaid)", counts.overdueUnpaid],
  ];

  for (const [label, val] of rows) {
    log(`  ${label.padEnd(20)} ${String(val).padStart(4)}`, c.cyan);
  }

  log("\n" + c.bold + "Demo credentials (password: TestPass@123):" + c.reset);
  log("  Admin:     admin@svpdl.gov.in");
  log("  Librarian: librarian1@svpdl.gov.in");
  log("  Member:    amit.desai@gmail.com");
  log("\nQuick setup (legacy): npm run seed:users → admin@example.com / admin123\n");
}

async function runSeed() {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

  await upsertConfigs(null);

  const users = await seedUsers(hashedPassword);
  const admin = users.find((u) => u.email === "admin@svpdl.gov.in");
  await upsertConfigs(admin._id);

  const books = await seedBooks(admin._id);
  const { userByEmail, bookBySeq } = buildLookupMaps(users, books);

  await assignQrCodes(users, books);

  const fineSettings = FINE_SETTINGS;
  const { loans, loanKeyMap } = await seedLoans(userByEmail, bookBySeq, fineSettings);
  await adjustAvailableCopies(bookBySeq);

  await seedAuditLogs(userByEmail);
  await seedNotifications(userByEmail, bookBySeq, loanKeyMap);
  await seedImportLogs(userByEmail);
  await markSeeded(admin._id);

  const overdueUnpaid = loans.filter(
    (l) => l.status === "Issued" && l.dueDate < new Date() && !l.finePaid
  ).length;

  printSummary({
    users: users.length,
    books: books.length,
    borrows: loans.length,
    auditLogs: getAuditLogDefs().length,
    notifications: getNotificationDefs().length,
    importLogs: getImportLogDefs().length,
    overdueUnpaid,
  });
}

async function main() {
  const { clear, reset } = parseFlags();

  await connectDb();

  if (clear && !reset) {
    await wipeSeedData();
    log("\nSeed data cleared.", c.green);
    await mongoose.disconnect();
    process.exit(0);
  }

  if (reset) {
    await wipeSeedData();
    await runSeed();
    await mongoose.disconnect();
    process.exit(0);
  }

  if (await isAlreadySeeded()) {
    log("\nTest data already seeded. Use --reset to wipe and re-seed, or --clear to remove only.", c.yellow);
    await mongoose.disconnect();
    process.exit(0);
  }

  await runSeed();
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  log(`\nSeed failed: ${err.message}`, c.red);
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
