const { daysAgo, SEED_IMPORT_FILES } = require("./constants");

function getImportLogDefs() {
  return [
    {
      fileName: SEED_IMPORT_FILES[0],
      status: "SUCCESS",
      attemptedRows: 45,
      insertedRows: 45,
      errorCount: 0,
      uploadedByEmail: "librarian2@svpdl.gov.in",
      summary: "SVPDL Jan 2024 catalog import — all 45 rows inserted successfully.",
      errorDetails: [],
      createdAt: daysAgo(55),
    },
    {
      fileName: SEED_IMPORT_FILES[1],
      status: "SUCCESS",
      attemptedRows: 8,
      insertedRows: 8,
      errorCount: 0,
      uploadedByEmail: "librarian2@svpdl.gov.in",
      summary: "SVPDL March 2024 new arrivals CSV — 8 books added to children and agriculture sections.",
      errorDetails: [],
      createdAt: daysAgo(30),
    },
    {
      fileName: SEED_IMPORT_FILES[2],
      status: "SUCCESS",
      attemptedRows: 5,
      insertedRows: 3,
      errorCount: 2,
      uploadedByEmail: "librarian2@svpdl.gov.in",
      summary: "SVPDL partial import — 3 of 5 rows inserted; 2 rows failed validation (duplicate ISBN, missing title).",
      errorDetails: [
        { row: 3, field: "isbn", message: "Duplicate ISBN 9780262033848 already in catalog" },
        { row: 5, field: "title", message: "Title is required" },
      ],
      createdAt: daysAgo(20),
    },
  ];
}

module.exports = { getImportLogDefs, SEED_IMPORT_FILES };
