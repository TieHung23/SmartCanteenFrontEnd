import axios from "axios";
import { env } from "@/config/env";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
    config.headers["X-Api-Version"] = "1.0";
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
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 🔍 XỬ LÝ RIÊNG ĐẦU LỖI 401 UNAUTHORIZED
    if (status === 401 && !originalRequest._retry) {
      // Fix lỗi 1: Nếu lỗi xảy ra ngay tại API Login hoặc Refresh -> Sút thẳng về Login luôn
      if (
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN) ||
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN)
      ) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Fix lỗi 2: Xóa dấu chấm phẩy chặn xích Promise. Chờ giải cứu request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken =
        typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

      if (!storedRefreshToken) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Fix lỗi 3: Sắp xếp lại trật tự try-catch-finally chuẩn chỉ
      try {
        const refreshResponse = await axios.post<{
          value: { accessToken: string; refreshToken?: string };
        }>(`${env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
          refreshToken: storedRefreshToken,
        });

        const newTokens = refreshResponse.data?.value;
        if (newTokens?.accessToken) {
          localStorage.setItem("accessToken", newTokens.accessToken);
          if (newTokens.refreshToken) {
            localStorage.setItem("refreshToken", newTokens.refreshToken);
          }

          processQueue(null, newTokens.accessToken);

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        // Kết thúc khối catch
        isRefreshing = false;
      }
    }

    // ĐƯA CÁC STATUS KHÁC RA NGOÀI KHỐI 401 ĐỂ TRÁNH NUỐT CODE
    switch (status) {
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
