import axios from "axios";

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== "undefined") {
    const isLocalReactDevServer =
      window.location.hostname === "localhost" &&
      window.location.port === "3000";

    return isLocalReactDevServer ? "http://localhost:5000/api" : "/api";
  }

  return "http://localhost:5000/api";
};

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// ✅ ADD THIS
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
