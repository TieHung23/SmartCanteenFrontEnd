import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { LoginBodyType, LoginResponse } from "@/types/auth.types";

export const authService = {
    login: async (body: LoginBodyType): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, body);
        return response as unknown as LoginResponse;
    }
};