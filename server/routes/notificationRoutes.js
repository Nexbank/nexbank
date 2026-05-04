const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../services/notificationService");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.userId);
    res.json({ notifications });
  } catch (error) {
    console.error("Failed to load notifications", error);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

router.patch("/read-all", async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error("Failed to mark notifications read", error);
    res.status(500).json({ error: "Failed to mark notifications read" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const notification = await markNotificationRead(req.user.userId, req.params.id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification });
  } catch (error) {
    console.error("Failed to mark notification read", error);
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

module.exports = router;
