import axios from "axios";
import { env } from "@/config/env";

const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response?.status;

    switch (status) {
      case 401:
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
        break;

      case 403:
        console.error("You do not have permission to access this resource.");
        break;

      case 500:
        console.error("Server error. Please try again later.");
        break;

      default:
        break;
    }

    return Promise.reject(error);
  },
);

export default apiClient;
