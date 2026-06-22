const { model } = require("mongoose");
const { NotificationSchema } = require("../schemas/NotificationSchema");

const NotificationModel = model("Notification", NotificationSchema);

module.exports = { NotificationModel };
