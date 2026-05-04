import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
    setNotificationFeed((current) => [nextNotification, ...current].slice(0, 8));

    if (nextNotification.duration > 0) {
      const timeoutId = window.setTimeout(() => {
        removeNotification(id);
      }, nextNotification.duration);

      timeoutMapRef.current.set(id, timeoutId);
    }

    return id;
  }, [removeNotification]);

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;

    notifyFromAnywhere = addNotification;

    return () => {
      notifyFromAnywhere = null;
      timeoutMap.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutMap.clear();
    };
  }, [addNotification]);

  const value = useMemo(
    () => ({
      notifications,
      notificationFeed,
      showNotification: addNotification,
      removeNotification,
    }),
    [addNotification, notificationFeed, notifications, removeNotification]
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
