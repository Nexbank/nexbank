const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },

  // 💰 MONEY
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },

  // 🔁 ACCOUNTING TYPE (THIS IS WHAT MATTERS)
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "transfer"],
    required: true
  },

  // 🧾 BUSINESS CONTEXT (WHAT USER DID)
  category: String,        // Electricity, Airtime, etc.
  billerName: String,      // Eskom, DSTV, etc.

  // 🔥 FLEXIBLE FIELDS
  dynamicFields: {
    type: Map,
    of: String,
    default: {}
  },

  status: {
    type: String,
    enum: ["Completed", "Pending"],
    default: "Completed"
  },

  reference: String,

  createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);