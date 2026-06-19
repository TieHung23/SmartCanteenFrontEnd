import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./session.service";
import type { RefundRequest } from "@/types/refund.types";

export const refundService = {
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
};
