const { model } = require("mongoose");
const { SystemConfigSchema } = require("../schemas/SystemConfigSchema");

const SystemConfigModel = new model("SystemConfig", SystemConfigSchema);

module.exports = { SystemConfigModel };
