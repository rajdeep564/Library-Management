const { daysAgo } = require("./constants");

/**
 * Audit log templates — resolved at seed time with user/book ids.
 * All actions use valid auditLogSchema enum values.
 */
function getAuditLogDefs() {
  const ts = (days) => daysAgo(days);
  return [
    { action: "USER_REGISTERED", performerEmail: "admin@svpdl.gov.in", daysAgo: 90, details: "SVPDL member registration batch — 25 members added", targetType: "User" },
    { action: "USER_LOGIN", performerEmail: "admin@svpdl.gov.in", daysAgo: 1, details: "SVPDL admin login from Anand office", targetType: "User" },
    { action: "USER_LOGIN", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 0, details: "SVPDL circulation desk login", targetType: "User" },
    { action: "BOOK_ADDED", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 60, details: "SVPDL/2024/0001 India After Gandhi catalogued", targetType: "Book" },
    { action: "BOOK_ADDED", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 60, details: "SVPDL/2024/0002 The Discovery of India catalogued", targetType: "Book" },
    { action: "BULK_IMPORT", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 55, details: "SVPDL bulk import booklist_jan2024.xlsx — 45 rows inserted", targetType: "Import" },
    { action: "BOOK_ISSUE_APPROVED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 20, details: "SVPDL loan issued to amit.desai@gmail.com — SVPDL/2024/0001", targetType: "Borrow" },
    { action: "BOOK_ISSUE_APPROVED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 18, details: "SVPDL loan issued to priya.patel@gmail.com — SVPDL/2024/0003", targetType: "Borrow" },
    { action: "BOOK_ISSUE_APPROVED", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 25, details: "SVPDL loan issued to vikram.solanki@gmail.com — SVPDL/2024/0005", targetType: "Borrow" },
    { action: "BOOK_RETURN_APPROVED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 25, details: "SVPDL return approved — mahesh.chauhan@gmail.com SVPDL/2024/0004", targetType: "Borrow" },
    { action: "FINE_CALCULATED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 10, details: "SVPDL overdue fine calculated for amit.desai@gmail.com", targetType: "Borrow" },
    { action: "FINE_PAID", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 25, details: "SVPDL fine collected — mahesh.chauhan@gmail.com Cash payment", targetType: "Borrow" },
    { action: "FINE_PAID", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 40, details: "SVPDL fine collected — asha.raval@gmail.com Online payment", targetType: "Borrow" },
    { action: "FINE_WAIVED", performerEmail: "admin@svpdl.gov.in", daysAgo: 30, details: "SVPDL fine waived for senior citizen member — compassionate grounds", targetType: "Borrow" },
    { action: "SYSTEM_CONFIG_UPDATED", performerEmail: "admin@svpdl.gov.in", daysAgo: 45, details: "SVPDL fine settings updated — finePerDay 100 paisa, grace 1 day", targetType: "SystemConfig" },
    { action: "LIBRARIAN_ADDED", performerEmail: "admin@svpdl.gov.in", daysAgo: 120, details: "SVPDL staff account created — librarian1@svpdl.gov.in", targetType: "User" },
    { action: "MEMBER_UPDATED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 15, details: "SVPDL member profile updated — amit.desai@gmail.com", targetType: "User" },
    { action: "REPORT_GENERATED", performerEmail: "admin@svpdl.gov.in", daysAgo: 7, details: "SVPDL MIS overdue report exported PDF", targetType: "Report" },
    { action: "REPORT_GENERATED", performerEmail: "admin@svpdl.gov.in", daysAgo: 7, details: "SVPDL circulation summary Excel export", targetType: "Report" },
    { action: "CRON_FINE_UPDATE", performerEmail: null, daysAgo: 1, details: "SVPDL nightly fine cron — 4 overdue loans updated", targetType: "Borrow" },
    { action: "NOTIFICATION_SENT", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 3, details: "SVPDL overdue notification sent to priya.patel@gmail.com", targetType: "Notification" },
    { action: "NOTIFICATION_CRON", performerEmail: null, daysAgo: 1, details: "SVPDL due-tomorrow cron — 2 reminders queued", targetType: "Notification" },
    { action: "BOOK_UPDATED", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 50, details: "SVPDL/2024/0034 shelf location updated to Reference Room", targetType: "Book" },
    { action: "BOOK_DELETED", performerEmail: "admin@svpdl.gov.in", daysAgo: 100, details: "SVPDL duplicate entry removed — test record only", targetType: "Book" },
    { action: "BOOK_ISSUE_REQUESTED", performerEmail: "amit.desai@gmail.com", daysAgo: 21, details: "SVPDL issue request — SVPDL/2024/0001", targetType: "Borrow" },
    { action: "BOOK_ISSUE_REJECTED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 14, details: "SVPDL issue rejected — member limit reached for suresh.vasava@gmail.com", targetType: "Borrow" },
    { action: "BOOK_RETURN_REQUESTED", performerEmail: "mahesh.chauhan@gmail.com", daysAgo: 26, details: "SVPDL return request — SVPDL/2024/0004", targetType: "Borrow" },
    { action: "BOOK_RETURN_APPROVED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 40, details: "SVPDL return approved — asha.raval@gmail.com SVPDL/2024/0016", targetType: "Borrow" },
    { action: "BULK_IMPORT", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 30, details: "SVPDL bulk import new_arrivals_march2024.csv — 8 rows inserted", targetType: "Import" },
    { action: "BULK_IMPORT", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 20, details: "SVPDL bulk import test_import_invalid.xlsx — partial success 3/5 rows", targetType: "Import" },
    { action: "USER_LOGOUT", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 0, details: "SVPDL librarian session ended", targetType: "User" },
    { action: "BOOK_ISSUE_APPROVED", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 5, details: "SVPDL loan issued to amit.desai@gmail.com — SVPDL/2024/0002", targetType: "Borrow" },
    { action: "BOOK_ISSUE_APPROVED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 16, details: "SVPDL loan issued to neha.joshi@gmail.com — SVPDL/2024/0012", targetType: "Borrow" },
    { action: "FINE_CALCULATED", performerEmail: null, daysAgo: 1, details: "SVPDL cron fine recalculation — 4 active overdue loans", targetType: "Borrow" },
    { action: "NOTIFICATION_SENT", performerEmail: null, daysAgo: 1, details: "SVPDL fine reminder sent to vikram.solanki@gmail.com", targetType: "Notification" },
    { action: "MEMBER_UPDATED", performerEmail: "admin@svpdl.gov.in", daysAgo: 60, details: "SVPDL membership expiry updated — chandrika.mehta@gmail.com expired", targetType: "User" },
    { action: "REPORT_GENERATED", performerEmail: "librarian1@svpdl.gov.in", daysAgo: 3, details: "SVPDL fine collection report for March 2024", targetType: "Report" },
    { action: "BOOK_ADDED", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 10, details: "SVPDL/2024/0053 Panchatantra children section added", targetType: "Book" },
    { action: "BOOK_ADDED", performerEmail: "librarian2@svpdl.gov.in", daysAgo: 10, details: "SVPDL/2024/0058 Krishi Vigyan Handbook agriculture section", targetType: "Book" },
    { action: "USER_LOGIN", performerEmail: "amit.desai@gmail.com", daysAgo: 0, details: "SVPDL member portal login", targetType: "User" },
  ].map((entry, i) => ({
    ...entry,
    timestamp: ts(entry.daysAgo ?? i),
    ipAddress: "127.0.0.1",
    userAgent: "SVPDL-Seed/1.0",
  }));
}

module.exports = { getAuditLogDefs };
