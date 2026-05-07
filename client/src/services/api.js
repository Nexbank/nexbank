import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "token";

export const readAuthToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const normalizedToken = String(token || "").trim();

  if (
    !normalizedToken ||
    normalizedToken === "undefined" ||
    normalizedToken === "null"
  ) {
    return "";
  }

  return normalizedToken;
};

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
  const token = readAuthToken();

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  } else if (req.headers?.Authorization) {
    delete req.headers.Authorization;
  }

  return req;
});

export default API;
