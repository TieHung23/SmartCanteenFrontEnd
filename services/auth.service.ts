import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { LoginBodyType, LoginResponse } from "@/types/auth.types";

export const authService = {
    login: (body: LoginBodyType) => {
        return apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, body);
    }
};