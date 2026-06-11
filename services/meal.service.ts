import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { MealDetailSchema, type MealDetail, type MealListItem } from "@/types/meal.types";

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

export type CreateMealPayload = Omit<MealDetail, "id" | "isActive">;
export type UpdateMealPayload = Partial<Omit<CreateMealPayload, "id">>;

export const mealService = {
  getMeals: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    isActive?: boolean;
  }): Promise<PaginatedList<MealListItem>> => {
    try {
      const response = (await apiClient.get<ApiResponse<PaginatedList<MealListItem>>>(
        API_ENDPOINTS.MEAL.LIST,
        { params },
      )) as unknown as ApiResponse<PaginatedList<MealListItem>>;

      return response.value;
    } catch (error) {
      console.error("Error when listing meals session:", error);
      throw error;
    }
  },

  getMealDetail: async (id: string): Promise<MealDetail> => {
    try {
      const response = (await apiClient.get<ApiResponse<unknown>>(
        API_ENDPOINTS.MEAL.GET(id),
      )) as unknown as ApiResponse<unknown>;

      const rawData = response.value;
      const validatedData = MealDetailSchema.parse(rawData);

      return validatedData;
    } catch (error) {
      console.error(`Error when fetching meal detail ID ${id}:`, error);
      throw error;
    }
  },

  createMeal: async (
    data: CreateMealPayload,
  ): Promise<ApiResponse<{ id: string; name: string; message: string }>> => {
    try {
      const response = (await apiClient.post<
        ApiResponse<{ id: string; name: string; message: string }>
      >(API_ENDPOINTS.MEAL.CREATE, data)) as unknown as ApiResponse<{
        id: string;
        name: string;
        message: string;
      }>;

      return response;
    } catch (error) {
      console.error("Lỗi khi tạo mới ca ăn:", error);
      throw error;
    }
  },

  updateMeal: async (
    id: string,
    data: UpdateMealPayload,
  ): Promise<ApiResponse<{ id: string; name: string; message: string }>> => {
    try {
      const response = (await apiClient.put<
        ApiResponse<{ id: string; name: string; message: string }>
      >(API_ENDPOINTS.MEAL.UPDATE(id), data)) as unknown as ApiResponse<{
        id: string;
        name: string;
        message: string;
      }>;

      return response;
    } catch (error) {
      console.error(`Error when updating meal ID ${id}:`, error);
      throw error;
    }
  },

  deleteMeal: async (id: string): Promise<ApiResponse<{ id: string; message: string }>> => {
    try {
      const response = (await apiClient.delete<ApiResponse<{ id: string; message: string }>>(
        API_ENDPOINTS.MEAL.DELETE(id),
      )) as unknown as ApiResponse<{ id: string; message: string }>;

      return response;
    } catch (error) {
      console.error(`Error when deleting meal ID ${id}:`, error);
      throw error;
    }
  },
};
