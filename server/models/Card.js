// models/Card.js
<<<<<<< HEAD
const mongoose = require("mongoose");

=======
>>>>>>> development
const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },

  cardType: String,
  last4Digits: String,
  expiryDate: Date,

  isActive: Boolean,
  isLocked: Boolean,
  contactlessEnabled: Boolean,
  onlinePaymentsEnabled: Boolean,
  atmWithdrawalsEnabled: Boolean,

<<<<<<< HEAD
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Card", cardSchema);
=======
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Card", cardSchema);
>>>>>>> development
