const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const LEGACY_TOKEN_KEY = "token";

function getBrowserStorage(kind: "session" | "local") {
  if (typeof window === "undefined") return null;
  return kind === "session" ? window.sessionStorage : window.localStorage;
}

export function migrateLegacyAuthTokens(): void {
  const session = getBrowserStorage("session");
  const local = getBrowserStorage("local");
  if (!session || !local) return;

  const sessionToken = session.getItem(ACCESS_TOKEN_KEY);
  if (sessionToken) {
    local.removeItem(ACCESS_TOKEN_KEY);
    local.removeItem(REFRESH_TOKEN_KEY);
    local.removeItem(LEGACY_TOKEN_KEY);
    return;
  }

  const legacyToken = local.getItem(ACCESS_TOKEN_KEY) || local.getItem(LEGACY_TOKEN_KEY);
  const legacyRefresh = local.getItem(REFRESH_TOKEN_KEY);
  if (legacyToken) {
    session.setItem(ACCESS_TOKEN_KEY, legacyToken);
    if (legacyRefresh) session.setItem(REFRESH_TOKEN_KEY, legacyRefresh);
    local.removeItem(ACCESS_TOKEN_KEY);
    local.removeItem(REFRESH_TOKEN_KEY);
    local.removeItem(LEGACY_TOKEN_KEY);
  }
}

export function getAccessToken(): string | null {
  const session = getBrowserStorage("session");
  return session?.getItem(ACCESS_TOKEN_KEY) || null;
}

export function getRefreshToken(): string | null {
  const session = getBrowserStorage("session");
  return session?.getItem(REFRESH_TOKEN_KEY) || null;
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  const session = getBrowserStorage("session");
  const local = getBrowserStorage("local");
  session?.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) session?.setItem(REFRESH_TOKEN_KEY, refreshToken);

  local?.removeItem(ACCESS_TOKEN_KEY);
  local?.removeItem(REFRESH_TOKEN_KEY);
  local?.removeItem(LEGACY_TOKEN_KEY);
}

export function clearAuthTokens() {
  const session = getBrowserStorage("session");
  const local = getBrowserStorage("local");
  session?.removeItem(ACCESS_TOKEN_KEY);
  session?.removeItem(REFRESH_TOKEN_KEY);
  session?.removeItem(LEGACY_TOKEN_KEY);
  local?.removeItem(ACCESS_TOKEN_KEY);
  local?.removeItem(REFRESH_TOKEN_KEY);
  local?.removeItem(LEGACY_TOKEN_KEY);
}
