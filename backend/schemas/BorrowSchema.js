const {Schema} = require("mongoose");

const BorrowSchema = new Schema({
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
  fineAmount: { type: Number, default: 0 },
  finePerDay: { type: Number, default: 100 },
  finePaid: { type: Boolean, default: false },
  finePaidAt: { type: Date, default: null },
  finePaidBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  fineWaivedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  fineWaivedReason: { type: String, default: "" },
  fineWaivedAt: { type: Date, default: null },
  fineWaivedAmount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Online", "Cheque", ""],
    default: "",
  },
  status: { type: String, enum: ["Requested","Issued","Requested Return", "Returned"], default: "Requested" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  renewCount: { type: Number, default: 0 },
  seededData: { type: Boolean, default: false },

},{ timestamps: true })

module.exports = {BorrowSchema};



