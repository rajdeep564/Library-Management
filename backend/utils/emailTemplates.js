const LIBRARY_NAME = "e-GranthaAlaya — Ahmedabad Municipal Library Network";
const LIBRARY_ADDRESS = "Ahmedabad Municipal Library Network, Gujarat, India";

function baseTemplate(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
        <div style="background:#1a3c6e;color:#ffffff;padding:16px 20px;">
          <div style="font-size:18px;font-weight:700;">${LIBRARY_NAME}</div>
          <div style="font-size:12px;opacity:0.9;">${title}</div>
        </div>
        <div style="padding:24px 20px;color:#1f2937;line-height:1.6;">
          ${bodyHtml}
        </div>
        <div style="padding:14px 20px;background:#f8fafc;color:#64748b;font-size:12px;border-top:1px solid #e5e7eb;">
          ${LIBRARY_ADDRESS}
        </div>
      </div>
    </div>
  `;
}

function overdueTemplate(memberName, bookTitle, daysOverdue, fineAmount, returnLink = "#") {
  return baseTemplate(
    "Overdue Book Reminder",
    `
      <p>Dear ${memberName},</p>
      <p>Your borrowed book <strong>${bookTitle}</strong> is overdue by <strong>${daysOverdue}</strong> day(s).</p>
      <p>Current fine amount: <strong>₹${fineAmount}</strong></p>
      <p>Please return the book at the earliest to avoid additional fines.</p>
      <p><a href="${returnLink}" style="color:#1a3c6e;">View your library account</a></p>
    `
  );
}

function dueTomorrowTemplate(memberName, bookTitle, dueDate) {
  return baseTemplate(
    "Book Due Tomorrow",
    `
      <p>Dear ${memberName},</p>
      <p>This is a reminder that your borrowed book <strong>${bookTitle}</strong> is due on <strong>${dueDate}</strong>.</p>
      <p>Please return or renew the book on time to avoid overdue fines.</p>
    `
  );
}

function fineReminderTemplate(memberName, totalOutstanding, finesDetail = "") {
  return baseTemplate(
    "Outstanding Fine Reminder",
    `
      <p>Dear ${memberName},</p>
      <p>You have outstanding library fines totaling <strong>₹${totalOutstanding}</strong>.</p>
      ${finesDetail ? `<p>${finesDetail}</p>` : ""}
      <p>Please visit the library circulation desk to settle your dues.</p>
    `
  );
}

function welcomeMemberTemplate(memberName, memberId, libraryName = LIBRARY_NAME) {
  return baseTemplate(
    "Welcome to the Library",
    `
      <p>Dear ${memberName},</p>
      <p>Welcome to <strong>${libraryName}</strong>.</p>
      <p>Your member ID is <strong>${memberId}</strong>.</p>
      <p>You can browse books, request issues, and track your loans through the digital library portal.</p>
    `
  );
}

function systemTemplate(title, message) {
  return baseTemplate(title, `<p>${message}</p>`);
}

module.exports = {
  overdueTemplate,
  dueTomorrowTemplate,
  fineReminderTemplate,
  welcomeMemberTemplate,
  systemTemplate,
};
