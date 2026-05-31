import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { LoginBodyType, LoginResponse, RegisterBodyType, RegisterResponse } from "@/types/auth.types";

export const authService = {
    login: async (body: LoginBodyType): Promise<LoginResponse> => {
        return apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, body) as unknown as Promise<LoginResponse>;
    },

    register: async (body: RegisterBodyType): Promise<RegisterResponse> => {
        // Temporary logging to inspect payload causing 400 responses
        // Ensure required numeric fields are present and coerce types
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

        // logging removed

        return apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, payload) as unknown as Promise<RegisterResponse>;
    }
};