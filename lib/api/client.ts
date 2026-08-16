import axios from "axios";
import { env } from "@/config/env";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setBlockedAccountInfo,
  setAuthTokens,
} from "@/lib/auth-token-storage";
import { toast } from "sonner";

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

interface BlockedAccountResponse {
  message?: string;
  reason?: string;
  errorCode?: string;
}

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verification",
  "/suspended",
];

function redirectToLogin(customMessage?: string) {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (PUBLIC_PATHS.includes(path)) return;

  toast.error(customMessage || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!", {
    id: "session-expired-toast",
    duration: 4000,
  });

  setTimeout(() => {
    window.location.href = "/login";
  }, 800);
}

function isBlockedAccountResponse(data: unknown): data is BlockedAccountResponse {
  if (!data || typeof data !== "object") return false;
  const errorCode = (data as BlockedAccountResponse).errorCode;
  return errorCode === "AccountSuspended" || errorCode === "AccountBanned";
}

function handleBlockedAccount(data: BlockedAccountResponse) {
  if (typeof window === "undefined") return;
  setBlockedAccountInfo({
    status: data.errorCode === "AccountBanned" ? 5 : 4,
    message: data.message,
    reason: data.reason,
    errorCode: data.errorCode,
  });
  clearAuthTokens();
  if (window.location.pathname !== "/suspended") {
    window.location.href = "/suspended";
  }
}

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
  timeout: 35000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
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
    const responseData = error.response?.data;

    // 🔍 XỬ LÝ LỖI MẠNG HOẶC MÁY CHỦ KHÔNG PHẢN HỒI (Network Error / Timeout / Server Down)
    if (!error.response || error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
      if (typeof window !== "undefined") {
        toast.error(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc máy chủ đang bảo trì!",
          {
            id: "network-error-toast",
            duration: 6000,
          },
        );
      }
      return Promise.reject(error);
    }

    if (
      isBlockedAccountResponse(responseData) &&
      !originalRequest?.url?.includes(API_ENDPOINTS.AUTH.LOGIN)
    ) {
      handleBlockedAccount(responseData);
      return Promise.reject(error);
    }

    // 🔍 XỬ LÝ RIÊNG ĐẦU LỖI 401 UNAUTHORIZED
    if (status === 401 && !originalRequest._retry) {
      // Nếu lỗi xảy ra ngay tại API Login hoặc Refresh -> Sút về Login
      if (
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN) ||
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN)
      ) {
        if (typeof window !== "undefined") {
          clearAuthTokens();
          redirectToLogin("Đăng nhập không thành công hoặc phiên làm việc đã kết thúc.");
        }
        return Promise.reject(error);
      }

      // Nếu request không có Authorization header nghĩa là user chưa đăng nhập
      if (!originalRequest.headers?.Authorization) {
        return Promise.reject(error);
      }

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

      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        if (typeof window !== "undefined") {
          clearAuthTokens();
          redirectToLogin("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!");
        }
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<{
          value: { accessToken: string; refreshToken?: string };
        }>(`${env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
          refreshToken: storedRefreshToken,
        });

        const newTokens = refreshResponse.data?.value;
        if (newTokens?.accessToken) {
          setAuthTokens(newTokens.accessToken, newTokens.refreshToken);
          processQueue(null, newTokens.accessToken);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        const refreshData = (refreshError as { response?: { data?: unknown } }).response?.data;
        if (isBlockedAccountResponse(refreshData)) {
          handleBlockedAccount(refreshData);
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        }
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          clearAuthTokens();
          redirectToLogin("Mã phiên đã hết hạn. Vui lòng đăng nhập lại!");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 🔍 XỬ LÝ CÁC ĐẦU LỖI HTTP KHÁC (403, 500, 502, 503, 504, 429)
    switch (status) {
      case 403:
        toast.error("Bạn không có quyền thực hiện thao tác này!", {
          id: "forbidden-error-toast",
        });
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error("Hệ thống đang gặp sự cố hoặc đang bảo trì. Vui lòng thử lại sau!", {
          id: "server-maintenance-toast",
          duration: 6000,
        });
        break;
      case 429:
        toast.error("Thao tác quá nhanh. Vui lòng đợi trong giây lát và thử lại!", {
          id: "rate-limit-toast",
        });
        break;
      default:
        break;
    }

    return Promise.reject(error);
  },
);

export default apiClient;
