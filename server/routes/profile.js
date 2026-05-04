const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  safeUser.hasPin = Boolean(safeUser.pinHash);
  delete safeUser.password;
  delete safeUser.pinHash;
  return safeUser;
};

// GET logged-in user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("+pinHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// UPDATE user
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { phone, address, location } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { phone, address, location } },
      { new: true }
    ).select("+pinHash");

    res.json({
      message: "Profile updated successfully",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
