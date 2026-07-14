import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./session.service";
import type {
  ManagerUserDetail,
  ManagerUserFilters,
  ManagerUserListItem,
  ManagerUserStatusResult,
} from "@/types/manager-user.types";

export const managerUserService = {
  getUsers: async (params?: ManagerUserFilters): Promise<PaginatedList<ManagerUserListItem>> => {
    const response = (await apiClient.get<ApiResponse<PaginatedList<ManagerUserListItem>>>(
      API_ENDPOINTS.MANAGER_USERS.LIST,
      { params },
    )) as unknown as ApiResponse<PaginatedList<ManagerUserListItem>>;
    return response.value;
  },

  getUserDetail: async (id: string): Promise<ManagerUserDetail> => {
    const response = (await apiClient.get<ApiResponse<ManagerUserDetail>>(
      API_ENDPOINTS.MANAGER_USERS.GET(id),
    )) as unknown as ApiResponse<ManagerUserDetail>;
    return response.value;
  },

  suspendUser: async (id: string, reason: string): Promise<ManagerUserStatusResult> => {
    const response = (await apiClient.post<ApiResponse<ManagerUserStatusResult>>(
      API_ENDPOINTS.MANAGER_USERS.SUSPEND(id),
      { reason },
    )) as unknown as ApiResponse<ManagerUserStatusResult>;
    return response.value;
  },

  banUser: async (id: string, reason: string): Promise<ManagerUserStatusResult> => {
    const response = (await apiClient.post<ApiResponse<ManagerUserStatusResult>>(
      API_ENDPOINTS.MANAGER_USERS.BAN(id),
      { reason },
    )) as unknown as ApiResponse<ManagerUserStatusResult>;
    return response.value;
  },

  reactivateUser: async (id: string): Promise<ManagerUserStatusResult> => {
    const response = (await apiClient.post<ApiResponse<ManagerUserStatusResult>>(
      API_ENDPOINTS.MANAGER_USERS.REACTIVATE(id),
    )) as unknown as ApiResponse<ManagerUserStatusResult>;
    return response.value;
  },
};
