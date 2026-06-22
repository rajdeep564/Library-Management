const {Schema} = require("mongoose");

const BookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    isbn: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    availableCopies: { type: Number, required: true },
    totalCopies: { type: Number, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User',required: true },
    coverImage: { type: String },
    cloudinaryId: { type: String, required: true },
    qrCode: { type: String, default: "" },
    accessionNo: { type: String, default: "" },
    publisher: { type: String, default: "" },
    publishYear: { type: Number },
    edition: { type: String, default: "" },
    language: { type: String, default: "English" },
    subCategory: { type: String, default: "" },
    location: { type: String, default: "" },
    shelfNo: { type: String, default: "" },
    sourceOfAcquisition: { type: String, default: "" },
    pricePerCopy: { type: Number },
    dateOfAddition: { type: Date },
    keywords: [{ type: String }],
    price: {type:Number},
    seededData: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}) 

module.exports = {BookSchema};