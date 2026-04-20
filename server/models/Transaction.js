// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  recipientAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },

  amount: Number,
  fee: Number,
  type: String,
  category: String,
  status: String,
  reference: String,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
