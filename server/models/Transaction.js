const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  recipientAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    default: null,
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
    default: null,
  },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "transfer", "bill", "fee"],
    required: true,
  },
  direction: { type: String, default: "" },
  category: { type: String, default: "" },
  status: { type: String, default: "completed" },
  reference: { type: String, default: "" },
  description: { type: String, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ledgerPosted: { type: Boolean, default: false },
  fundsReserved: { type: Boolean, default: false },
  billerName: { type: String, default: "" },
  dynamicFields: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
