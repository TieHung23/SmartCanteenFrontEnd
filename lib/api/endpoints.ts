export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register",
    LOGOUT: "/api/Auth/logout",
    REFRESH_TOKEN: "/api/Auth/refresh-token",
    ME: "/api/Auth/me",
    VERIFY_EMAIL: "/api/Auth/verify-email",
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
  PAYMENT: {
    TOP_UP: "/api/payments/top-up",
    GET: (id: string) => `/api/payments/${id}`,
  },
  WALLET: {
    TRANSACTIONS: "/api/wallet/transactions",
    GET: (id: string) => `/api/wallet/transactions/${id}`,
  },
  REFUND: {
    LIST: "/api/refunds",
    CREATE: "/api/refunds",
    GET: (id: string) => `/api/refunds/${id}`,
  },
} as const;
