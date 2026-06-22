const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const AuditLog = require("../model/AuditLogModel");

router.get("/", userAuth, checkRole("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action || null;
    const skip = (page - 1) * limit;

    const filter = {};
    if (action) filter.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
