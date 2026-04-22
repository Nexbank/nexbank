// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  recipientAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card", default: null },

  amount: Number,
  fee: Number,
  type: String,
  direction: String,
  category: String,
  status: String,
  reference: String,
  description: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ledgerPosted: { type: Boolean, default: false },
  fundsReserved: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
