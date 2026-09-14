// =====================  AXIOS HTTP CLIENT  ==================
import axios from "axios";
import { tokenStorage } from "../auth/token-storage.js";
import { AppApiError } from "./api-error.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Inject Auth Token & Building Scope
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeBuildingId = tokenStorage.getActiveBuildingId();
    if (activeBuildingId) {
      config.headers["x-building-id"] = activeBuildingId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: JSend normalization and 401 redirection
apiClient.interceptors.response.use(
  (response) => {
    // Backend standard JSend payload format: { success: true, data: { ... }, message: "...", meta: { ... } }
    if (response.data && typeof response.data === "object") {
      if (response.data.data !== undefined) {
        if (
          response.data.meta !== undefined &&
          response.data.data &&
          typeof response.data.data === "object" &&
          response.data.data.meta === undefined
        ) {
          response.data.data.meta = response.data.meta;
        }
        return response.data.data;
      }
      return response.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;

    // Handle token expiration or unauthorized session
    if (status === 401) {
      tokenStorage.clearAll();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/forgot-password") &&
        !window.location.pathname.startsWith("/reset-password")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(AppApiError.fromAxiosError(error));
  }
);

export default apiClient;
