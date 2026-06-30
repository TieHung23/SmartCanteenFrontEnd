import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./session.service";
import type {
  VerificationMeResponse,
  VerificationStatusType,
  VerificationDocumentType,
  AdminVerificationListItem,
  AdminVerificationDetail,
} from "@/types/verification.types";
import { getAccessToken } from "@/lib/auth-token-storage";

function normalizeVerificationStatus(status: unknown): VerificationStatusType | null {
  if (typeof status === "number") {
    return status >= 0 && status <= 4 ? (status as VerificationStatusType) : null;
  }
  if (typeof status !== "string") return null;
  const normalized = status.toLowerCase().replace(/[\s_-]/g, "");
  if (
    normalized === "pending" ||
    normalized === "submitted" ||
    normalized === "inreview" ||
    normalized === "underreview" ||
    normalized === "waitingforreview" ||
    normalized === "pendingreview"
  ) {
    return 1;
  }
  if (normalized === "approved" || normalized === "verified") return 2;
  if (normalized === "rejected") return 3;
  if (normalized === "expired") return 4;
  const numeric = Number(status);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 4
    ? (numeric as VerificationStatusType)
    : null;
}

function isPendingVerificationStatus(status: VerificationStatusType): boolean {
  return status === 0 || status === 1;
}

export { isPendingVerificationStatus };

export const verificationService = {
  getMyVerification: async (): Promise<VerificationMeResponse | null> => {
    try {
      const response = await apiClient.get<unknown>(API_ENDPOINTS.VERIFICATION.ME);
      console.log("GET /me raw response:", response);
      const data = response as unknown as Record<string, unknown>;
      if (data.value && typeof data.value === "object") {
        const value = data.value as Record<string, unknown>;
        const status = normalizeVerificationStatus(value.status);
        return {
          ...(value as unknown as VerificationMeResponse),
          status: status ?? 0,
          rejectReason:
            (value.rejectReason as string | undefined) ||
            (value.rejectionReason as string | undefined),
        };
      }
      if (data.requestId || data.status !== undefined) {
        const status = normalizeVerificationStatus(data.status);
        return {
          ...(data as unknown as VerificationMeResponse),
          status: status ?? 0,
          rejectReason:
            (data.rejectReason as string | undefined) ||
            (data.rejectionReason as string | undefined),
        };
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
      const profile = await import("./user.service").then((m) =>
        m.userService.getProfile().catch(() => null),
      );
      if (profile) {
        if (profile.majorOrClass) formData.append("MajorOrClass", profile.majorOrClass);
        if (profile.dateOfBirth) formData.append("DateOfBirth", profile.dateOfBirth.split("T")[0]);
        if (profile.studentId) formData.append("StudentId", profile.studentId);
      }
    } catch {}

    try {
      const token = getAccessToken();
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

  /* ── Admin ── */
  adminList: async (params?: {
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedList<AdminVerificationListItem>> => {
    const response = (await apiClient.get<ApiResponse<PaginatedList<AdminVerificationListItem>>>(
      API_ENDPOINTS.VERIFICATION.ADMIN_LIST,
      { params },
    )) as unknown as ApiResponse<PaginatedList<AdminVerificationListItem>>;
    return response.value;
  },

  adminGetDetail: async (id: string): Promise<AdminVerificationDetail> => {
    const response = (await apiClient.get<ApiResponse<AdminVerificationDetail>>(
      API_ENDPOINTS.VERIFICATION.ADMIN_GET(id),
    )) as unknown as ApiResponse<AdminVerificationDetail>;
    return response.value;
  },

  adminApprove: async (id: string): Promise<{ id: string; message: string }> => {
    const response = (await apiClient.post<ApiResponse<{ id: string; message: string }>>(
      API_ENDPOINTS.VERIFICATION.ADMIN_APPROVE(id),
    )) as unknown as ApiResponse<{ id: string; message: string }>;
    return response.value;
  },

  adminReject: async (id: string, reason: string): Promise<{ id: string; message: string }> => {
    const response = (await apiClient.post<ApiResponse<{ id: string; message: string }>>(
      API_ENDPOINTS.VERIFICATION.ADMIN_REJECT(id),
      { reason },
    )) as unknown as ApiResponse<{ id: string; message: string }>;
    return response.value;
  },
};
