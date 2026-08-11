import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";

export interface TopUpRequest {
  amountVnd: number;
  method: number;
}

export interface TopUpResponse {
  paymentId: string;
  amountVnd: number;
  convertedPoints: number;
  method: number;
  status: string;
  gatewayOrderId: string;
  paymentContent: string;
  payUrl: string | null;
}

export interface PaymentDetail {
  paymentId: string;
  userId: string;
  gatewayOrderId: string;
  gatewayTransactionId: string | null;
  amountVnd: number;
  convertedPoints: number;
  method: number;
  type: number;
  status: string;
  failureReason: string | null;
  createdAtUtc: string;
  completedAtUtc: string | null;
}

export interface WalletTransaction {
  id: string;
  userId?: string;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  transactionType: number;
  transactionTypeName?: string;
  paymentId?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  isDeleted?: boolean;
}

export interface TopUpPolicy {
  vndPerPoint: number;
  minTopUpAmount: number;
  maxTopUpAmount: number;
  currency: string;
  pointName: string;
}

export const paymentService = {
  getTopUpPolicy: async (): Promise<TopUpPolicy> => {
    try {
      const response = (await apiClient.get<ApiResponse<TopUpPolicy>>(
        API_ENDPOINTS.PAYMENT.TOP_UP_POLICY,
      )) as unknown as ApiResponse<TopUpPolicy>;
      return response.value;
    } catch (error) {
      console.error("Error when fetching top-up policy:", error);
      throw error;
    }
  },

  topUpWallet: async (data: TopUpRequest): Promise<TopUpResponse> => {
    try {
      const response = (await apiClient.post<ApiResponse<TopUpResponse>>(
        API_ENDPOINTS.PAYMENT.TOP_UP,
        data,
      )) as unknown as ApiResponse<TopUpResponse>;
      return response.value;
    } catch (error) {
      console.error("Error when creating top-up transaction:", error);
      throw error;
    }
  },

  getPaymentDetail: async (id: string): Promise<PaymentDetail> => {
    try {
      const response = (await apiClient.get<ApiResponse<PaymentDetail>>(
        API_ENDPOINTS.PAYMENT.GET(id),
      )) as unknown as ApiResponse<PaymentDetail>;
      return response.value;
    } catch (error) {
      console.error("Error when fetching payment detail:", error);
      throw error;
    }
  },

  getWalletTransactions: async (params?: {
    transactionType?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<{
    items: WalletTransaction[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }> => {
    try {
      const queryParams: Record<string, unknown> = {};
      if (params?.transactionType !== undefined && params.transactionType !== 0) {
        queryParams.TransactionType = params.transactionType;
      }
      if (params?.pageNumber !== undefined) queryParams.PageNumber = params.pageNumber;
      if (params?.pageSize !== undefined) queryParams.PageSize = params.pageSize;

      const response = (await apiClient.get<unknown>(API_ENDPOINTS.WALLET.TRANSACTIONS, {
        params: queryParams,
      })) as unknown as Record<string, unknown>;

      const data =
        response?.value && typeof response.value === "object"
          ? (response.value as Record<string, unknown>)
          : response;

      return {
        items: (data?.items as WalletTransaction[]) || [],
        pageNumber: Number(data?.pageNumber) || 1,
        pageSize: Number(data?.pageSize) || 10,
        totalCount: Number(data?.totalCount) || 0,
        totalPages: Number(data?.totalPages) || 1,
        hasPreviousPage: Boolean(data?.hasPreviousPage),
        hasNextPage: Boolean(data?.hasNextPage),
      };
    } catch (error) {
      console.error("Error when fetching wallet transactions:", error);
      throw error;
    }
  },
};
