// models/Setting.js
const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  twoFactorEnabled: Boolean,
  pushNotificationsEnabled: Boolean,
  language: String,
  theme: String,

  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Setting", settingSchema);
