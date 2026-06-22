const { Schema } = require("mongoose");

const SystemConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "fine-settings" },
    finePerDay: { type: Number, default: 100 },
    maxFineCap: { type: Number, default: 50000 },
    gracePeriodDays: { type: Number, default: 0 },
    loanPeriodDays: { type: Number, default: 14 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    testDataSeeded: { type: Boolean, default: false },
    libraryName: { type: String, default: "" },
    libraryCode: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    headLibrarian: { type: String, default: "" },
    establishedYear: { type: Number },
    maxRenewals: { type: Number, default: 2 },
    booksPerMember: { type: Number, default: 3 },
    workingDays: [{ type: String }],
    workingHours: { type: String, default: "" },
    smtpConfigured: { type: Boolean, default: false },
    seededData: { type: Boolean, default: false },
  },
  { timestamps: true, strict: false }
);

module.exports = { SystemConfigSchema };
