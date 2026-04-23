const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    let settings = await Setting.findOne({ userId });
    
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
    
    res.json({
      preferences: {
        twoFactor: settings.twoFactorEnabled,
        pushNotifications: settings.pushNotificationsEnabled,
        doNotDisturb: settings.doNotDisturbEnabled,
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { twoFactor, pushNotifications, doNotDisturb } = req.body;
    
    let settings = await Setting.findOne({ userId });
    
    if (!settings) {
      settings = new Setting({ userId });
    }
    
    if (twoFactor !== undefined) settings.twoFactorEnabled = twoFactor;
    if (pushNotifications !== undefined) settings.pushNotificationsEnabled = pushNotifications;
    if (doNotDisturb !== undefined) settings.doNotDisturbEnabled = doNotDisturb;
    
    await settings.save();
    
    res.json({ 
      success: true, 
      message: "Settings updated successfully"
    });
    
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;