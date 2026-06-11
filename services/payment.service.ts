import apiClient from "@/lib/api/client";
import type { ApiResponse } from "./meal.service"; // Tái sử dụng envelope chuẩn từ meal.service

export interface TopUpRequest {
  amountVnd: number;
  method: number; // 1: Momo, 2: ZaloPay, 3: VnPay, 4: SePay
}

export interface TopUpResponse {
  paymentId: string;
  amountVnd: number;
  convertedPoints: number;
  method: number;
  status: string;
  gatewayOrderId: string;
  paymentContent: string;
  payUrl: string; // Link chuyển hướng sang cổng thanh toán
}

export const paymentService = {
  topUpWallet: async (data: TopUpRequest): Promise<TopUpResponse> => {
    try {
      const response = (await apiClient.post<ApiResponse<TopUpResponse>>(
        "/api/payments/top-up",
        data,
      )) as unknown as ApiResponse<TopUpResponse>;
      return response.value;
    } catch (error) {
      console.error("Lỗi khi tạo giao dịch nạp tiền:", error);
      throw error;
    }
  },
};
