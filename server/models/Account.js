// models/Account.js
<<<<<<< HEAD
const mongoose = require("mongoose");

=======
>>>>>>> development
const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  accountNumber: { type: String, unique: true },
  accountType: String,
  status: String,
<<<<<<< HEAD
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Account", accountSchema);
=======
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Account", accountSchema);
>>>>>>> development
