const {Schema} = require("mongoose");

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["admin", "librarian", "user"], 
      default: "user" 
    },
    stream: { 
      type: String, 
      required: function() { return this.role === "user"; } 
  },
  year: { 
      type: Number, 
      required: function() { return this.role === "user"; } 
  },
  qrCode: { type: String, default: "" },
  memberId: { type: String, default: "" },
  notificationPreferences: {
    emailOverdue: { type: Boolean, default: true },
    emailDueTomorrow: { type: Boolean, default: true },
    emailFineReminder: { type: Boolean, default: true },
    inAppAll: { type: Boolean, default: true },
  },
  phone: { type: String, default: "" },
  employeeId: { type: String, default: "" },
  department: { type: String, default: "" },
  membershipType: { type: String, default: "" },
  membershipExpiry: { type: Date },
  city: { type: String, default: "" },
  isSeedData: { type: Boolean, default: false },
  seededData: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = {UserSchema};