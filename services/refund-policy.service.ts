import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  RefundPolicy,
  CreateRefundPolicyPayload,
  UpdateRefundPolicyPayload,
} from "@/types/refund-policy.types";

export const refundPolicyService = {
  list: async (): Promise<RefundPolicy[]> => {
    const response = (await apiClient.get<ApiResponse<RefundPolicy[]>>(
      API_ENDPOINTS.REFUND.MANAGER_POLICIES,
    )) as unknown as ApiResponse<RefundPolicy[]>;
    return response.value;
  },

  create: async (payload: CreateRefundPolicyPayload): Promise<RefundPolicy> => {
    const response = (await apiClient.post<ApiResponse<RefundPolicy>>(
      API_ENDPOINTS.REFUND.MANAGER_POLICY_CREATE,
      payload,
    )) as unknown as ApiResponse<RefundPolicy>;
    return response.value;
  },

  update: async (code: string, payload: UpdateRefundPolicyPayload): Promise<RefundPolicy> => {
    const response = (await apiClient.put<ApiResponse<RefundPolicy>>(
      API_ENDPOINTS.REFUND.MANAGER_POLICY_UPDATE(code),
      payload,
    )) as unknown as ApiResponse<RefundPolicy>;
    return response.value;
  },

  delete: async (code: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.REFUND.MANAGER_POLICY_DELETE(code));
  },
};
