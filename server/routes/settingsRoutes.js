const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const authMiddleware = require("../middleware/authMiddleware");

// GET settings - this loads your saved settings
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Try to find settings for this user
    let settings = await Setting.findOne({ userId });
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new Setting({
        userId,
        twoFactorEnabled: false,
        pushNotificationsEnabled: true,
        doNotDisturbEnabled: false,
        language: "en",
        theme: "dark"
      });
      await settings.save();
    }
    
    // Send back to your Settings page
    res.json({
      preferences: {
        twoFactor: settings.twoFactorEnabled,
        pushNotifications: settings.pushNotificationsEnabled,
        doNotDisturb: settings.doNotDisturbEnabled,
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// UPDATE settings - this saves your settings
router.put("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { twoFactor, pushNotifications, doNotDisturb } = req.body;
    
    // Find settings for this user
    let settings = await Setting.findOne({ userId });
    
    if (!settings) {
      settings = new Setting({ userId });
    }
    
    // Update the settings
    if (twoFactor !== undefined) settings.twoFactorEnabled = twoFactor;
    if (pushNotifications !== undefined) settings.pushNotificationsEnabled = pushNotifications;
    if (doNotDisturb !== undefined) settings.doNotDisturbEnabled = doNotDisturb;
    
    await settings.save();
    
    res.json({ 
      success: true, 
      message: "Settings updated successfully"
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;