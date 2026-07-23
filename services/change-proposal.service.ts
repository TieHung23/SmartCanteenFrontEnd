import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type { ChangeProposalDetail } from "@/types/order.types";

export interface AcceptProposalResponse {
  message: string;
}

export interface RequestRefundResponse {
  refundRequestId: string;
  orderId: string;
  orderItemId: number | null;
  dishId: string;
  policyCode: string;
  refundAmount: number;
  status: string;
  message: string;
}

export interface RequestOrderRefundResponse {
  refundRequestId: string;
  orderId: string;
  policyCode: string;
  refundAmount: number;
  status: string;
  message: string;
}

export const changeProposalService = {
  getAll: async (params?: {
    pageSize?: number;
    pageNumber?: number;
  }): Promise<ChangeProposalDetail[]> => {
    try {
      const response = (await apiClient.get<ApiResponse<ChangeProposalDetail[]>>(
        API_ENDPOINTS.CHANGE_PROPOSAL.LIST,
        {
          params: {
            PageSize: params?.pageSize,
            PageNumber: params?.pageNumber,
          },
        },
      )) as unknown as ApiResponse<ChangeProposalDetail[]>;
      return response.value || [];
    } catch {
      return [];
    }
  },

  getById: async (proposalId: string): Promise<ChangeProposalDetail | null> => {
    try {
      const response = (await apiClient.get<ApiResponse<ChangeProposalDetail>>(
        API_ENDPOINTS.CHANGE_PROPOSAL.GET(proposalId),
      )) as unknown as ApiResponse<ChangeProposalDetail>;
      return response.value || null;
    } catch {
      return null;
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

  requestOrderRefund: async (
    proposalId: string,
  ): Promise<ApiResponse<RequestOrderRefundResponse>> => {
    try {
      const response = await apiClient.post<ApiResponse<RequestOrderRefundResponse>>(
        API_ENDPOINTS.CHANGE_PROPOSAL.REQUEST_ORDER_REFUND(proposalId),
      );
      return response as unknown as ApiResponse<RequestOrderRefundResponse>;
    } catch (error) {
      const axiosErr = error as {
        response?: { status?: number; data?: unknown };
        message?: string;
      };
      console.error(
        `[requestOrderRefund] ${axiosErr.response?.status ?? "NETWORK"} for proposal ${proposalId}:`,
        axiosErr.response?.data ?? axiosErr.message,
      );
      throw error;
    }
  },
};
