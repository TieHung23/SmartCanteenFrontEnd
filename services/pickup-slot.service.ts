import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  PickupSlotSummary,
  CreatePickupSlotSinglePayload,
  CreatePickupSlotBulkPayload,
  CreatePickupSlotResponse,
  ForceClearPickupSlotResponse,
  RetirePickupSlotResponse,
} from "@/types/pickup-slot.types";

export const pickupSlotService = {
  getList: async (): Promise<PickupSlotSummary> => {
    const response = (await apiClient.get<ApiResponse<PickupSlotSummary>>(
      API_ENDPOINTS.MANAGER.PICKUP_SLOTS.LIST,
    )) as unknown as ApiResponse<PickupSlotSummary>;
    return response.value;
  },

  createSingle: async (data: CreatePickupSlotSinglePayload): Promise<CreatePickupSlotResponse> => {
    const response = (await apiClient.post<ApiResponse<CreatePickupSlotResponse>>(
      API_ENDPOINTS.MANAGER.PICKUP_SLOTS.CREATE,
      data,
    )) as unknown as ApiResponse<CreatePickupSlotResponse>;
    return response.value;
  },

  createBulk: async (data: CreatePickupSlotBulkPayload): Promise<CreatePickupSlotResponse> => {
    const response = (await apiClient.post<ApiResponse<CreatePickupSlotResponse>>(
      API_ENDPOINTS.MANAGER.PICKUP_SLOTS.CREATE,
      data,
    )) as unknown as ApiResponse<CreatePickupSlotResponse>;
    return response.value;
  },

  forceClear: async (id: string): Promise<ForceClearPickupSlotResponse> => {
    const response = (await apiClient.patch<ApiResponse<ForceClearPickupSlotResponse>>(
      API_ENDPOINTS.MANAGER.PICKUP_SLOTS.FORCE_CLEAR(id),
    )) as unknown as ApiResponse<ForceClearPickupSlotResponse>;
    return response.value;
  },

  retire: async (id: string): Promise<RetirePickupSlotResponse> => {
    const response = (await apiClient.patch<ApiResponse<RetirePickupSlotResponse>>(
      API_ENDPOINTS.MANAGER.PICKUP_SLOTS.RETIRE(id),
    )) as unknown as ApiResponse<RetirePickupSlotResponse>;
    return response.value;
  },
};
