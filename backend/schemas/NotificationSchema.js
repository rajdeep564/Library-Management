const { Schema } = require("mongoose");

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["OVERDUE", "DUE_TOMORROW", "BOOK_AVAILABLE", "FINE_REMINDER", "SYSTEM"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Borrow", default: null },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    seededData: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = { NotificationSchema };
