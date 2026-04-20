const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
<<<<<<< Updated upstream
  email: String,

  password: String,

  displayName: String,

  balance: { type: Number, default: 15000 },
=======
  firstname: String,
  surname: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: String,
  phone: String,
  saIdNumber: String,
  address: String,
  location: String,
  createdAt: { type: Date, default: Date.now },
>>>>>>> Stashed changes
});

module.exports = mongoose.model("User", userSchema);
