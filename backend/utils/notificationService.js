const { NotificationModel } = require("../model/NotificationModel");
const { BorrowModel } = require("../model/BorrowModel");
const { UserModel } = require("../model/UserModel");
const calculateFine = require("./fineCalculator");
const { getFineSettings } = require("./systemConfig");
const { sendEmail } = require("./emailSender");
const {
  overdueTemplate,
  dueTomorrowTemplate,
  fineReminderTemplate,
  welcomeMemberTemplate,
  systemTemplate,
} = require("./emailTemplates");

const DEFAULT_PREFS = {
  emailOverdue: true,
  emailDueTomorrow: true,
  emailFineReminder: true,
  inAppAll: true,
};

function formatRupees(paisa = 0) {
  return (Number(paisa || 0) / 100).toFixed(2);
}

function getUserPrefs(user) {
  return { ...DEFAULT_PREFS, ...(user?.notificationPreferences || {}) };
}

async function createNotification(userId, type, title, message, meta = {}, options = {}) {
  const notification = await NotificationModel.create({
    userId,
    type,
    title,
    message,
    loanId: meta.loanId || null,
    bookId: meta.bookId || null,
  });

  if (options.sendEmail && options.email && options.subject && options.html) {
    const sent = await sendEmail(options.email, options.subject, options.html);
    if (sent) {
      notification.emailSent = true;
      notification.emailSentAt = new Date();
      await notification.save();
    }
  }

  return notification;
}

async function notifyUser(user, type, title, message, meta = {}, emailOptions = null) {
  const prefs = getUserPrefs(user);
  if (!prefs.inAppAll && !emailOptions) return null;

  const options = {};
  if (emailOptions && emailOptions.enabled) {
    options.sendEmail = true;
    options.email = user.email;
    options.subject = emailOptions.subject;
    options.html = emailOptions.html;
  }

  if (!prefs.inAppAll && options.sendEmail) {
    await sendEmail(user.email, options.subject, options.html);
    return null;
  }

  return createNotification(user._id, type, title, message, meta, options);
}

