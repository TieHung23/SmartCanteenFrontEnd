import apiClient from "@/lib/api/client";
import type { ApiResponse } from "./session.service";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  imgUrl: string | null;
  role: number;
  category?: number;
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
    | "id"
    | "email"
    | "role"
    | "category"
    | "status"
    | "emailVerified"
    | "balanceAmount"
    | "lastLoginAt"
  >
> & { imageFile?: File | null };

export const userService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    try {
      const response = (await apiClient.get<ApiResponse<UserProfileResponse>>(
        API_ENDPOINTS.AUTH.ME,
      )) as unknown as ApiResponse<UserProfileResponse>;
      return response.value;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin cá nhân:", error);
      throw error;
    }
  },

  updateProfile: async (data: UpdateProfilePayload): Promise<UserProfileResponse> => {
    try {
      const formData = new FormData();

      if (data.name !== undefined) formData.append("Name", (data.name ?? "").trim());
      if (data.phoneNumber !== undefined)
        formData.append("PhoneNumber", (data.phoneNumber ?? "").trim());
      if (data.address !== undefined) formData.append("Address", (data.address ?? "").trim());
      if (data.majorOrClass !== undefined)
        formData.append("MajorOrClass", (data.majorOrClass ?? "").trim());
      if (data.studentId !== undefined) formData.append("StudentId", (data.studentId ?? "").trim());

      if (data.gender !== undefined && data.gender !== null) {
        formData.append("Gender", String(data.gender));
      }

      if (data.dateOfBirth !== undefined && data.dateOfBirth && data.dateOfBirth.trim() !== "") {
        const formattedDate = data.dateOfBirth.split("T")[0];
        formData.append("DateOfBirth", formattedDate);
      }

      if (data.imageFile) {
        formData.append("Image", data.imageFile);
      }

      const response = (await apiClient.put<ApiResponse<UserProfileResponse>>(
        API_ENDPOINTS.AUTH.ME,
        formData,
      )) as unknown as ApiResponse<UserProfileResponse>;

      const dataResponse = ((response as unknown as { value: UserProfileResponse }).value ||
        response) as unknown as UserProfileResponse;
      return dataResponse;
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin cá nhân:", error);
      throw error;
    }
  },
};
