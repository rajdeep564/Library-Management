/**
 * CSV books seed — streams books_enriched.csv from GitHub into MongoDB.
 * Usage: node utils/seedBooks.js [--clear|--reset]
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const axios = require("axios");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const { BookModel } = require("../model/BookModel");
const { UserModel } = require("../model/UserModel");
const { BorrowModel } = require("../model/BorrowModel");
const { SystemConfigModel } = require("../model/SystemConfigModel");
const AuditLogModel = require("../model/AuditLogModel");
const { NotificationModel } = require("../model/NotificationModel");
const { buildBookQrPayload, buildMemberQrPayload } = require("./qrPayload");
const { calculateFine } = require("./fineCalculator");

const CSV_URL =
  "https://raw.githubusercontent.com/malcolmosh/goodbooks-10k-extended/master/books_enriched.csv";
const BATCH_SIZE = 200;
const SALT = 10;
const SEED_PASSWORD = "TestPass@123";
const ALLOWED_LANGS = new Set(["eng", "fre", "spa", "ger", "ara", "por", ""]);

const FINE_SETTINGS = {
  key: "fine-settings",
  finePerDay: 100,
  maxFineCap: 10000,
  gracePeriodDays: 1,
  loanPeriodDays: 14,
};

const LIBRARY_PROFILE = {
  key: "library-profile",
  libraryName: "Sardar Vallabhbhai Patel District Library",
  libraryCode: "SVPDL/AND/2025",
  address: "Dr. Babasaheb Ambedkar Marg, Station Road, Anand - 388001",
  city: "Anand",
  state: "Gujarat",
  pincode: "388001",
  phone: "02692-244567",
  email: "svpdl@anand.gujarat.gov.in",
  website: "https://svpdl.gujarat.gov.in",
  headLibrarian: "Smt. Bharati R. Patel",
  establishedYear: 1962,
  maxRenewals: 2,
  booksPerMember: 3,
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  workingHours: "10:00 AM – 6:00 PM",
  smtpConfigured: false,
};

const today = new Date();
const ago = (n) => new Date(today.getTime() - n * 86400000);
const fromNow = (n) => new Date(today.getTime() + n * 86400000);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function parsePythonList(str) {
  if (!str || str.trim() === "[]") return [];
  return str
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.trim().replace(/^['"]|['"]$/g, "").trim())
    .filter(Boolean);
}

function cleanTitle(raw) {
  if (!raw) return "";
  return raw.replace(/\s*\([^)]*#\d+[^)]*\)/g, "").trim();
}

function mapLanguage(code) {
  const map = {
    eng: "English",
    fre: "French",
    spa: "Spanish",
    ger: "German",
    ara: "Arabic",
    por: "Portuguese",
    jpn: "Japanese",
    zho: "Chinese",
    rus: "Russian",
  };
  return map[code] || "English";
}

function mapCategory(genreArr) {
  const fiction = [
    "fiction", "literary-fiction", "historical-fiction", "mystery",
    "thriller", "horror", "romance", "science-fiction", "fantasy", "paranormal",
  ];
  const children = ["young-adult", "children", "middle-grade"];
  const history = ["history", "biography", "autobiography", "memoir", "historical"];
  const science = ["science", "nature", "technology", "psychology"];
  const law = ["politics", "law", "philosophy", "political"];
  const literature = ["poetry", "comics", "graphic-novels", "classics"];
  const nonfiction = ["non-fiction", "self-help", "business", "economics", "health"];

  const g = (genreArr[0] || "").toLowerCase();
  if (children.some((x) => g.includes(x))) return "Children's Books";
  if (fiction.some((x) => g.includes(x))) return "Fiction";
  if (history.some((x) => g.includes(x))) return "History & Biography";
  if (science.some((x) => g.includes(x))) return "Science & Technology";
  if (law.some((x) => g.includes(x))) return "Law & Political Science";
  if (literature.some((x) => g.includes(x))) return "Literature & Poetry";
  if (nonfiction.some((x) => g.includes(x))) return "Non-Fiction";
  return "General Knowledge";
}

function mapLocation(category) {
  const map = {
    Fiction: "Section A",
    "Children's Books": "Section B",
    "History & Biography": "Section C",
    "Law & Political Science": "Section D",
    "Science & Technology": "Section E",
    "Non-Fiction": "Section F",
    "Literature & Poetry": "Section G",
    "General Knowledge": "Section H",
  };
  return map[category] || "Section H";
}

function resolveIsbn(row) {
  const isbn13 =
    row.isbn13 && !isNaN(Number(row.isbn13))
      ? String(Math.round(Number(row.isbn13)))
      : "";
  const isbn10 = row.isbn ? String(row.isbn).padStart(10, "0") : "";
  if (isbn13 && isbn13.length === 13) return isbn13;
  if (isbn10 && isbn10 !== "0000000000") return isbn10;
  return "";
}

function rowToBook(row, index, seenIsbns) {
  const authors = parsePythonList(row.authors);
  const genres = parsePythonList(row.genres);
  const title = cleanTitle(row.title);
  const author = authors.join(", ") || "Unknown Author";

  if (!title || !author || author === "Unknown Author") return null;
  if (!authors.length || row.authors === "['']") return null;

  const langCode = (row.language_code || "").trim();
  if (langCode && !ALLOWED_LANGS.has(langCode)) return null;

  const pubYear = parseInt(row.original_publication_year, 10);
  if (isNaN(pubYear) || pubYear < 1800 || pubYear > 2025) return null;

  const isbn = resolveIsbn(row);
  if (!isbn || seenIsbns.has(isbn)) return null;
  seenIsbns.add(isbn);

  const category = mapCategory(genres);
  const location = mapLocation(category);
  const subCat = genres[0]
    ? genres[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "General";
  const rating = parseFloat(row.average_rating) || 3.0;
  const condition = rating >= 4.0 ? "Good" : rating >= 3.0 ? "Fair" : "Poor";
  const pages = parseInt(row.pages, 10) || null;
  const copies = randInt(1, 4);

  let description = (row.description || `${title} by ${author}.`).trim().slice(0, 950);
  const meta = [];
  if (pages) meta.push(`Pages: ${pages}`);
  meta.push(`Condition: ${condition}`);
  if (meta.length) description = `${description} | ${meta.join(" | ")}`.slice(0, 1000);

  const pricePerCopy = randInt(150, 850) * 100;

  return {
    accessionNo: `LIB/${String(index + 1).padStart(4, "0")}`,
    title,
    author,
    isbn,
    publisher: "Various Publishers",
    publishYear: pubYear,
    edition: "1st",
    language: mapLanguage(langCode || "eng"),
    category,
    subCategory: subCat,
    totalCopies: copies,
    availableCopies: copies,
    pricePerCopy,
    price: pricePerCopy,
    location,
    shelfNo: `${location.slice(-1)}-0${randInt(1, 5)}`,
    sourceOfAcquisition: randFrom(["Purchase", "Donation", "Government Grant"]),
    dateOfAddition: new Date(Date.now() - Math.random() * 63072000000),
    coverImage: row.image_url || "",
    cloudinaryId: "seed-data",
    description,
    keywords: genres.map((g) => g.replace(/-/g, " ")),
    qrCode: "",
    seededData: true,
  };
}

async function downloadAndParseCSV() {
  console.log("Downloading books_enriched.csv from GitHub...");
  const response = await axios.get(CSV_URL, {
    responseType: "stream",
    timeout: 120000,
  });

  return new Promise((resolve, reject) => {
    const rows = [];
    response.data
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => {
        console.log(`Downloaded: ${rows.length} rows`);
        resolve(rows);
      })
      .on("error", reject);
  });
}

async function clearSeedData() {
  console.log("Clearing seed data...");
  const [b, br, a, n, u, sc] = await Promise.all([
    BookModel.deleteMany({ seededData: true }),
    BorrowModel.deleteMany({ seededData: true }),
    AuditLogModel.deleteMany({ seededData: true }),
    NotificationModel.deleteMany({ seededData: true }),
    UserModel.deleteMany({ $or: [{ seededData: true }, { isSeedData: true }] }),
    SystemConfigModel.deleteMany({ seededData: true }),
  ]);
  console.log(`  Books: ${b.deletedCount}, Borrows: ${br.deletedCount}, Users: ${u.deletedCount}`);
  console.log(`  Audit: ${a.deletedCount}, Notifications: ${n.deletedCount}, Config: ${sc.deletedCount}`);
  console.log("Cleared.\n");
}

async function seedConfig(adminId) {
  await SystemConfigModel.findOneAndUpdate(
    { key: FINE_SETTINGS.key },
    { ...FINE_SETTINGS, updatedBy: adminId, seededData: true },
    { upsert: true, new: true }
  );
  await SystemConfigModel.findOneAndUpdate(
    { key: LIBRARY_PROFILE.key },
    { ...LIBRARY_PROFILE, seededData: true },
    { upsert: true, new: true }
  );
}

function memberStreamYear(membershipType) {
  switch (membershipType) {
    case "Student":
      return { stream: "Science", year: 2 };
    case "Research Scholar":
      return { stream: "Engineering", year: 3 };
    case "Senior Citizen":
      return { stream: "General Membership", year: 1 };
    default:
      return { stream: "General Membership", year: 1 };
  }
}

async function seedUsers() {
  const hash = await bcrypt.hash(SEED_PASSWORD, SALT);

  const staffDocs = [
    {
      name: "Kamlesh Bhagwandas Shah",
      email: "admin@svpdl.gov.in",
      role: "admin",
      phone: "9825001001",
      employeeId: "SVPDL/ADM/001",
      city: "Anand",
      seededData: true,
    },
    {
      name: "Bharati Rameshchandra Patel",
      email: "librarian1@svpdl.gov.in",
      role: "librarian",
      phone: "9825002002",
      employeeId: "SVPDL/LIB/001",
      city: "Anand",
      seededData: true,
    },
    {
      name: "Rajesh Natvarlal Trivedi",
      email: "librarian2@svpdl.gov.in",
      role: "librarian",
      phone: "9825003003",
      employeeId: "SVPDL/LIB/002",
      city: "Anand",
      seededData: true,
    },
  ];

  const memberRows = [
    { name: "Amit Hareshbhai Desai", email: "amit.desai@gmail.com", phone: "9974001001", memberId: "SVPDL/2024/0001", membershipType: "General", expiry: fromNow(300) },
    { name: "Priya Sureshbhai Patel", email: "priya.patel@gmail.com", phone: "9974002002", memberId: "SVPDL/2024/0002", membershipType: "General", expiry: fromNow(300) },
    { name: "Vikram Dineshbhai Solanki", email: "vikram.solanki@gmail.com", phone: "9974003003", memberId: "SVPDL/2024/0003", membershipType: "Student", expiry: fromNow(300) },
    { name: "Neha Jayntibhai Joshi", email: "neha.joshi@gmail.com", phone: "9974004004", memberId: "SVPDL/2024/0004", membershipType: "Student", expiry: fromNow(300) },
    { name: "Mahesh Chhaganbhai Chauhan", email: "mahesh.chauhan@gmail.com", phone: "9974005005", memberId: "SVPDL/2024/0005", membershipType: "General", expiry: fromNow(300) },
    { name: "Asha Ramanbhai Raval", email: "asha.raval@gmail.com", phone: "9974006006", memberId: "SVPDL/2024/0006", membershipType: "General", expiry: fromNow(300) },
    { name: "Deepak Bhailalbhai Modi", email: "deepak.modi@gmail.com", phone: "9974007007", memberId: "SVPDL/2024/0007", membershipType: "Research Scholar", expiry: fromNow(300) },
    { name: "Kiran Muljibhai Makwana", email: "kiran.makwana@gmail.com", phone: "9974008008", memberId: "SVPDL/2024/0008", membershipType: "General", expiry: fromNow(300) },
    { name: "Sunita Pravinbhai Sharma", email: "sunita.sharma@gmail.com", phone: "9974009009", memberId: "SVPDL/2024/0009", membershipType: "General", expiry: fromNow(300) },
    { name: "Hitesh Bachubhai Parmar", email: "hitesh.parmar@gmail.com", phone: "9974010010", memberId: "SVPDL/2024/0010", membershipType: "Senior Citizen", expiry: fromNow(300) },
    { name: "Ritu Kanjibhai Panchal", email: "ritu.panchal@gmail.com", phone: "9974011011", memberId: "SVPDL/2024/0011", membershipType: "Student", expiry: fromNow(180) },
    { name: "Suresh Maganbhai Vasava", email: "suresh.vasava@gmail.com", phone: "9974012012", memberId: "SVPDL/2024/0012", membershipType: "General", expiry: fromNow(180) },
    { name: "Geeta Rameshbhai Bhatt", email: "geeta.bhatt@gmail.com", phone: "9974013013", memberId: "SVPDL/2024/0013", membershipType: "General", expiry: fromNow(180) },
    { name: "Naresh Laxmanbhai Thakor", email: "naresh.thakor@gmail.com", phone: "9974014014", memberId: "SVPDL/2024/0014", membershipType: "General", expiry: fromNow(180) },
    { name: "Pooja Hemantbhai Shah", email: "pooja.shah@gmail.com", phone: "9974015015", memberId: "SVPDL/2024/0015", membershipType: "Research Scholar", expiry: fromNow(180) },
    { name: "Ramesh Somabhai Rathod", email: "ramesh.rathod@gmail.com", phone: "9974016016", memberId: "SVPDL/2024/0016", membershipType: "General", expiry: fromNow(180) },
    { name: "Varsha Dineshbhai Prajapati", email: "varsha.prajapati@gmail.com", phone: "9974017017", memberId: "SVPDL/2024/0017", membershipType: "General", expiry: fromNow(180) },
    { name: "Jagdish Fulabhai Nayak", email: "jagdish.nayak@gmail.com", phone: "9974018018", memberId: "SVPDL/2024/0018", membershipType: "General", expiry: fromNow(180) },
    { name: "Manisha Kantibhai Gohil", email: "manisha.gohil@gmail.com", phone: "9974019019", memberId: "SVPDL/2024/0019", membershipType: "Student", expiry: fromNow(180) },
    { name: "Bharat Tulsibhai Agrawal", email: "bharat.agrawal@gmail.com", phone: "9974020020", memberId: "SVPDL/2024/0020", membershipType: "Senior Citizen", expiry: fromNow(180) },
    { name: "Dhruv Alkeshbhai Kapadia", email: "dhruv.kapadia@gmail.com", phone: "9974021021", memberId: "SVPDL/2024/0021", membershipType: "General", expiry: fromNow(400) },
    { name: "Chandrika Mohanlal Mehta", email: "chandrika.mehta@gmail.com", phone: "9974022022", memberId: "SVPDL/2024/0022", membershipType: "General", expiry: fromNow(400) },
    { name: "Sandip Prafulbhai Baria", email: "sandip.baria@gmail.com", phone: "9974023023", memberId: "SVPDL/2024/0023", membershipType: "General", expiry: fromNow(400) },
    { name: "Lata Chimanlal Vyas", email: "lata.vyas@gmail.com", phone: "9974024024", memberId: "SVPDL/2024/0024", membershipType: "Senior Citizen", expiry: ago(60) },
    { name: "Rohit Bipinbhai Dave", email: "rohit.dave@gmail.com", phone: "9974025025", memberId: "SVPDL/2024/0025", membershipType: "Student", expiry: ago(30) },
  ];

  const [admin, lib1, lib2] = await UserModel.insertMany(
    staffDocs.map((s) => ({ ...s, password: hash }))
  );

  const members = await UserModel.insertMany(
    memberRows.map((m) => {
      const { stream, year } = memberStreamYear(m.membershipType);
      return {
        name: m.name,
        email: m.email,
        password: hash,
        role: "user",
        phone: m.phone,
        memberId: m.memberId,
        membershipType: m.membershipType,
        membershipExpiry: m.expiry,
        city: "Anand",
        stream,
        year,
        seededData: true,
      };
    })
  );

  for (const member of members) {
    member.qrCode = buildMemberQrPayload(member);
    await member.save();
  }

  return { admin, lib1, lib2, members };
}

async function seedBooksFromCsv(csvRows, adminId) {
  const seenIsbns = new Set();
  const validBooks = [];
  csvRows.forEach((row, i) => {
    const book = rowToBook(row, i, seenIsbns);
    if (book) validBooks.push({ ...book, addedBy: adminId });
  });

  console.log(`${validBooks.length} valid books after filtering`);

  let inserted = 0;
  const insertedDocs = [];

  for (let i = 0; i < validBooks.length; i += BATCH_SIZE) {
    const batch = validBooks.slice(i, i + BATCH_SIZE);
    try {
      const docs = await BookModel.insertMany(batch, { ordered: false });
      insertedDocs.push(...docs);
      inserted += docs.length;
    } catch (err) {
      if (err.insertedDocs) {
        insertedDocs.push(...err.insertedDocs);
        inserted += err.insertedDocs.length;
      } else if (err.code !== 11000) {
        throw err;
      }
    }
    process.stdout.write(`\r   Inserted: ${inserted}/${validBooks.length}`);
  }
  console.log("\n");

  console.log("Generating QR codes...");
  for (let i = 0; i < insertedDocs.length; i += 500) {
    const chunk = insertedDocs.slice(i, i + 500);
    const bulkOps = chunk.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { qrCode: buildBookQrPayload(doc) } },
      },
    }));
    await BookModel.bulkWrite(bulkOps);
  }

  console.log(`Books done: ${insertedDocs.length} inserted with QR codes\n`);
  return insertedDocs;
}

async function seedLoans(books, users) {
  const { lib1, lib2, admin, members: m } = users;
  const b = (i) => books[i % books.length];
  const fineConfig = FINE_SETTINGS;

  const loanDefs = [
    { member: m[0], book: b(0), approvedBy: lib1, issue: ago(5), due: fromNow(9), status: "Issued" },
    { member: m[1], book: b(10), approvedBy: lib1, issue: ago(3), due: fromNow(11), status: "Issued" },
    { member: m[2], book: b(50), approvedBy: lib2, issue: ago(10), due: fromNow(4), status: "Issued" },
    { member: m[3], book: b(100), approvedBy: lib1, issue: ago(2), due: fromNow(12), status: "Issued" },
    { member: m[6], book: b(200), approvedBy: lib2, issue: ago(8), due: fromNow(6), status: "Issued" },
    { member: m[7], book: b(300), approvedBy: lib1, issue: ago(1), due: fromNow(13), status: "Issued" },
    { member: m[14], book: b(400), approvedBy: lib2, issue: ago(6), due: fromNow(8), status: "Issued" },
    { member: m[20], book: b(500), approvedBy: lib1, issue: ago(4), due: fromNow(10), status: "Issued" },
    { member: m[10], book: b(600), approvedBy: lib2, issue: ago(13), due: fromNow(1), status: "Issued" },
    { member: m[12], book: b(700), approvedBy: lib1, issue: ago(13), due: fromNow(1), status: "Issued" },
    { member: m[4], book: b(800), approvedBy: lib2, issue: ago(20), due: ago(6), status: "Issued", finePaid: false },
    { member: m[5], book: b(900), approvedBy: lib1, issue: ago(25), due: ago(11), status: "Issued", finePaid: false },
    { member: m[8], book: b(1000), approvedBy: lib2, issue: ago(30), due: ago(16), status: "Issued", finePaid: false },
    { member: m[9], book: b(1100), approvedBy: lib1, issue: ago(35), due: ago(21), status: "Issued", finePaid: false },
    { member: m[13], book: b(1200), approvedBy: lib1, issue: ago(40), due: ago(26), returnDate: ago(5), status: "Returned", finePaid: true, finePaidAt: ago(5), paymentMethod: "Cash" },
    { member: m[15], book: b(1300), approvedBy: lib2, issue: ago(35), due: ago(21), returnDate: ago(3), status: "Returned", finePaid: true, finePaidAt: ago(3), paymentMethod: "Online" },
    { member: m[16], book: b(1400), approvedBy: lib1, issue: ago(20), due: ago(6), returnDate: ago(2), status: "Returned", finePaid: true, finePaidAt: ago(2), paymentMethod: "Cash" },
    { member: m[17], book: b(1500), approvedBy: lib2, issue: ago(28), due: ago(14), returnDate: ago(15), status: "Returned", finePaid: false },
    { member: m[18], book: b(1600), approvedBy: lib1, issue: ago(14), due: ago(0), returnDate: ago(1), status: "Returned", finePaid: false },
    { member: m[19], book: b(1700), approvedBy: lib2, issue: ago(16), due: ago(2), returnDate: ago(3), status: "Returned", finePaid: false },
    { member: m[22], book: b(1800), approvedBy: lib1, issue: ago(45), due: ago(31), returnDate: ago(7), status: "Returned", finePaid: false, waivedReason: "Medical emergency — hospitalized", waivedBy: admin._id, fineWaivedAt: ago(7) },
    { member: m[23], book: b(1900), approvedBy: lib2, issue: ago(50), due: ago(36), returnDate: ago(10), status: "Returned", finePaid: false, waivedReason: "Senior citizen waiver per library policy", waivedBy: admin._id, fineWaivedAt: ago(10) },
    { member: m[24], book: b(2000), approvedBy: lib1, issue: ago(25), due: fromNow(3), status: "Issued", renewCount: 1 },
    { member: m[21], book: b(2100), approvedBy: lib2, issue: ago(22), due: fromNow(6), status: "Issued", renewCount: 1 },
    { member: m[11], book: b(2200), approvedBy: lib1, issue: ago(60), due: ago(46), returnDate: ago(45), status: "Returned", finePaid: false },
  ];

  const loans = [];
  for (const d of loanDefs) {
    const returnDate = d.returnDate || null;
    let fineAmount = 0;
    if (d.status === "Issued" && d.due < today) {
      fineAmount = calculateFine(d.due, null, fineConfig).cappedFine;
    } else if (d.status === "Returned" && returnDate && returnDate > d.due && !d.waivedBy) {
      fineAmount = calculateFine(d.due, returnDate, fineConfig).cappedFine;
    }

    const loan = await BorrowModel.create({
      bookId: d.book._id,
      userId: d.member._id,
      approvedBy: d.approvedBy._id,
      issueDate: d.issue,
      dueDate: d.due,
      returnDate,
      status: d.status,
      renewCount: d.renewCount || 0,
      finePerDay: fineConfig.finePerDay,
      fineAmount,
      finePaid: d.finePaid || false,
      finePaidAt: d.finePaidAt || null,
      finePaidBy: d.finePaid ? d.approvedBy._id : null,
      paymentMethod: d.paymentMethod || "",
      fineWaivedReason: d.waivedReason || "",
      fineWaivedBy: d.waivedBy || null,
      fineWaivedAt: d.fineWaivedAt || null,
      seededData: true,
    });
    loans.push(loan);

    if (d.status === "Issued") {
      await BookModel.findByIdAndUpdate(d.book._id, { $inc: { availableCopies: -1 } });
    }
  }

  return loans;
}

async function seedAuditLogs(users) {
  const { admin, lib1, lib2, members } = users;
  const logs = [
    { action: "USER_LOGIN", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "Admin Kamlesh Shah logged in", ipAddress: "192.168.1.10", timestamp: ago(30) },
    { action: "SYSTEM_CONFIG_UPDATED", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "Fine settings updated: ₹1/day, cap ₹100, grace 1 day", ipAddress: "192.168.1.10", timestamp: ago(29) },
    { action: "BULK_IMPORT", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "Bulk import: books from books_enriched.csv", ipAddress: "192.168.1.10", timestamp: ago(27) },
    { action: "BOOK_ADDED", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "QR batch generated for all imported books", ipAddress: "192.168.1.10", timestamp: ago(27) },
    { action: "REPORT_GENERATED", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "MIS Report: Monthly Circulation exported to PDF", ipAddress: "192.168.1.10", timestamp: ago(25) },
    { action: "FINE_WAIVED", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "Fine waived for Sandip Baria — Medical emergency", ipAddress: "192.168.1.10", timestamp: ago(7) },
    { action: "FINE_WAIVED", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "Fine waived for Lata Vyas — Senior citizen policy", ipAddress: "192.168.1.10", timestamp: ago(10) },
    { action: "USER_REGISTERED", performedBy: admin._id, performedByName: admin.name, performedByRole: "admin", details: "25 member accounts created (bulk seed)", ipAddress: "192.168.1.10", timestamp: ago(28) },
    { action: "USER_LOGIN", performedBy: lib1._id, performedByName: lib1.name, performedByRole: "librarian", details: "Librarian Bharati Patel logged in", ipAddress: "192.168.1.11", timestamp: ago(14) },
    { action: "BOOK_ISSUE_APPROVED", performedBy: lib1._id, performedByName: lib1.name, performedByRole: "librarian", details: "Book issued to Amit Desai — 14 day loan", ipAddress: "192.168.1.11", timestamp: ago(5) },
    { action: "BOOK_ISSUE_APPROVED", performedBy: lib1._id, performedByName: lib1.name, performedByRole: "librarian", details: "Book issued to Priya Patel — 14 day loan", ipAddress: "192.168.1.11", timestamp: ago(3) },
    { action: "BOOK_RETURN_APPROVED", performedBy: lib1._id, performedByName: lib1.name, performedByRole: "librarian", details: "Book returned by Jagdish Nayak — no fine", ipAddress: "192.168.1.11", timestamp: ago(15) },
    { action: "FINE_PAID", performedBy: lib1._id, performedByName: lib1.name, performedByRole: "librarian", details: "Fine ₹25.00 collected from Naresh Thakor", ipAddress: "192.168.1.11", timestamp: ago(5) },
    { action: "BOOK_ISSUE_APPROVED", performedBy: lib1._id, performedByName: lib1.name, performedByRole: "librarian", details: "Loan renewed for Rohit Dave — renewal 1 of 2", ipAddress: "192.168.1.11", timestamp: ago(11) },
    { action: "USER_LOGIN", performedBy: lib2._id, performedByName: lib2.name, performedByRole: "librarian", details: "Librarian Rajesh Trivedi logged in", ipAddress: "192.168.1.12", timestamp: ago(8) },
    { action: "BOOK_ISSUE_APPROVED", performedBy: lib2._id, performedByName: lib2.name, performedByRole: "librarian", details: "Book issued to Vikram Solanki — 14 day loan", ipAddress: "192.168.1.12", timestamp: ago(10) },
    { action: "FINE_PAID", performedBy: lib2._id, performedByName: lib2.name, performedByRole: "librarian", details: "Fine ₹18.00 collected from Ramesh Rathod", ipAddress: "192.168.1.12", timestamp: ago(3) },
    { action: "BOOK_RETURN_APPROVED", performedBy: lib2._id, performedByName: lib2.name, performedByRole: "librarian", details: "Book returned by Manisha Gohil — on time", ipAddress: "192.168.1.12", timestamp: ago(1) },
    { action: "CRON_FINE_UPDATE", performedBy: null, performedByName: "System Cron", performedByRole: "system", details: "Auto fine cron: 4 overdue loans updated", ipAddress: "system", timestamp: ago(1) },
    { action: "CRON_FINE_UPDATE", performedBy: null, performedByName: "System Cron", performedByRole: "system", details: "Auto fine cron: 4 overdue loans updated", ipAddress: "system", timestamp: ago(2) },
    { action: "NOTIFICATION_SENT", performedBy: null, performedByName: "System Cron", performedByRole: "system", details: "Overdue notices sent to 4 members via email", ipAddress: "system", timestamp: ago(1) },
    { action: "NOTIFICATION_SENT", performedBy: null, performedByName: "System Cron", performedByRole: "system", details: "Due-tomorrow reminders sent to 2 members", ipAddress: "system", timestamp: ago(0) },
    { action: "USER_LOGIN", performedBy: members[0]._id, performedByName: members[0].name, performedByRole: "user", details: "Member Amit Desai logged in", ipAddress: "10.0.0.55", timestamp: ago(2) },
    { action: "USER_LOGIN", performedBy: members[3]._id, performedByName: members[3].name, performedByRole: "user", details: "Member Neha Joshi logged in", ipAddress: "10.0.0.61", timestamp: ago(1) },
    { action: "USER_LOGIN", performedBy: members[6]._id, performedByName: members[6].name, performedByRole: "user", details: "Member Deepak Modi logged in", ipAddress: "10.0.0.72", timestamp: ago(0) },
  ].map((entry) => ({ ...entry, userAgent: "CSV-Seed/1.0", seededData: true }));

  await AuditLogModel.insertMany(logs);
}

async function seedNotifications(users) {
  const { admin, members: m } = users;
  await NotificationModel.insertMany([
    { userId: m[4]._id, type: "OVERDUE", title: "Book Overdue", message: "Your book is 6 days overdue. Fine: ₹6.00. Please return immediately.", isRead: false, emailSent: true, createdAt: ago(1), seededData: true },
    { userId: m[5]._id, type: "OVERDUE", title: "Book Overdue", message: "Your book is 11 days overdue. Fine: ₹11.00. Please return immediately.", isRead: false, emailSent: true, createdAt: ago(1), seededData: true },
    { userId: m[8]._id, type: "OVERDUE", title: "Book Overdue", message: "Your book is 16 days overdue. Fine: ₹16.00. Please return immediately.", isRead: true, emailSent: true, readAt: ago(0), createdAt: ago(1), seededData: true },
    { userId: m[9]._id, type: "OVERDUE", title: "Book Overdue", message: "Your book is 21 days overdue. Fine: ₹21.00. Please return immediately.", isRead: false, emailSent: false, createdAt: ago(1), seededData: true },
    { userId: m[10]._id, type: "DUE_TOMORROW", title: "Book Due Tomorrow", message: "Your borrowed book is due back tomorrow. Return on time to avoid a fine.", isRead: false, emailSent: true, createdAt: ago(0), seededData: true },
    { userId: m[12]._id, type: "DUE_TOMORROW", title: "Book Due Tomorrow", message: "Your borrowed book is due back tomorrow. Return on time to avoid a fine.", isRead: true, emailSent: true, readAt: ago(0), createdAt: ago(0), seededData: true },
    { userId: m[0]._id, type: "BOOK_AVAILABLE", title: "Book Now Available", message: "A book you enquired about is now available for borrowing.", isRead: false, emailSent: true, createdAt: ago(2), seededData: true },
    { userId: admin._id, type: "SYSTEM", title: "Import Complete", message: "Books seeded from books_enriched.csv successfully.", isRead: true, emailSent: false, readAt: ago(27), createdAt: ago(27), seededData: true },
    { userId: m[4]._id, type: "FINE_REMINDER", title: "Final Fine Reminder", message: "Final reminder: your fine is ₹6.00. Unpaid fines may suspend membership.", isRead: false, emailSent: true, createdAt: ago(0), seededData: true },
    { userId: m[13]._id, type: "FINE_REMINDER", title: "Fine Payment Reminder", message: "You have a pending fine. Please visit the library to clear dues.", isRead: true, emailSent: false, readAt: ago(4), createdAt: ago(5), seededData: true },
  ]);
}

async function main() {
  const args = process.argv.slice(2);
  const doClear = args.includes("--clear");
  const doReset = args.includes("--reset");

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Set it in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("\nMongoDB connected\n");

  if (doClear || doReset) await clearSeedData();
  if (doClear) {
    await mongoose.disconnect();
    return;
  }

  const csvRows = await downloadAndParseCSV();

  console.log("Seeding config...");
  await seedConfig(null);

  console.log("Seeding users (3 staff + 25 members)...");
  const users = await seedUsers();
  console.log("   28 users created\n");

  await seedConfig(users.admin._id);

  console.log("Seeding books from CSV...");
  const books = await seedBooksFromCsv(csvRows, users.admin._id);

  console.log("Seeding loans (25 scenarios)...");
  const loans = await seedLoans(books, users);
  console.log(`   ${loans.length} loans created\n`);

  console.log("Seeding audit logs...");
  await seedAuditLogs(users);
  console.log("   25 entries\n");

  console.log("Seeding notifications...");
  await seedNotifications(users);
  console.log("   10 notifications\n");

  await mongoose.disconnect();

  console.log("===================================================");
  console.log("         SEED COMPLETE");
  console.log("===================================================");
  console.log(`  Books     : ${books.length} (from Goodreads dataset)`);
  console.log("  Users     : 28  (3 staff + 25 members)");
  console.log("  Loans     : 25  (all scenarios covered)");
  console.log("  Audit logs: 25");
  console.log("  Notifs    : 10");
  console.log("---------------------------------------------------");
  console.log("  admin@svpdl.gov.in       / TestPass@123");
  console.log("  librarian1@svpdl.gov.in  / TestPass@123");
  console.log("  amit.desai@gmail.com     / TestPass@123");
  console.log("  lata.vyas@gmail.com      / TestPass@123  EXPIRED");
  console.log("===================================================\n");
}

main().catch(async (err) => {
  console.error("Seed error:", err.message);
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
