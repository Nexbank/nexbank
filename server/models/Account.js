// models/Account.js
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, default: "Current Account" },
  balance: { type: Number, default: 0 },
  ledgerBalance: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  accountNumber: { type: String, unique: true },
  accountType: { type: String, default: "Current" },
  category: { type: String, default: "cheque" },
  status: { type: String, default: "inactive" },
  isActive: { type: Boolean, default: false },
  minimumFundingAmount: { type: Number, default: 50 },
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
