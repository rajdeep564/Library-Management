const { Schema } = require("mongoose");

const ImportLogSchema = new Schema(
  {
    fileName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PREVIEWED", "SUCCESS", "FAILED"],
      default: "PREVIEWED",
    },
    attemptedRows: { type: Number, default: 0 },
    insertedRows: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    summary: { type: String, default: "" },
    errorDetails: [
      {
        row: Number,
        field: String,
        message: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = { ImportLogSchema };
