const MS_PER_DAY = 1000 * 60 * 60 * 24;

const DEFAULT_FINE_CONFIG = {
  finePerDay: 100,
  maxFineCap: 50000,
  gracePeriodDays: 0,
  loanPeriodDays: 14,
};

function normalizeConfig(config = {}) {
  return {
    finePerDay: Number.isFinite(Number(config.finePerDay))
      ? Math.max(0, Number(config.finePerDay))
      : DEFAULT_FINE_CONFIG.finePerDay,
    maxFineCap: Number.isFinite(Number(config.maxFineCap))
      ? Math.max(0, Number(config.maxFineCap))
      : DEFAULT_FINE_CONFIG.maxFineCap,
    gracePeriodDays: Number.isFinite(Number(config.gracePeriodDays))
      ? Math.max(0, Number(config.gracePeriodDays))
      : DEFAULT_FINE_CONFIG.gracePeriodDays,
    loanPeriodDays: Number.isFinite(Number(config.loanPeriodDays))
      ? Math.max(1, Number(config.loanPeriodDays))
      : DEFAULT_FINE_CONFIG.loanPeriodDays,
  };
}

/**
 * Calculate an overdue fine in paisa.
 * @param {Date|string} dueDate - Loan due date.
 * @param {Date|string|null} returnDate - Actual return date or current date.
 * @param {object} config - Fine settings stored in paisa/days.
 * @returns {{daysOverdue:number, rawFine:number, cappedFine:number, gracePeriodApplied:number}}
 */
function calculateFine(dueDate, returnDate, config = {}) {
  const settings = normalizeConfig(config);
  if (!dueDate) {
    return { daysOverdue: 0, rawFine: 0, cappedFine: 0, gracePeriodApplied: 0 };
  }

  const effectiveReturnDate = returnDate ? new Date(returnDate) : new Date();
  const due = new Date(dueDate);

  if (Number.isNaN(due.getTime()) || Number.isNaN(effectiveReturnDate.getTime())) {
    return { daysOverdue: 0, rawFine: 0, cappedFine: 0, gracePeriodApplied: 0 };
  }

  const diffDays = Math.ceil((effectiveReturnDate - due) / MS_PER_DAY);
  const daysOverdue = Math.max(0, diffDays - settings.gracePeriodDays);
  const rawFine = Math.max(0, daysOverdue * settings.finePerDay);
  const cappedFine = Math.min(rawFine, settings.maxFineCap);

  return {
    daysOverdue,
    rawFine,
    cappedFine,
    gracePeriodApplied: Math.min(Math.max(0, diffDays), settings.gracePeriodDays),
  };
}

module.exports = calculateFine;
module.exports.calculateFine = calculateFine;
module.exports.normalizeConfig = normalizeConfig;
module.exports.DEFAULT_FINE_CONFIG = DEFAULT_FINE_CONFIG;