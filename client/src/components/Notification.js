import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

const NotificationContext = createContext(null);

const NOTIFICATION_ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
  warning: FiAlertTriangle,
};

let notifyFromAnywhere = null;

function getTimestampLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationToast({ notification, onClose }) {
  const Icon = NOTIFICATION_ICONS[notification.type] || FiInfo;

  return (
    <article
      className={`notification-toast notification-toast--${notification.type}`}
      role={notification.type === "error" || notification.type === "warning" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="notification-toast__icon" aria-hidden="true">
        <Icon size={18} />
      </div>

      <div className="notification-toast__content">
        <div className="notification-toast__header">
          <strong className="notification-toast__title">{notification.title}</strong>
          <span className="notification-toast__time">{notification.timeLabel}</span>
        </div>
        <p className="notification-toast__message">{notification.message}</p>
      </div>

      <button
        type="button"
        className="notification-toast__close"
        aria-label={`Close ${notification.title} notification`}
        onClick={() => onClose(notification.id)}
      >
        <FiX size={16} />
      </button>
    </article>
  );
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationFeed, setNotificationFeed] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const timeoutMapRef = useRef(new Map());

  const removeNotification = useCallback((id) => {
    const timeoutId = timeoutMapRef.current.get(id);

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }

    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback((type, message, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const titleMap = {
      success: "Success",
      error: "Error",
      info: "Info",
      warning: "Security Alert",
    };

    const nextNotification = {
      id,
      type,
      title: options.title || titleMap[type] || "Notification",
      message,
      duration: options.duration ?? 5000,
      timeLabel: getTimestampLabel(),
      createdAt: Date.now(),
      source: options.source || "frontend",
    };

    setNotifications((current) => [nextNotification, ...current]);

    if (nextNotification.duration > 0) {
      const timeoutId = window.setTimeout(() => {
        removeNotification(id);
      }, nextNotification.duration);

      timeoutMapRef.current.set(id, timeoutId);
    }

    return id;
  }, [removeNotification]);

  const getAuthHeaders = useCallback(() => {
    const token = window.localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!window.localStorage.getItem("token")) {
      setNotificationFeed([]);
      return [];
    }

    try {
      setIsLoadingNotifications(true);
      const response = await axios.get("http://localhost:5000/api/notifications", {
        headers: getAuthHeaders(),
      });
      const nextNotifications = Array.isArray(response.data?.notifications)
        ? response.data.notifications
        : [];

      setNotificationFeed(nextNotifications);
      return nextNotifications;
    } catch {
      return [];
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [getAuthHeaders]);

  const markNotificationRead = useCallback(
    async (notificationId) => {
      if (!notificationId) {
        return null;
      }

      const response = await axios.patch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      await refreshNotifications();
      return response.data?.notification || null;
    },
    [getAuthHeaders, refreshNotifications]
  );

  const markAllNotificationsRead = useCallback(async () => {
    const response = await axios.patch(
      "http://localhost:5000/api/notifications/read-all",
      {},
      { headers: getAuthHeaders() }
    );
    await refreshNotifications();
    return response.data;
  }, [getAuthHeaders, refreshNotifications]);

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;

    notifyFromAnywhere = addNotification;

    return () => {
      notifyFromAnywhere = null;
      timeoutMap.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutMap.clear();
    };
  }, [addNotification]);

  useEffect(() => {
    refreshNotifications().catch(() => {});

    const handleRefresh = () => {
      refreshNotifications().catch(() => {});
    };

    const handleAuthChanged = () => {
      if (!window.localStorage.getItem("token")) {
        setNotificationFeed([]);
        return;
      }

      refreshNotifications().catch(() => {});
    };

    window.addEventListener("nexbank-notifications-refresh", handleRefresh);
    window.addEventListener("nexbank-auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("nexbank-notifications-refresh", handleRefresh);
      window.removeEventListener("nexbank-auth-changed", handleAuthChanged);
    };
  }, [refreshNotifications]);

  const unreadCount = useMemo(
    () => notificationFeed.filter((notification) => !notification.isRead).length,
    [notificationFeed]
  );

  const value = useMemo(
    () => ({
      notifications,
      notificationFeed,
      unreadCount,
      isLoadingNotifications,
      showNotification: addNotification,
      removeNotification,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      addNotification,
      isLoadingNotifications,
      markAllNotificationsRead,
      markNotificationRead,
      notificationFeed,
      notifications,
      refreshNotifications,
      removeNotification,
      unreadCount,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="notification-stack" aria-label="System notifications" aria-live="polite">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider.");
  }

  return context;
}

export function showNotification(type, message, options = {}) {
  if (notifyFromAnywhere) {
    return notifyFromAnywhere(type, message, options);
  }

  return null;
}

export default function Notification() {
  return null;
}
