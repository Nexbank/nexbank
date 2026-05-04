import axios from "axios";
import { showNotification } from "../components/Notification";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Surface generic connectivity/server failures globally while keeping page-level
// validation and business-rule messages handled by the calling component.
API.interceptors.response.use(
  (response) => {
    const method = String(response.config?.method || "").toLowerCase();
    const url = String(response.config?.url || "");
    const shouldRefreshNotifications =
      (
        ["post", "patch"].includes(method) &&
        !url.includes("/notifications") &&
        (
          url.includes("/banking/") ||
          url.includes("/auth/login") ||
          url.includes("/auth/set-pin") ||
          url.includes("/auth/change-pin") ||
          url.includes("/auth/verify-pin")
        )
      ) ||
      (method === "get" && url.includes("/banking/cards/") && url.includes("/details"));

    if (shouldRefreshNotifications) {
      window.dispatchEvent(new Event("nexbank-notifications-refresh"));
    }

    return response;
  },
  (error) => {
    const method = String(error.config?.method || "").toLowerCase();
    const url = String(error.config?.url || "");

    if (["post", "patch"].includes(method) && url.includes("/auth/verify-pin")) {
      window.dispatchEvent(new Event("nexbank-notifications-refresh"));
    }

    if (!error.response) {
      showNotification("error", "Network error. Please check your connection and try again.", {
        title: "Connection Error",
      });
    } else if (error.response.status >= 500) {
      showNotification("error", "The server is having trouble right now. Please try again soon.", {
        title: "Server Error",
      });
    }

    return Promise.reject(error);
  }
);
// ✅ ADD THIS
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
