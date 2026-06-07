export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register",
    LOGOUT: "/api/Auth/logout",
    REFRESH_TOKEN: "/api/Auth/refresh-token",
    ME: "/api/Auth/me",
  },
  MEAL: {
    LIST: "/api/Meals",
    CREATE: "/api/Meals",
    GET: (id: string) => `/api/Meals/${id}`,
    UPDATE: (id: string) => `/api/Meals/${id}`,
    DELETE: (id: string) => `/api/Meals/${id}`,
  },
  CATEGORY: {
    LIST: "/api/Categories",
    GET: (id: string) => `/api/Categories/${id}`,
  },
  DISH: {
    LIST: "/api/Dishes",
    GET: (id: string) => `/api/Dishes/${id}`,
    CREATE: "/api/Dishes",
    UPDATE: (id: string) => `/api/Dishes/${id}`,
    UPDATE_STOCK: (id: string) => `/api/Dishes/${id}/stock`,
    DELETE: (id: string) => `/api/Dishes/${id}`,
  },
  ORDER: {
    LIST: "/api/Orders",
    GET: (id: string) => `/api/Orders/${id}`,
    CREATE: "/api/Orders",
    UPDATE: (id: string) => `/api/Orders/${id}`,
    DELETE: (id: string) => `/api/Orders/${id}`,
  },
} as const;
