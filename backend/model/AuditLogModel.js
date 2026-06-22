const mongoose = require("mongoose");
const auditLogSchema = require("../schemas/auditLogSchema");
module.exports = mongoose.model("AuditLog", auditLogSchema);
