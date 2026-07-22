"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { userService, type UserProfileResponse } from "@/services/user.service";
import {
  clearAuthTokens,
  getAccessToken,
  migrateLegacyAuthTokens,
  setBlockedAccountInfo,
  setAuthTokens,
} from "@/lib/auth-token-storage";
import { connectSignalr, disconnectSignalr } from "@/lib/hooks/use-signalr";

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

  const handleBlockedProfile = useCallback(
    (profile: UserProfileResponse) => {
      setBlockedAccountInfo({
        status: profile.status,
        message:
          profile.status === 5
            ? "This account has been banned."
            : "This account has been suspended.",
      });
      clearAuthTokens();
      setToken(null);
      setUser(null);
      disconnectSignalr();
      router.push("/suspended");
    },
    [router],
  );

  const fetchProfile = useCallback(async () => {
    const t = getAccessToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await userService.getProfile();
      if (profile.status === 4 || profile.status === 5) {
        handleBlockedProfile(profile);
        return;
      }
      setUser(profile);
    } catch {
      clearAuthTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [handleBlockedProfile]);

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
    if (token && !loading) {
      connectSignalr();
    }
  }, [token, loading]);

  useEffect(() => {
    if (!token) return;

    const interval = window.setInterval(() => {
      fetchProfile();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [fetchProfile, token]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        Promise.resolve().then(() => setToken(e.newValue));
        if (!e.newValue) {
          setUser(null);
          disconnectSignalr();
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
    disconnectSignalr();
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
