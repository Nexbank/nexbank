const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: String,
  email: String,
  phone: String,
  type: { type: String, enum: ["email", "phone"] },
  otp: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Otp", otpSchema);