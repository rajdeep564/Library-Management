const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const { getFineSettings, updateFineSettings } = require("../utils/systemConfig");
const { logAction } = require("../utils/auditLogger");

router.get("/fine-settings", userAuth, checkRole("admin", "librarian"), async (req, res) => {
  try {
    const settings = await getFineSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/fine-settings", userAuth, checkRole("admin"), async (req, res) => {
  try {
    const settings = await updateFineSettings(
      {
        finePerDay: req.body.finePerDay,
        maxFineCap: req.body.maxFineCap,
        gracePeriodDays: req.body.gracePeriodDays,
        loanPeriodDays: req.body.loanPeriodDays,
      },
      req.userInfo.id
    );

    await logAction({
      action: "SYSTEM_CONFIG_UPDATED",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetId: settings._id,
      targetType: "SystemConfig",
      details: "Fine settings updated",
      req,
    });

    res.json({ message: "Fine settings saved successfully", settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
