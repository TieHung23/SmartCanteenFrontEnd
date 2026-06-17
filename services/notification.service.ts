import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./meal.service";
import type { NotificationItem, UnreadCount } from "@/types/notification.types";

export const notificationService = {
  getList: async (params?: { pageSize?: number; pageNumber?: number; isRead?: boolean }) => {
    const response = await apiClient.get<ApiResponse<PaginatedList<NotificationItem>>>(
      API_ENDPOINTS.NOTIFICATION.LIST,
      { params },
    );
    const data =
      (response as unknown as ApiResponse<PaginatedList<NotificationItem>>).value || response;
    return data;
  },
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<UnreadCount>>(
      API_ENDPOINTS.NOTIFICATION.UNREAD_COUNT,
    );
    const data = (response as unknown as ApiResponse<UnreadCount>).value || response;
    return data?.count ?? 0;
  },
  markAsRead: async (id: string) => {
    await apiClient.put(API_ENDPOINTS.NOTIFICATION.READ(id));
  },
  markAllAsRead: async () => {
    await apiClient.put(API_ENDPOINTS.NOTIFICATION.READ_ALL);
  },
};
