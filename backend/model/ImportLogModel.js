const { model } = require("mongoose");
const { ImportLogSchema } = require("../schemas/ImportLogSchema");

const ImportLogModel = new model("ImportLog", ImportLogSchema);

module.exports = { ImportLogModel };
