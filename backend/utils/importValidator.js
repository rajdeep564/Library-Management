const XLSX = require("xlsx");
const csvParser = require("csv-parser");
const { Readable } = require("stream");
const { BookModel } = require("../model/BookModel");
const { buildBookQrPayload } = require("./qrPayload");

const MAX_ROWS = 1000;
const REQUIRED_FIELDS = ["title", "author", "isbn", "totalCopies"];

function normalizeHeader(header = "") {
  return String(header).trim();
}

function normalizeText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDate(value) {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const text = normalizeText(value);
  const ddmmyyyy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildAccessionNumber(sequenceOffset = 0, date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(sequenceOffset + 1).padStart(4, "0");
  return `LIB/${yyyy}/${mm}/${seq}`;
}

async function parseImportFile(file) {
  if (!file) throw new Error("Import file is required");
  const fileName = file.originalname || "";
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      const rows = [];
      Readable.from([file.buffer])
        .pipe(csvParser({ mapHeaders: ({ header }) => normalizeHeader(header) }))
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", reject);
    });
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const workbook = XLSX.read(file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
      raw: false,
    });
  }

  throw new Error("Only CSV, XLS, and XLSX files are supported");
}

function normalizeRow(row, rowNumber, accessionOffset) {
  const totalCopies = parseNumber(row.totalCopies);
  const pricePerCopy = parseNumber(row.pricePerCopy);
  const publishYear = parseNumber(row.publishYear);
  const dateOfAddition = parseDate(row.dateOfAddition);
  const accessionNo = normalizeText(row.accessionNo) || buildAccessionNumber(accessionOffset);
  const description = normalizeText(row.description) || "Bulk imported library book";

  return {
    rowNumber,
    book: {
      accessionNo,
      title: normalizeText(row.title),
      author: normalizeText(row.author),
      isbn: normalizeText(row.isbn),
      publisher: normalizeText(row.publisher),
      publishYear,
      edition: normalizeText(row.edition),
      language: normalizeText(row.language) || "English",
      category: normalizeText(row.category) || "General",
      subCategory: normalizeText(row.subCategory),
      totalCopies,
      availableCopies: totalCopies,
      location: normalizeText(row.location),
      shelfNo: normalizeText(row.shelfNo),
      sourceOfAcquisition: normalizeText(row.sourceOfAcquisition),
      pricePerCopy,
      price: pricePerCopy,
      dateOfAddition,
      description,
      keywords: normalizeText(row.keywords)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      coverImage: "",
      cloudinaryId: "bulk-import",
    },
  };
}

function addError(errors, row, field, message) {
  errors.push({ row, field, message });
}

async function validateImportRows(rows = []) {
  const errors = [];
  if (rows.length > MAX_ROWS) {
    addError(errors, 0, "file", `Maximum ${MAX_ROWS} rows allowed per import`);
  }

  const normalizedRows = rows.map((row, index) => normalizeRow(row, index + 2, index));
  const seenIsbn = new Map();
  const seenAccession = new Map();
  const isbns = [];
  const accessions = [];

  normalizedRows.forEach(({ rowNumber, book }) => {
    REQUIRED_FIELDS.forEach((field) => {
      if (!book[field]) addError(errors, rowNumber, field, `${field} is required`);
    });
    if (!Number.isFinite(book.totalCopies) || book.totalCopies < 1) {
      addError(errors, rowNumber, "totalCopies", "totalCopies must be a positive number");
    }
    if (book.publishYear) {
      const year = new Date().getFullYear() + 1;
      if (book.publishYear < 1000 || book.publishYear > year) {
        addError(errors, rowNumber, "publishYear", `publishYear must be between 1000 and ${year}`);
      }
    }
    if (book.dateOfAddition === undefined && normalizeText(rows[rowNumber - 2]?.dateOfAddition)) {
      addError(errors, rowNumber, "dateOfAddition", "dateOfAddition must be a valid date");
    }

    const isbnKey = book.isbn.toLowerCase();
    const accessionKey = book.accessionNo.toLowerCase();
    if (isbnKey) {
      if (seenIsbn.has(isbnKey)) {
        addError(errors, rowNumber, "isbn", `Duplicate ISBN in file; first seen on row ${seenIsbn.get(isbnKey)}`);
      } else {
        seenIsbn.set(isbnKey, rowNumber);
        isbns.push(book.isbn);
      }
    }
    if (accessionKey) {
      if (seenAccession.has(accessionKey)) {
        addError(errors, rowNumber, "accessionNo", `Duplicate accession number in file; first seen on row ${seenAccession.get(accessionKey)}`);
      } else {
        seenAccession.set(accessionKey, rowNumber);
        accessions.push(book.accessionNo);
      }
    }
  });

  const [existingIsbns, existingAccessions] = await Promise.all([
    BookModel.find({ isbn: { $in: isbns } }).select("isbn").lean(),
    BookModel.find({ accessionNo: { $in: accessions } }).select("accessionNo").lean(),
  ]);
  const existingIsbnSet = new Set(existingIsbns.map((book) => String(book.isbn).toLowerCase()));
  const existingAccessionSet = new Set(existingAccessions.map((book) => String(book.accessionNo).toLowerCase()));

  normalizedRows.forEach(({ rowNumber, book }) => {
    if (existingIsbnSet.has(book.isbn.toLowerCase())) {
      addError(errors, rowNumber, "isbn", "ISBN already exists in catalog");
    }
    if (existingAccessionSet.has(book.accessionNo.toLowerCase())) {
      addError(errors, rowNumber, "accessionNo", "Accession number already exists in catalog");
    }
  });

  return {
    rows: normalizedRows,
    errors,
    valid: errors.length === 0,
    previewRows: normalizedRows.slice(0, 10).map((item) => item.book),
    totalRows: rows.length,
  };
}

function attachQrCodes(books) {
  return books.map((book) => ({
    ...book,
    qrCode: buildBookQrPayload(book),
  }));
}

module.exports = {
  MAX_ROWS,
  parseImportFile,
  validateImportRows,
  attachQrCodes,
};
