export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register",
    LOGOUT: "/api/Auth/logout",
    REFRESH_TOKEN: "/api/Auth/refresh",
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
  CART: {
    GET: "/api/Cart",
    UPDATE: "/api/Cart",
    DELETE: "/api/Cart",
  },
  PAYMENT: {
    TOP_UP: "/api/payments/top-up",
    GET: (id: string) => `/api/payments/${id}`,
  },
  WALLET: {
    TRANSACTIONS: "/api/Wallet/transactions",
    GET: (id: string) => `/api/Wallet/transactions/${id}`,
  },
  REFUND: {
    LIST: "/api/refunds",
    CREATE: "/api/refunds",
    GET: (id: string) => `/api/refunds/${id}`,
  },
  VERIFICATION: {
    SUBMIT: "/api/Verification/submit",
    ME: "/api/Verification/me",
  },
  NOTIFICATION: {
    LIST: "/api/notifications",
    UNREAD_COUNT: "/api/notifications/unread_count",
    READ: (id: string) => `/api/notifications/${id}/read`,
    READ_ALL: "/api/notifications/read_all",
    DELETE: (id: string) => `/api/notifications/${id}`,
  },
} as const;
