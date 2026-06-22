const { daysAgo } = require("./constants");

/**
 * Notification templates — loan/book refs resolved at seed time by email/seq.
 */
function getNotificationDefs() {
  return [
    { userEmail: "amit.desai@gmail.com", type: "OVERDUE", title: "Book Overdue", message: "Your book 'India After Gandhi' (SVPDL/2024/0001) is overdue. Please return or renew.", bookSeq: 1, loanMemberEmail: "amit.desai@gmail.com", bookSeqForLoan: 1, daysAgo: 8, isRead: false },
    { userEmail: "amit.desai@gmail.com", type: "DUE_TOMORROW", title: "Due Tomorrow", message: "Your book 'The Discovery of India' is due tomorrow.", bookSeq: 2, loanMemberEmail: "amit.desai@gmail.com", bookSeqForLoan: 2, daysAgo: 0, isRead: false },
    { userEmail: "priya.patel@gmail.com", type: "OVERDUE", title: "Book Overdue", message: "Your book 'Gujarat No Itihas' is overdue by 5 days.", bookSeq: 3, loanMemberEmail: "priya.patel@gmail.com", bookSeqForLoan: 3, daysAgo: 4, isRead: true },
    { userEmail: "vikram.solanki@gmail.com", type: "OVERDUE", title: "Book Overdue", message: "Fine reminder: 'Introduction to Algorithms' overdue.", bookSeq: 5, loanMemberEmail: "vikram.solanki@gmail.com", bookSeqForLoan: 5, daysAgo: 10, isRead: false },
    { userEmail: "neha.joshi@gmail.com", type: "FINE_REMINDER", title: "Fine Reminder", message: "Outstanding fine on 'Concepts of Physics Vol 1'. Please pay at circulation desk.", bookSeq: 12, loanMemberEmail: "neha.joshi@gmail.com", bookSeqForLoan: 12, daysAgo: 2, isRead: false },
    { userEmail: "deepak.modi@gmail.com", type: "DUE_TOMORROW", title: "Due Soon", message: "'Engineering Mechanics' due in 7 days.", bookSeq: 6, daysAgo: 1, isRead: false },
    { userEmail: "hitesh.parmar@gmail.com", type: "BOOK_AVAILABLE", title: "Book Available", message: "'Organic Chemistry' reservation is now available for pickup.", bookSeq: 13, daysAgo: 5, isRead: true },
    { userEmail: "mahesh.chauhan@gmail.com", type: "SYSTEM", title: "Welcome to SVPDL", message: "Welcome to Sardar Vallabhbhai Patel District Library, Anand.", daysAgo: 90, isRead: true },
    { userEmail: "asha.raval@gmail.com", type: "SYSTEM", title: "Membership Renewal", message: "Your senior citizen membership is valid until Dec 2026.", daysAgo: 30, isRead: true },
    { userEmail: "kiran.makwana@gmail.com", type: "DUE_TOMORROW", title: "Return Reminder", message: "'Financial Accounting' due in 11 days.", bookSeq: 9, daysAgo: 3, isRead: false },
    { userEmail: "ritu.panchal@gmail.com", type: "BOOK_AVAILABLE", title: "New Arrival", message: "'Ek Duniya Ek Awaaz' is now available in Gujarati section.", bookSeq: 17, daysAgo: 7, isRead: false },
    { userEmail: "suresh.vasava@gmail.com", type: "SYSTEM", title: "Membership Expired", message: "Your membership expired on 31 Dec 2025. Please renew at the desk.", daysAgo: 60, isRead: true },
    { userEmail: "geeta.bhatt@gmail.com", type: "OVERDUE", title: "Overdue Notice", message: "Please return 'Wings of Fire' — loan closed with pending review.", bookSeq: 22, daysAgo: 20, isRead: true },
    { userEmail: "naresh.thakor@gmail.com", type: "DUE_TOMORROW", title: "Due Date Alert", message: "'Computer Networks' due in 6 days.", bookSeq: 37, daysAgo: 0, isRead: false },
    { userEmail: "pooja.shah@gmail.com", type: "FINE_REMINDER", title: "No Fine Due", message: "Thank you for timely returns. You have no outstanding fines.", daysAgo: 15, isRead: true },
    { userEmail: "varsha.prajapati@gmail.com", type: "SYSTEM", title: "Library Hours", message: "SVPDL will remain open 10 AM–6 PM on Saturdays.", daysAgo: 14, isRead: true },
    { userEmail: "jagdish.nayak@gmail.com", type: "BOOK_AVAILABLE", title: "Reserved Book Ready", message: "'Midnight's Children' is ready for collection.", bookSeq: 18, daysAgo: 6, isRead: false },
    { userEmail: "bharat.agrawal@gmail.com", type: "DUE_TOMORROW", title: "Return Reminder", message: "'Digital Electronics' due in 8 days.", bookSeq: 7, daysAgo: 2, isRead: false },
    { userEmail: "chandrika.mehta@gmail.com", type: "SYSTEM", title: "Membership Expired", message: "Your membership expired Dec 2024. Renew to borrow books.", daysAgo: 45, isRead: false },
    { userEmail: "rohit.dave@gmail.com", type: "OVERDUE", title: "Historical Notice", message: "Past overdue resolved — thank you for payment.", daysAgo: 50, isRead: true },
  ].map((n) => ({
    ...n,
    createdAt: daysAgo(n.daysAgo),
    emailSent: n.type === "OVERDUE" || n.type === "FINE_REMINDER",
    emailSentAt: n.type === "OVERDUE" ? daysAgo(n.daysAgo) : null,
  }));
}

module.exports = { getNotificationDefs };
