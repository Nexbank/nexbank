// models/Transaction.js
<<<<<<< HEAD
const mongoose = require("mongoose");

=======
>>>>>>> development
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

<<<<<<< HEAD
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
=======
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);
>>>>>>> development
