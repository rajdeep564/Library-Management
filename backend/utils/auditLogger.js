const AuditLog = require("../model/AuditLogModel");

const logAction = async ({ action, performedBy, performedByName, performedByRole, targetId, targetType, details, req }) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      performedByName,
      performedByRole,
      targetId,
      targetType,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress || "unknown",
      userAgent: req?.headers?.["user-agent"] || "unknown",
      timestamp: new Date()
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

module.exports = { logAction };
