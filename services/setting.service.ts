import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./session.service";

export interface SettingListItem {
  id: string;
  code: string;
  name: string;
  description: string;
  group: string;
  scope: string;
  value: string;
  type: string;
}

export const settingService = {
  getSettings: async (params?: {
    code?: string;
    name?: string;
    group?: string;
    scope?: string;
    type?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedList<SettingListItem>> => {
    const response = (await apiClient.get<ApiResponse<PaginatedList<SettingListItem>>>(
      API_ENDPOINTS.SETTINGS.LIST,
      { params },
    )) as unknown as ApiResponse<PaginatedList<SettingListItem>>;
    return response.value;
  },
};
