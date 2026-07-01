import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type { OrderItemStatus } from "@/types/order.types";

export interface AcceptProposalResponse {
  message: string;
}

export interface RequestRefundResponse {
  message: string;
}

export interface ChangeProposalItem {
  id: string;
  orderId: string;
  orderCode?: string;
  userName?: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  imgUrl?: string | null;
  status: OrderItemStatus;
  proposalStatus?: string;
  createdAtUtc: string;
  sessionId: string;
  sessionName?: string;
}

export const changeProposalService = {
  getAll: async (params?: {
    pageSize?: number;
    pageNumber?: number;
    status?: string;
  }): Promise<{ items: ChangeProposalItem[] }> => {
    try {
      const queryParams: Record<string, string | number | undefined> = {};
      if (params?.pageSize) queryParams.PageSize = params.pageSize;
      if (params?.pageNumber) queryParams.PageNumber = params.pageNumber;
      if (params?.status) queryParams.Status = params.status;
      const response = (await apiClient.get<ApiResponse<unknown>>(
        API_ENDPOINTS.CHANGE_PROPOSAL.LIST,
        { params: queryParams },
      )) as unknown as ApiResponse<{ items: ChangeProposalItem[] }>;
      return response.value || { items: [] };
    } catch {
      return { items: [] };
    }
  },

  accept: async (
    proposalId: string,
    newDishId: string,
  ): Promise<ApiResponse<AcceptProposalResponse>> => {
    try {
      const response = await apiClient.post<ApiResponse<AcceptProposalResponse>>(
        API_ENDPOINTS.CHANGE_PROPOSAL.ACCEPT(proposalId),
        { proposalId, newDishId },
      );
      return response as unknown as ApiResponse<AcceptProposalResponse>;
    } catch (error) {
      console.error(`Error accepting change proposal ${proposalId}:`, error);
      throw error;
    }
  },

  requestRefund: async (proposalId: string): Promise<ApiResponse<RequestRefundResponse>> => {
    try {
      const response = await apiClient.post<ApiResponse<RequestRefundResponse>>(
        API_ENDPOINTS.CHANGE_PROPOSAL.REQUEST_REFUND(proposalId),
      );
      return response as unknown as ApiResponse<RequestRefundResponse>;
    } catch (error) {
      console.error(`Error requesting refund for proposal ${proposalId}:`, error);
      throw error;
    }
  },
};
