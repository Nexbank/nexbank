// models/Account.js
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, default: "Main Account" },
  balance: { type: Number, default: 0 },
  ledgerBalance: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  accountNumber: { type: String, unique: true },
  accountType: { type: String, default: "current" },
  category: { type: String, default: "transactional" },
  status: { type: String, default: "active" },
  isActive: { type: Boolean, default: true },
  isLedgerConsistent: { type: Boolean, default: true },
  closedAt: { type: Date, default: null },
  closedReason: { type: String, default: null },
  limits: {
    deposit: { type: Number, default: 50000 },
    withdrawalCash: { type: Number, default: 3000 },
    withdrawalBank: { type: Number, default: 10000 },
    transferInternal: { type: Number, default: 20000 },
    transferExternal: { type: Number, default: 10000 },
    voucher: { type: Number, default: 3000 },
    bill: { type: Number, default: 15000 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Account", accountSchema);