async function notifyOverdueBooks() {
  const config = await getFineSettings();
  const now = new Date();
  const loans = await BorrowModel.find({
    status: { $in: ["Issued", "Requested Return"] },
    dueDate: { $lt: now },
  })
    .populate("userId", "name email notificationPreferences role")
    .populate("bookId", "title");

  let created = 0;
  for (const loan of loans) {
    const user = loan.userId;
    const book = loan.bookId;
    if (!user || user.role !== "user" || !book) continue;

    const prefs = getUserPrefs(user);
    const result = calculateFine(loan.dueDate, now, config);
    const daysOverdue = result.daysOverdue;
    const fineAmount = formatRupees(result.cappedFine);
    const title = "Book overdue";
    const message = `"${book.title}" is overdue by ${daysOverdue} day(s). Fine: ₹${fineAmount}`;

    const existing = await NotificationModel.findOne({
      userId: user._id,
      loanId: loan._id,
      type: "OVERDUE",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (existing) continue;

    await notifyUser(
      user,
      "OVERDUE",
      title,
      message,
      { loanId: loan._id, bookId: book._id },
      prefs.emailOverdue
        ? {
            enabled: true,
            subject: `Overdue reminder: ${book.title}`,
            html: overdueTemplate(user.name, book.title, daysOverdue, fineAmount),
          }
        : null
    );
    created += 1;
  }
  return created;
}

async function notifyDueTomorrow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const loans = await BorrowModel.find({
    status: "Issued",
    dueDate: { $gte: start, $lte: end },
  })
    .populate("userId", "name email notificationPreferences role")
    .populate("bookId", "title");

  let created = 0;
  for (const loan of loans) {
    const user = loan.userId;
    const book = loan.bookId;
    if (!user || user.role !== "user" || !book) continue;

    const prefs = getUserPrefs(user);
    const dueDate = new Date(loan.dueDate).toLocaleDateString("en-IN");
    const title = "Book due tomorrow";
    const message = `"${book.title}" is due on ${dueDate}.`;

    const existing = await NotificationModel.findOne({
      userId: user._id,
      loanId: loan._id,
      type: "DUE_TOMORROW",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (existing) continue;

    await notifyUser(
      user,
      "DUE_TOMORROW",
      title,
      message,
      { loanId: loan._id, bookId: book._id },
      prefs.emailDueTomorrow
        ? {
            enabled: true,
            subject: `Due tomorrow: ${book.title}`,
            html: dueTomorrowTemplate(user.name, book.title, dueDate),
          }
        : null
    );
    created += 1;
  }
  return created;
}

async function notifyFineReminder() {
  const loans = await BorrowModel.find({
    fineAmount: { $gt: 0 },
    finePaid: { $ne: true },
    fineWaivedBy: null,
  })
    .populate("userId", "name email notificationPreferences role")
    .populate("bookId", "title");

  const grouped = new Map();
  for (const loan of loans) {
    const user = loan.userId;
    if (!user || user.role !== "user") continue;
    if (!grouped.has(String(user._id))) grouped.set(String(user._id), { user, loans: [] });
    grouped.get(String(user._id)).loans.push(loan);
  }

  let created = 0;
  for (const { user, loans: userLoans } of grouped.values()) {
    const prefs = getUserPrefs(user);
    const total = userLoans.reduce((sum, loan) => sum + (loan.fineAmount || 0), 0);
    const totalOutstanding = formatRupees(total);
    const finesDetail = userLoans
      .slice(0, 3)
      .map((loan) => `${loan.bookId?.title || "Book"}: ₹${formatRupees(loan.fineAmount)}`)
      .join("; ");

    const existing = await NotificationModel.findOne({
      userId: user._id,
      type: "FINE_REMINDER",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    if (existing) continue;

    await notifyUser(
      user,
      "FINE_REMINDER",
      "Outstanding fine reminder",
      `You have outstanding fines totaling ₹${totalOutstanding}.`,
      {},
      prefs.emailFineReminder
        ? {
            enabled: true,
            subject: "Outstanding library fine reminder",
            html: fineReminderTemplate(user.name, totalOutstanding, finesDetail),
          }
        : null
    );
    created += 1;
  }
  return created;
}

async function sendWelcomeMember(user) {
  const memberId = user.memberId || user._id;
  return notifyUser(
    user,
    "SYSTEM",
    "Welcome to e-GranthaAlaya",
    `Your member ID is ${memberId}. Welcome to the library network.`,
    {},
    {
      enabled: true,
      subject: "Welcome to e-GranthaAlaya",
      html: welcomeMemberTemplate(user.name, memberId),
    }
  );
}

async function sendManualNotification({
  recipientType,
  userId,
  title,
  message,
  sendInApp = true,
  sendEmail = false,
}) {
  let users = [];
  if (recipientType === "member") {
    users = await UserModel.find({ role: "user" }).select("name email notificationPreferences role memberId");
  } else if (recipientType === "librarian") {
    users = await UserModel.find({ role: "librarian" }).select("name email notificationPreferences role memberId");
  } else if (recipientType === "specific" && userId) {
    const user = await UserModel.findById(userId).select("name email notificationPreferences role memberId");
    if (user) users = [user];
  } else if (recipientType === "all") {
    users = await UserModel.find({ role: { $in: ["user", "librarian"] } }).select(
      "name email notificationPreferences role memberId"
    );
  }

  let sent = 0;
  for (const user of users) {
    if (sendInApp) {
      await createNotification(user._id, "SYSTEM", title, message);
    }
    if (sendEmail) {
      await sendEmail(user.email, title, systemTemplate(title, message));
    }
    if (sendInApp || sendEmail) sent += 1;
  }
  return sent;
}

module.exports = {
  DEFAULT_PREFS,
  createNotification,
  sendEmail,
  notifyOverdueBooks,
  notifyDueTomorrow,
  notifyFineReminder,
  sendWelcomeMember,
  sendManualNotification,
  getUserPrefs,
};
