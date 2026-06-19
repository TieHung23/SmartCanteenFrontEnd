import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { CartResponse, CartData } from "@/types/cart.types";
import type { ApiResponse } from "./session.service";

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get<ApiResponse<CartResponse>>(API_ENDPOINTS.CART.GET);
    return (response as unknown as ApiResponse<CartResponse>).value;
  },
  updateCart: async (data: CartData, expectedVersion: number): Promise<CartResponse> => {
    const response = await apiClient.put<ApiResponse<CartResponse>>(API_ENDPOINTS.CART.UPDATE, {
      data,
      expectedVersion,
    });
    return (response as unknown as ApiResponse<CartResponse>).value;
  },
};
