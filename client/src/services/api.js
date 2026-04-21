import axios from "axios";

const resolveApiBaseUrl = () => process.env.REACT_APP_API_BASE_URL || "/api";

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
});

API.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
