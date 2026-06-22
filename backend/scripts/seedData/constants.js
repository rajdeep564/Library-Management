const SEED_PASSWORD = "TestPass@123";
const ACCESSION_PREFIX = "SVPDL/2024/";
const MEMBER_ID_PREFIX = "SVPDL/2024/";

const SEED_IMPORT_FILES = [
  "booklist_jan2024.xlsx",
  "new_arrivals_march2024.csv",
  "test_import_invalid.xlsx",
];

const STAFF_EMAILS = [
  "admin@svpdl.gov.in",
  "librarian1@svpdl.gov.in",
  "librarian2@svpdl.gov.in",
];

const MEMBER_EMAILS = [
  "amit.desai@gmail.com",
  "priya.patel@gmail.com",
  "vikram.solanki@gmail.com",
  "neha.joshi@gmail.com",
  "mahesh.chauhan@gmail.com",
  "asha.raval@gmail.com",
  "deepak.modi@gmail.com",
  "kiran.makwana@gmail.com",
  "sunita.sharma@gmail.com",
  "hitesh.parmar@gmail.com",
  "ritu.panchal@gmail.com",
  "suresh.vasava@gmail.com",
  "geeta.bhatt@gmail.com",
  "naresh.thakor@gmail.com",
  "pooja.shah@gmail.com",
  "ramesh.rathod@gmail.com",
  "varsha.prajapati@gmail.com",
  "jagdish.nayak@gmail.com",
  "manisha.gohil@gmail.com",
  "bharat.agrawal@gmail.com",
  "dhruv.kapadia@gmail.com",
  "chandrika.mehta@gmail.com",
  "sandip.baria@gmail.com",
  "lata.vyas@gmail.com",
  "rohit.dave@gmail.com",
];

function daysAgo(n) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - n);
  return date;
}

function daysFromNow(n) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + n);
  return date;
}

function memberId(seq) {
  return `${MEMBER_ID_PREFIX}${String(seq).padStart(4, "0")}`;
}

function accessionNo(seq) {
  return `${ACCESSION_PREFIX}${String(seq).padStart(4, "0")}`;
}

const LIBRARY_PROFILE = {
  key: "library-profile",
  libraryName: "Sardar Vallabhbhai Patel District Library",
  libraryCode: "SVPDL/AND/2025",
  address: "Dr. Babasaheb Ambedkar Marg, Station Road",
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

const FINE_SETTINGS = {
  key: "fine-settings",
  finePerDay: 100,
  maxFineCap: 10000,
  gracePeriodDays: 1,
  loanPeriodDays: 14,
};

module.exports = {
  SEED_PASSWORD,
  ACCESSION_PREFIX,
  MEMBER_ID_PREFIX,
  SEED_IMPORT_FILES,
  STAFF_EMAILS,
  MEMBER_EMAILS,
  daysAgo,
  daysFromNow,
  memberId,
  accessionNo,
  LIBRARY_PROFILE,
  FINE_SETTINGS,
};
