const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },

  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },

  type: {
    type: String,
    enum: ["deposit", "withdrawal", "transfer", "bill"],
    required: true
  },
  category: { type: String },
  reference: { type: String },
  status: { type: String, default: "Completed" },
  
  // Add bill-specific fields (like profile has all its fields)
  billerName: { type: String },
  dynamicFields: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);