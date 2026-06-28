import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";

export interface AcceptProposalResponse {
  message: string;
}

export interface RequestRefundResponse {
  message: string;
}

export const changeProposalService = {
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
