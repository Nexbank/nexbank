// models/Setting.js
<<<<<<< HEAD
const mongoose = require("mongoose");

=======
>>>>>>> development
const settingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  twoFactorEnabled: Boolean,
  pushNotificationsEnabled: Boolean,
  language: String,
  theme: String,

<<<<<<< HEAD
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Setting", settingSchema);
=======
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Setting", settingSchema);
>>>>>>> development
