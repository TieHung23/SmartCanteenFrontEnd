import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { VerificationMeResponse, VerificationDocumentType } from "@/types/verification.types";

export const verificationService = {
  getMyVerification: async (): Promise<VerificationMeResponse | null> => {
    try {
      const response = await apiClient.get<unknown>(API_ENDPOINTS.VERIFICATION.ME);
      console.log("GET /me raw response:", response);
      const data = response as unknown as Record<string, unknown>;
      if (data.value && typeof data.value === "object") {
        return data.value as unknown as VerificationMeResponse;
      }
      if (data.requestId || data.status !== undefined) {
        return data as unknown as VerificationMeResponse;
      }
      return null;
    } catch (error) {
      console.error("GET /me error:", error);
      return null;
    }
  },

  submitVerification: async (
    files: File[],
    documentTypes: VerificationDocumentType[],
  ): Promise<{ requestId: string }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    documentTypes.forEach((dt) => formData.append("documentTypes", String(dt)));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const baseURL = apiClient.defaults.baseURL || "";
      const res = await fetch(`${baseURL}${API_ENDPOINTS.VERIFICATION.SUBMIT}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      console.log("POST /submit status:", res.status);
      const text = await res.text();
      console.log("POST /submit body:", text);
      if (!res.ok) throw new Error(text);
      const json = JSON.parse(text);
      if (typeof json.value === "string") return { requestId: json.value };
      if (json.value?.requestId) return { requestId: json.value.requestId };
      if (json.requestId) return { requestId: json.requestId };
      throw new Error("Unexpected response format");
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown; status?: number }; message?: string };
      console.error("Submit verification error:", err?.response?.data || err?.message || err);
      throw error;
    }
  },
};
