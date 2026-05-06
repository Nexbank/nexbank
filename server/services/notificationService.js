const Notification = require("../models/Notification");

const VALID_TYPES = new Set([
  "auth",
  "security",
  "account",
  "transaction",
  "card",
  "system",
]);

function normalizePayload(payload = {}) {
  const type = VALID_TYPES.has(payload.type) ? payload.type : "system";

  return {
    title: String(payload.title || "Notification").trim(),
    message: String(payload.message || "").trim(),
    type,
    isRead: Boolean(payload.isRead),
    metadata: payload.metadata || {},
  };
}

async function createNotification(userId, payload = {}) {
  if (!userId) {
    return null;
  }

  const notificationPayload = normalizePayload(payload);
  if (!notificationPayload.message) {
    return null;
  }

  try {
    return await Notification.create({
      userId,
      ...notificationPayload,
    });
  } catch (error) {
    console.error("Failed to create notification", error?.message || error);
    return null;
  }
}

async function getUserNotifications(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
}

async function markNotificationRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  ).lean();
}

async function markAllNotificationsRead(userId) {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
