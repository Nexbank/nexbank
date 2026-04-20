// models/Notification.js
<<<<<<< HEAD
const mongoose = require("mongoose");

=======
>>>>>>> development
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  title: String,
  message: String,
  type: String,
  isRead: { type: Boolean, default: false },

<<<<<<< HEAD
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
=======
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
>>>>>>> development
