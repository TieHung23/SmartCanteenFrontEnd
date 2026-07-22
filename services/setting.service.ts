import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./session.service";
import type {
  CreateSettingPayload,
  UpdateSettingPayload,
  Setting,
  SettingFilterParams,
} from "@/types/setting.types";

export const settingService = {
  getSettings: async (params?: SettingFilterParams): Promise<PaginatedList<Setting>> => {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.code) queryParams.Code = params.code;
      if (params.name) queryParams.Name = params.name;
      if (params.group) queryParams.Group = params.group;
      if (params.scope) queryParams.Scope = params.scope;
      if (params.type) queryParams.Type = params.type;
      if (params.pageNumber) queryParams.PageNumber = params.pageNumber;
      if (params.pageSize) queryParams.PageSize = params.pageSize;
    }
    const response = (await apiClient.get<ApiResponse<PaginatedList<Setting>>>(
      API_ENDPOINTS.SETTINGS.LIST,
      { params: queryParams },
    )) as unknown as ApiResponse<PaginatedList<Setting>>;
    return response.value;
  },

  getSetting: async (id: string): Promise<Setting> => {
    const response = (await apiClient.get<ApiResponse<Setting>>(
      API_ENDPOINTS.SETTINGS.GET(id),
    )) as unknown as ApiResponse<Setting>;
    return response.value;
  },

  createSetting: async (payload: CreateSettingPayload): Promise<Setting> => {
    const response = (await apiClient.post<ApiResponse<Setting>>(
      API_ENDPOINTS.SETTINGS.CREATE,
      payload,
    )) as unknown as ApiResponse<Setting>;
    return response.value;
  },

  updateSetting: async (id: string, payload: UpdateSettingPayload): Promise<Setting> => {
    const response = (await apiClient.put<ApiResponse<Setting>>(
      API_ENDPOINTS.SETTINGS.UPDATE(id),
      payload,
    )) as unknown as ApiResponse<Setting>;
    return response.value;
  },

  deleteSetting: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SETTINGS.DELETE(id));
  },
};
