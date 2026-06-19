import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  LoginBodyType,
  RegisterBodyType,
  LoginResponse,
  RegisterResponse,
} from "@/types/auth.types";
import { ForgotPasswordBody, ResetPasswordBody, ChangePasswordBody } from "@/types/auth.types";

export const authService = {
  login: async (body: LoginBodyType): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      body,
    ) as unknown as Promise<LoginResponse>;
  },

  register: async (body: RegisterBodyType): Promise<RegisterResponse> => {
    const b = body as unknown as Record<string, unknown>;

    const payload = {
      name: (body.name || "").toString().trim(),
      email: (body.email || "").toString().trim(),
      password: (body.password || "").toString(),
      category: typeof b.category === "number" ? (b.category as unknown as number) : 1,
      studentId: (body.studentId || "").toString().trim(),
      dateOfBirth: (body.dateOfBirth || "").toString(),
      majorOrClass: (body.majorOrClass || "").toString().trim(),
      phoneNumber: (body.phoneNumber || "").toString().trim(),
      address: (body.address || "").toString().trim(),
      gender: Number(b.gender as unknown as string) || 1,
    };

    return apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload,
    ) as unknown as Promise<RegisterResponse>;
  },

  getProfile: async (): Promise<{ role: string } | null> => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return null;
    try {
      const res = (await apiClient.get(API_ENDPOINTS.AUTH.ME)) as Record<string, unknown>;

      const roleMap: Record<number, string> = {
        1: "ADMIN",
        2: "MANAGER",
        3: "USER",
        4: "STAFF",
      };

      const value = res.value as Record<string, unknown>;
      const rawRole = value?.role;
      const role =
        typeof rawRole === "number"
          ? roleMap[rawRole]
          : typeof rawRole === "string"
            ? rawRole
            : undefined;

      return role ? { role } : null;
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: unknown } };
      console.log("getProfile error:", error?.response?.status, error?.response?.data);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      return null;
    }
  },

  verifyEmail: async (email: string, code: string): Promise<unknown> => {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
  },

  refreshToken: async (token: string): Promise<unknown> => {
    return apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refreshToken: token,
    });
  },

  forgotPassword: async (body: ForgotPasswordBody): Promise<unknown> => {
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, body);
  },

  resetPassword: async (body: ResetPasswordBody): Promise<unknown> => {
    return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, body);
  },

  changePassword: async (body: ChangePasswordBody): Promise<unknown> => {
    return apiClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, body);
  },
};
