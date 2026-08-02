import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Dish } from "@/types/dish.types";
import {
  type SessionDetail,
  type SessionListItem,
  type CreateSessionRequest,
  type SessionCalendarData,
} from "@/types/session.types";
import { SessionDetailSchema } from "@/types/session.types";

export interface ApiResponse<T> {
  value: T;
  isSuccess: boolean;
  message: string | null;
  error?: string | null;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const sessionService = {
  getSessions: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    isActive?: boolean;
    name?: string;
  }): Promise<PaginatedList<SessionListItem>> => {
    const response = (await apiClient.get<ApiResponse<PaginatedList<SessionListItem>>>(
      API_ENDPOINTS.SESSION.LIST,
      { params },
    )) as unknown as ApiResponse<PaginatedList<SessionListItem>>;

    return response.value;
  },

  getSessionCalendar: async (year?: number): Promise<SessionCalendarData | null> => {
    try {
      const response = (await apiClient.get<ApiResponse<SessionCalendarData>>(
        API_ENDPOINTS.SESSION.CALENDAR,
        { params: year ? { year } : undefined },
      )) as unknown as ApiResponse<SessionCalendarData>;

      return response.value || null;
    } catch (err) {
      console.error("Error fetching session calendar:", err);
      return null;
    }
  },

  getSessionDetail: async (id: string): Promise<SessionDetail> => {
    const response = (await apiClient.get<ApiResponse<unknown>>(
      API_ENDPOINTS.SESSION.GET(id),
    )) as unknown as ApiResponse<unknown>;

    const rawData = response.value;
    const validatedData = SessionDetailSchema.parse(rawData);

    return validatedData;
  },

  createSession: async (
    data: CreateSessionRequest,
  ): Promise<ApiResponse<{ id: string; name: string; message: string }>> => {
    const response = (await apiClient.post<
      ApiResponse<{ id: string; name: string; message: string }>
    >(API_ENDPOINTS.SESSION.CREATE, data)) as unknown as ApiResponse<{
      id: string;
      name: string;
      message: string;
    }>;

    return response;
  },

  updateSession: async (
    id: string,
    data: Partial<CreateSessionRequest> & { isActive?: boolean },
  ): Promise<ApiResponse<{ id: string; name: string; message: string }>> => {
    const response = (await apiClient.put<
      ApiResponse<{ id: string; name: string; message: string }>
    >(API_ENDPOINTS.SESSION.UPDATE(id), data)) as unknown as ApiResponse<{
      id: string;
      name: string;
      message: string;
    }>;

    return response;
  },

  deleteSession: async (id: string): Promise<ApiResponse<{ id: string; message: string }>> => {
    const response = (await apiClient.delete<ApiResponse<{ id: string; message: string }>>(
      API_ENDPOINTS.SESSION.DELETE(id),
    )) as unknown as ApiResponse<{ id: string; message: string }>;

    return response;
  },

  finalizeSession: async (
    id: string,
    preparedDishes: { dishId: string; preparedQuantity: number }[],
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = (await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.SESSION.FINALIZE(id),
      { sessionId: id, preparedDishes },
    )) as unknown as ApiResponse<{ message: string }>;

    return response;
  },

  getAllDishes: async (): Promise<Dish[]> => {
    const response = (await apiClient.get<ApiResponse<PaginatedList<Dish>>>(
      API_ENDPOINTS.DISH.LIST,
      { params: { pageSize: 100 } },
    )) as unknown as ApiResponse<PaginatedList<Dish>>;

    return response.value?.items || [];
  },
};
