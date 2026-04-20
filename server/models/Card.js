// models/Card.js
const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },

  cardType: String,
  last4Digits: String,
  expiryDate: Date,

  isActive: Boolean,
  isLocked: Boolean,
  contactlessEnabled: Boolean,
  onlinePaymentsEnabled: Boolean,
  atmWithdrawalsEnabled: Boolean,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Card", cardSchema);
