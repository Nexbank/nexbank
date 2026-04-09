const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,

  password: String,

  displayName: String,

  balance: { type: Number, default: 15000 },
});

module.exports = mongoose.model("User", userSchema);
