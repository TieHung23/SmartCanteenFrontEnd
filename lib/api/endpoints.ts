export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register",
    LOGOUT: "/api/Auth/logout",
    REFRESH_TOKEN: "/api/Auth/refresh-token",
    ME: "/api/Auth/me",
  },
} as const;
