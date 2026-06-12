import apiClient from "@/lib/api/client";
import type { ApiResponse } from "./meal.service";

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  imgUrl: string | null;
  role: number;
  status: number;
  emailVerified: boolean;
  studentId: string | null;
  dateOfBirth: string | null;
  majorOrClass: string | null;
  phoneNumber: string | null;
  address: string | null;
  gender: number | null;
  balanceAmount: number;
  lastLoginAt: string | null;
}

export type UpdateProfilePayload = Partial<
  Omit<
    UserProfileResponse,
    "id" | "email" | "role" | "status" | "emailVerified" | "balanceAmount" | "lastLoginAt"
  >
>;

export const userService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    try {
      const response = (await apiClient.get<ApiResponse<UserProfileResponse>>(
        "/api/auth/me",
      )) as unknown as ApiResponse<UserProfileResponse>;
      return response.value;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin cá nhân:", error);
      throw error;
    }
  },

  updateProfile: async (data: UpdateProfilePayload): Promise<UserProfileResponse> => {
    try {
      const response = (await apiClient.put<ApiResponse<UserProfileResponse>>(
        "/api/auth/me",
        data,
      )) as unknown as ApiResponse<UserProfileResponse>;
      return response.value;
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin cá nhân:", error);
      throw error;
    }
  },
};
