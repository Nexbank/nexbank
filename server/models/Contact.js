// models/Contact.js
<<<<<<< HEAD
const mongoose = require("mongoose");

=======
>>>>>>> development
const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  name: String,
  accountNumber: String,
  bankName: String,
  isVerified: { type: Boolean, default: false },

<<<<<<< HEAD
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Contact", contactSchema);
=======
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Contact", contactSchema);
>>>>>>> development
