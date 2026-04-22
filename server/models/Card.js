// models/Card.js
const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },

  cardType: String,
  cardName: String,
  last4Digits: String,
  expiryDate: Date,
  status: { type: String, default: "active" },

  isActive: Boolean,
  isLocked: Boolean,
  contactlessEnabled: Boolean,
  onlinePaymentsEnabled: Boolean,
  atmWithdrawalsEnabled: Boolean,
  maskedPan: String,
  cvv: String,
  replacedByCardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card", default: null },
  replacedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Card", cardSchema);
