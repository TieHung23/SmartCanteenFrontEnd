"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { userService, type UserProfileResponse } from "@/services/user.service";
import {
  clearAuthTokens,
  getAccessToken,
  migrateLegacyAuthTokens,
  setAuthTokens,
} from "@/lib/auth-token-storage";

interface AuthContextType {
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(() => {
    migrateLegacyAuthTokens();
    return getAccessToken();
  });
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  const fetchProfile = useCallback(async () => {
    const t = getAccessToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await userService.getProfile();
      setUser(profile);
    } catch {
      clearAuthTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (token) {
        Promise.resolve().then(fetchProfile);
      } else {
        Promise.resolve().then(() => setLoading(false));
      }
    }
  }, [token, fetchProfile]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        Promise.resolve().then(() => setToken(e.newValue));
        if (!e.newValue) {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken?: string) => {
      setAuthTokens(accessToken, refreshToken);
      setToken(accessToken);
      fetchProfile();
    },
    [fetchProfile],
  );

  const logout = useCallback(() => {
    clearAuthTokens();
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
