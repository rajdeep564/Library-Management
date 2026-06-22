const XLSX = require("xlsx");

const IMPORT_COLUMNS = [
  "accessionNo",
  "title",
  "author",
  "isbn",
  "publisher",
  "publishYear",
  "edition",
  "language",
  "category",
  "subCategory",
  "totalCopies",
  "location",
  "shelfNo",
  "sourceOfAcquisition",
  "pricePerCopy",
  "dateOfAddition",
  "description",
  "keywords",
];

function buildImportTemplateBuffer() {
  const sampleRows = [
    {
      accessionNo: "LIB/2026/06/0001",
      title: "Sample Book Title",
      author: "Sample Author",
      isbn: "9780000000001",
      publisher: "Sample Publisher",
      publishYear: 2024,
      edition: "1st",
      language: "English",
      category: "General",
      subCategory: "Reference",
      totalCopies: 3,
      location: "Central Library",
      shelfNo: "A-01",
      sourceOfAcquisition: "Purchase",
      pricePerCopy: 250,
      dateOfAddition: "03/06/2026",
      description: "Short description of the book",
      keywords: "library,reference,public",
    },
  ];

  const notes = [
    ["Column", "Notes"],
    ["title", "Required"],
    ["author", "Required"],
    ["isbn", "Required and unique across catalog and file"],
    ["category", "Required; defaults to General if blank"],
    ["totalCopies", "Required positive number"],
    ["accessionNo", "Optional; generated as LIB/YYYY/MM/NNNN if blank"],
    ["dateOfAddition", "Use DD/MM/YYYY, YYYY-MM-DD, or Excel date"],
    ["keywords", "Comma-separated values"],
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sampleRows, { header: IMPORT_COLUMNS }),
    "Books"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(notes), "Notes");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

module.exports = {
  IMPORT_COLUMNS,
  buildImportTemplateBuffer,
};
