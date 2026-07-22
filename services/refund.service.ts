import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./session.service";
import type {
  RefundRequest,
  ManagerRefundListItem,
  ManagerRefundDetail,
  RefundPolicy,
} from "@/types/refund.types";

export const refundService = {
  getPolicies: async (): Promise<RefundPolicy[]> => {
    const response = await apiClient.get<ApiResponse<RefundPolicy[]>>(
      API_ENDPOINTS.REFUND.POLICIES,
    );
    return (response as unknown as ApiResponse<RefundPolicy[]>).value;
  },

  getMyRefunds: async (params?: { status?: number; pageNumber?: number; pageSize?: number }) => {
    const response = await apiClient.get<ApiResponse<PaginatedList<RefundRequest>>>(
      API_ENDPOINTS.REFUND.LIST,
      { params },
    );
    return (response as unknown as ApiResponse<PaginatedList<RefundRequest>>).value;
  },

  getRefundDetail: async (id: string): Promise<RefundRequest> => {
    const response = await apiClient.get<ApiResponse<RefundRequest>>(API_ENDPOINTS.REFUND.GET(id));
    return (response as unknown as ApiResponse<RefundRequest>).value;
  },

  createRefund: async (data: {
    orderId: string;
    policyCode: string;
    description: string;
    images: File[];
  }): Promise<RefundRequest> => {
    const formData = new FormData();
    formData.append("orderId", data.orderId);
    formData.append("policyCode", data.policyCode);
    formData.append("description", data.description);
    data.images.forEach((file) => formData.append("images", file));

    const response = await apiClient.post<ApiResponse<RefundRequest>>(
      API_ENDPOINTS.REFUND.CREATE,
      formData,
      { headers: { "Content-Type": null } },
    );
    return (response as unknown as ApiResponse<RefundRequest>).value;
  },

  /* ── Manager ── */
  managerList: async (params?: {
    status?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedList<ManagerRefundListItem>> => {
    const response = (await apiClient.get<ApiResponse<PaginatedList<ManagerRefundListItem>>>(
      API_ENDPOINTS.REFUND.MANAGER_LIST,
      { params },
    )) as unknown as ApiResponse<PaginatedList<ManagerRefundListItem>>;
    return response.value;
  },

  managerGetDetail: async (id: string): Promise<ManagerRefundDetail> => {
    const response = (await apiClient.get<ApiResponse<ManagerRefundDetail>>(
      API_ENDPOINTS.REFUND.MANAGER_GET(id),
    )) as unknown as ApiResponse<ManagerRefundDetail>;
    return response.value;
  },

  managerApprove: async (
    id: string,
  ): Promise<{
    id: string;
    walletTransactionId: string;
    refundAmount: number;
    balanceAfter: number;
    status: string;
  }> => {
    const response = (await apiClient.post<
      ApiResponse<{
        id: string;
        walletTransactionId: string;
        refundAmount: number;
        balanceAfter: number;
        status: string;
      }>
    >(API_ENDPOINTS.REFUND.MANAGER_APPROVE(id))) as unknown as ApiResponse<{
      id: string;
      walletTransactionId: string;
      refundAmount: number;
      balanceAfter: number;
      status: string;
    }>;
    return response.value;
  },

  managerReject: async (
    id: string,
    reason: string,
  ): Promise<{
    id: string;
    status: string;
    rejectionReason: string;
  }> => {
    const response = (await apiClient.post<
      ApiResponse<{
        id: string;
        status: string;
        rejectionReason: string;
      }>
    >(API_ENDPOINTS.REFUND.MANAGER_REJECT(id), { reason })) as unknown as ApiResponse<{
      id: string;
      status: string;
      rejectionReason: string;
    }>;
    return response.value;
  },
};
