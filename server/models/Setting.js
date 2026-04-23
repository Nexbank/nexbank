const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  twoFactorEnabled: { 
    type: Boolean, 
    default: false 
  },
  pushNotificationsEnabled: { 
    type: Boolean, 
    default: true 
  },
  doNotDisturbEnabled: { 
    type: Boolean, 
    default: false 
  },
  language: { 
    type: String, 
    default: "en" 
  },
  theme: { 
    type: String, 
    default: "dark" 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Setting", settingSchema);