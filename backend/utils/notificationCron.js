const cron = require("node-cron");
const {
  notifyDueTomorrow,
  notifyOverdueBooks,
  notifyFineReminder,
} = require("./notificationService");
const { logAction } = require("./auditLogger");

async function runNotificationJob(name, fn) {
  const count = await fn();
  await logAction({
    action: "NOTIFICATION_CRON",
    performedByName: "System",
    performedByRole: "system",
    targetType: "Notification",
    details: `${name} completed. Notifications created: ${count}`,
  });
  return count;
}

function startNotificationCron() {
  cron.schedule("0 9 * * *", async () => {
    try {
      await runNotificationJob("Due tomorrow notifications", notifyDueTomorrow);
    } catch (err) {
      console.error("Due tomorrow cron error:", err.message);
    }
  });

  cron.schedule("0 10 * * *", async () => {
    try {
      await runNotificationJob("Overdue notifications", notifyOverdueBooks);
    } catch (err) {
      console.error("Overdue cron error:", err.message);
    }
  });

  cron.schedule("0 9 * * 1", async () => {
    try {
      await runNotificationJob("Fine reminder notifications", notifyFineReminder);
    } catch (err) {
      console.error("Fine reminder cron error:", err.message);
    }
  });
}

module.exports = { startNotificationCron };
