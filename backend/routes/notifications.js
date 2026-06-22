const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");
const { NotificationModel } = require("../model/NotificationModel");
const { UserModel } = require("../model/UserModel");
const { logAction } = require("../utils/auditLogger");
const {
  DEFAULT_PREFS,
  sendManualNotification,
  getUserPrefs,
} = require("../utils/notificationService");

router.get("/", userAuth, async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.userInfo.id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/unread-count", userAuth, async (req, res) => {
  try {
    const count = await NotificationModel.countDocuments({
      userId: req.userInfo.id,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/preferences", userAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userInfo.id).select("notificationPreferences");
    res.json({ preferences: getUserPrefs(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/preferences", userAuth, async (req, res) => {
  try {
    const user = await UserModel.findByIdAndUpdate(
      req.userInfo.id,
      {
        notificationPreferences: {
          emailOverdue: req.body.emailOverdue ?? DEFAULT_PREFS.emailOverdue,
          emailDueTomorrow: req.body.emailDueTomorrow ?? DEFAULT_PREFS.emailDueTomorrow,
          emailFineReminder: req.body.emailFineReminder ?? DEFAULT_PREFS.emailFineReminder,
          inAppAll: req.body.inAppAll ?? DEFAULT_PREFS.inAppAll,
        },
      },
      { new: true }
    ).select("notificationPreferences");

    res.json({ message: "Notification preferences saved", preferences: getUserPrefs(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/read", userAuth, async (req, res) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userInfo.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/read-all", userAuth, async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.userInfo.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", userAuth, async (req, res) => {
  try {
    const notification = await NotificationModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.userInfo.id,
    });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/send", userAuth, checkRole("admin"), async (req, res) => {
  try {
    const { recipientType, userId, title, message, sendInApp = true, sendEmail = false } = req.body;
    if (!title || !message || !recipientType) {
      return res.status(400).json({ message: "recipientType, title, and message are required" });
    }

    const sent = await sendManualNotification({
      recipientType,
      userId,
      title,
      message,
      sendInApp,
      sendEmail,
    });

    await logAction({
      action: "NOTIFICATION_SENT",
      performedBy: req.userInfo.id,
      performedByName: req.userInfo.name,
      performedByRole: req.userInfo.role,
      targetType: "Notification",
      details: `Manual notification sent to ${recipientType}: "${title}" (${sent} recipients)`,
      req,
    });

    res.json({ message: "Notification sent", sent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
