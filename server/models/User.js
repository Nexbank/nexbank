const mongoose = require("mongoose");
 
const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true
  },
 
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
 
  password: {
    type: String,
    required: true
  },
 
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
 
  saIdNumber: {
    type: String,
    unique: true,
    sparse: true
  },
 
  location: {
    type: String,
    required: true
  },
 
  isActive: {
    type: Boolean,
    default: true
  },
 
  createdAt: {
    type: Date,
    default: Date.now
  }
});
 
module.exports = mongoose.model("User", userSchema);