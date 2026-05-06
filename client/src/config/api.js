import API from "../services/api";

export const API_BASE_URL = API.defaults.baseURL || "/api";

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (API_BASE_URL.endsWith("/api")) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return `${API_BASE_URL}/api${normalizedPath}`;
};
