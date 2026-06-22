const { SystemConfigModel } = require("../model/SystemConfigModel");
const { DEFAULT_FINE_CONFIG, normalizeConfig } = require("./fineCalculator");

const FINE_SETTINGS_KEY = "fine-settings";

/**
 * Read fine settings from the database with safe defaults.
 * @returns {Promise<{finePerDay:number,maxFineCap:number,gracePeriodDays:number,loanPeriodDays:number}>}
 */
async function getFineSettings() {
  const config = await SystemConfigModel.findOne({ key: FINE_SETTINGS_KEY }).lean();
  return normalizeConfig(config || DEFAULT_FINE_CONFIG);
}

/**
 * Upsert fine settings after normalizing numeric values.
 * @param {object} settings - Fine settings in paisa/days.
 * @param {string} updatedBy - User id that updated settings.
 * @returns {Promise<object>} Saved config document.
 */
async function updateFineSettings(settings, updatedBy) {
  const normalized = normalizeConfig(settings);
  return SystemConfigModel.findOneAndUpdate(
    { key: FINE_SETTINGS_KEY },
    { ...normalized, key: FINE_SETTINGS_KEY, updatedBy },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

module.exports = {
  FINE_SETTINGS_KEY,
  getFineSettings,
  updateFineSettings,
};
