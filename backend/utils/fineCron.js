const cron = require("node-cron");
const { BorrowModel } = require("../model/BorrowModel");
const calculateFine = require("./fineCalculator");
const { getFineSettings } = require("./systemConfig");
const { logAction } = require("./auditLogger");

async function updateOverdueFines() {
  const config = await getFineSettings();
  const loans = await BorrowModel.find({
    status: { $in: ["Issued", "Requested Return"] },
    dueDate: { $lt: new Date() },
    finePaid: { $ne: true },
    fineWaivedBy: null,
  });

  let updated = 0;
  for (const loan of loans) {
    if (!loan.dueDate) continue;
    const result = calculateFine(loan.dueDate, loan.returnDate, config);
    if (loan.fineAmount !== result.cappedFine || loan.finePerDay !== config.finePerDay) {
      loan.fineAmount = result.cappedFine;
      loan.finePerDay = config.finePerDay;
      await loan.save();
      updated += 1;
    }
  }

  await logAction({
    action: "CRON_FINE_UPDATE",
    performedByName: "System",
    performedByRole: "system",
    targetType: "Borrow",
    details: `Daily fine update completed. Loans updated: ${updated}`,
  });

  return updated;
}

function startFineCron() {
  cron.schedule("0 0 * * *", async () => {
    try {
      await updateOverdueFines();
    } catch (err) {
      console.error("Fine cron error:", err.message);
    }
  });
}

module.exports = { startFineCron, updateOverdueFines };
