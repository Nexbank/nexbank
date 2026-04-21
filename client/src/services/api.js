import axios from "axios";
import { showNotification } from "../components/Notification";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Surface generic connectivity/server failures globally while keeping page-level
// validation and business-rule messages handled by the calling component.
API.interceptors.response.use(
  (response) => response,
  (error) => {
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

export default API;
