const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      "USER_REGISTERED", "USER_LOGIN", "USER_LOGOUT",
      "BOOK_ADDED", "BOOK_UPDATED", "BOOK_DELETED",
      "BOOK_ISSUE_REQUESTED", "BOOK_ISSUE_APPROVED", "BOOK_ISSUE_REJECTED",
      "BOOK_RETURN_REQUESTED", "BOOK_RETURN_APPROVED",
      "FINE_CALCULATED", "FINE_PAID", "FINE_WAIVED",
      "LIBRARIAN_ADDED", "MEMBER_UPDATED",
      "BULK_IMPORT", "REPORT_GENERATED", "SYSTEM_CONFIG_UPDATED", "CRON_FINE_UPDATE",
      "NOTIFICATION_SENT", "NOTIFICATION_CRON"
    ]
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  performedByName: { type: String },
  performedByRole: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetType: { type: String },
  details: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  seededData: { type: Boolean, default: false },
}, { timestamps: false });

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ action: 1 });

module.exports = auditLogSchema;
