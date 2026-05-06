const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: String,
  email: String,
  phone: String,
  type: {
  type: String,
  enum: ["email", "login"], // ✅ FIXED
  required: true
},
  otp: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Otp", otpSchema);