import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  TrayPoolSummary,
  TrayDetail,
  CreateTraySinglePayload,
  CreateTrayBulkPayload,
  CreateTrayResponse,
  ForceReleaseTrayResponse,
  RetireTrayResponse,
} from "@/types/tray.types";

export const trayService = {
  getPool: async (): Promise<TrayPoolSummary> => {
    const response = (await apiClient.get<ApiResponse<TrayPoolSummary>>(
      API_ENDPOINTS.MANAGER.TRAYS.LIST,
    )) as unknown as ApiResponse<TrayPoolSummary>;
    return response.value;
  },

  getById: async (id: string): Promise<TrayDetail> => {
    const response = (await apiClient.get<ApiResponse<TrayDetail>>(
      API_ENDPOINTS.MANAGER.TRAYS.GET_BY_ID(id),
    )) as unknown as ApiResponse<TrayDetail>;
    return response.value;
  },

  createSingle: async (data: CreateTraySinglePayload): Promise<CreateTrayResponse> => {
    const response = (await apiClient.post<ApiResponse<CreateTrayResponse>>(
      API_ENDPOINTS.MANAGER.TRAYS.CREATE,
      data,
    )) as unknown as ApiResponse<CreateTrayResponse>;
    return response.value;
  },

  createBulk: async (data: CreateTrayBulkPayload): Promise<CreateTrayResponse> => {
    const response = (await apiClient.post<ApiResponse<CreateTrayResponse>>(
      API_ENDPOINTS.MANAGER.TRAYS.CREATE,
      data,
    )) as unknown as ApiResponse<CreateTrayResponse>;
    return response.value;
  },

  forceRelease: async (id: string): Promise<ForceReleaseTrayResponse> => {
    const response = (await apiClient.patch<ApiResponse<ForceReleaseTrayResponse>>(
      API_ENDPOINTS.MANAGER.TRAYS.FORCE_RELEASE(id),
    )) as unknown as ApiResponse<ForceReleaseTrayResponse>;
    return response.value;
  },

  retire: async (id: string): Promise<RetireTrayResponse> => {
    const response = (await apiClient.patch<ApiResponse<RetireTrayResponse>>(
      API_ENDPOINTS.MANAGER.TRAYS.RETIRE(id),
    )) as unknown as ApiResponse<RetireTrayResponse>;
    return response.value;
  },
};
