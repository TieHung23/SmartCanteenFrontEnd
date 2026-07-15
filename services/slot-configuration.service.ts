import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  SlotConfiguration,
  SlotConfigurationListResponse,
  CreateSlotConfigurationPayload,
  UpdateSlotConfigurationPayload,
  DeleteSlotConfigurationResponse,
} from "@/types/slot-configuration.types";

export const slotConfigurationService = {
  getBySession: async (sessionId: string): Promise<SlotConfiguration[]> => {
    const response = (await apiClient.get<ApiResponse<SlotConfigurationListResponse>>(
      API_ENDPOINTS.MANAGER.SLOT_CONFIGURATIONS.LIST_BY_SESSION(sessionId),
    )) as unknown as ApiResponse<SlotConfigurationListResponse>;
    return response.value.configurations;
  },

  create: async (data: CreateSlotConfigurationPayload): Promise<SlotConfiguration> => {
    const response = (await apiClient.post<ApiResponse<SlotConfiguration>>(
      API_ENDPOINTS.MANAGER.SLOT_CONFIGURATIONS.CREATE,
      data,
    )) as unknown as ApiResponse<SlotConfiguration>;
    return response.value;
  },

  update: async (id: string, data: UpdateSlotConfigurationPayload): Promise<SlotConfiguration> => {
    const response = (await apiClient.put<ApiResponse<SlotConfiguration>>(
      API_ENDPOINTS.MANAGER.SLOT_CONFIGURATIONS.UPDATE(id),
      data,
    )) as unknown as ApiResponse<SlotConfiguration>;
    return response.value;
  },

  delete: async (id: string): Promise<DeleteSlotConfigurationResponse> => {
    const response = (await apiClient.delete<ApiResponse<DeleteSlotConfigurationResponse>>(
      API_ENDPOINTS.MANAGER.SLOT_CONFIGURATIONS.DELETE(id),
    )) as unknown as ApiResponse<DeleteSlotConfigurationResponse>;
    return response.value;
  },
};
