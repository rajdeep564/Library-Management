const { daysAgo, daysFromNow } = require("./constants");

/**
 * Loan definitions reference member email + book seq (accession suffix).
 * status: Issued | Returned
 * Overdue = Issued with dueDate in the past.
 */
const LOAN_DEFS = [
  // 4 unpaid overdue (fines page)
  { memberEmail: "amit.desai@gmail.com", bookSeq: 1, status: "Issued", issueDaysAgo: 20, dueDaysAgo: 10, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "priya.patel@gmail.com", bookSeq: 3, status: "Issued", issueDaysAgo: 18, dueDaysAgo: 5, finePaid: false, renewCount: 1, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "vikram.solanki@gmail.com", bookSeq: 5, status: "Issued", issueDaysAgo: 25, dueDaysAgo: 12, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "neha.joshi@gmail.com", bookSeq: 12, status: "Issued", issueDaysAgo: 16, dueDaysAgo: 3, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  // Active not overdue
  { memberEmail: "amit.desai@gmail.com", bookSeq: 2, status: "Issued", issueDaysAgo: 5, dueDaysFromNow: 1, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "deepak.modi@gmail.com", bookSeq: 6, status: "Issued", issueDaysAgo: 7, dueDaysFromNow: 7, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "kiran.makwana@gmail.com", bookSeq: 9, status: "Issued", issueDaysAgo: 3, dueDaysFromNow: 11, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "hitesh.parmar@gmail.com", bookSeq: 13, status: "Issued", issueDaysAgo: 10, dueDaysFromNow: 4, finePaid: false, renewCount: 1, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "ritu.panchal@gmail.com", bookSeq: 17, status: "Issued", issueDaysAgo: 2, dueDaysFromNow: 12, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "naresh.thakor@gmail.com", bookSeq: 37, status: "Issued", issueDaysAgo: 8, dueDaysFromNow: 6, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "pooja.shah@gmail.com", bookSeq: 41, status: "Issued", issueDaysAgo: 4, dueDaysFromNow: 10, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "bharat.agrawal@gmail.com", bookSeq: 7, status: "Issued", issueDaysAgo: 6, dueDaysFromNow: 8, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  // Returned — some with paid fines
  { memberEmail: "mahesh.chauhan@gmail.com", bookSeq: 4, status: "Returned", issueDaysAgo: 45, dueDaysAgo: 30, returnDaysAgo: 25, finePaid: true, finePaidDaysAgo: 25, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in", paymentMethod: "Cash" },
  { memberEmail: "asha.raval@gmail.com", bookSeq: 16, status: "Returned", issueDaysAgo: 60, dueDaysAgo: 45, returnDaysAgo: 40, finePaid: true, finePaidDaysAgo: 40, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in", paymentMethod: "Online" },
  { memberEmail: "sunita.sharma@gmail.com", bookSeq: 19, status: "Returned", issueDaysAgo: 30, dueDaysAgo: 15, returnDaysAgo: 14, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "suresh.vasava@gmail.com", bookSeq: 21, status: "Returned", issueDaysAgo: 90, dueDaysAgo: 75, returnDaysAgo: 70, finePaid: true, finePaidDaysAgo: 68, renewCount: 1, approvedBy: "librarian1@svpdl.gov.in", paymentMethod: "Cash" },
  { memberEmail: "geeta.bhatt@gmail.com", bookSeq: 22, status: "Returned", issueDaysAgo: 20, dueDaysAgo: 5, returnDaysAgo: 3, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "ramesh.rathod@gmail.com", bookSeq: 25, status: "Returned", issueDaysAgo: 50, dueDaysAgo: 35, returnDaysAgo: 30, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "varsha.prajapati@gmail.com", bookSeq: 14, status: "Returned", issueDaysAgo: 35, dueDaysAgo: 20, returnDaysAgo: 18, finePaid: true, finePaidDaysAgo: 18, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in", paymentMethod: "Cash" },
  { memberEmail: "jagdish.nayak@gmail.com", bookSeq: 18, status: "Returned", issueDaysAgo: 40, dueDaysAgo: 25, returnDaysAgo: 22, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "manisha.gohil@gmail.com", bookSeq: 20, status: "Returned", issueDaysAgo: 28, dueDaysAgo: 13, returnDaysAgo: 10, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "dhruv.kapadia@gmail.com", bookSeq: 10, status: "Returned", issueDaysAgo: 55, dueDaysAgo: 40, returnDaysAgo: 38, finePaid: true, finePaidDaysAgo: 38, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in", paymentMethod: "Online" },
  { memberEmail: "sandip.baria@gmail.com", bookSeq: 38, status: "Returned", issueDaysAgo: 22, dueDaysAgo: 7, returnDaysAgo: 5, finePaid: false, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in" },
  { memberEmail: "lata.vyas@gmail.com", bookSeq: 45, status: "Returned", issueDaysAgo: 15, dueDaysAgo: 1, returnDaysAgo: 0, finePaid: false, renewCount: 0, approvedBy: "librarian1@svpdl.gov.in" },
  { memberEmail: "rohit.dave@gmail.com", bookSeq: 47, status: "Returned", issueDaysAgo: 70, dueDaysAgo: 55, returnDaysAgo: 50, finePaid: true, finePaidDaysAgo: 50, renewCount: 0, approvedBy: "librarian2@svpdl.gov.in", paymentMethod: "Cash" },
];

function resolveLoanDates(def) {
  const issueDate = daysAgo(def.issueDaysAgo);
  let dueDate;
  if (def.dueDaysAgo != null) dueDate = daysAgo(def.dueDaysAgo);
  else if (def.dueDaysFromNow != null) dueDate = daysFromNow(def.dueDaysFromNow);
  else dueDate = daysFromNow(14);

  const returnDate =
    def.status === "Returned"
      ? daysAgo(def.returnDaysAgo ?? def.dueDaysAgo ?? 1)
      : null;

  const finePaidAt =
    def.finePaid && def.finePaidDaysAgo != null ? daysAgo(def.finePaidDaysAgo) : null;

  return { issueDate, dueDate, returnDate, finePaidAt };
}

function getLoanDefs() {
  return LOAN_DEFS;
}

module.exports = { LOAN_DEFS, getLoanDefs, resolveLoanDates };
