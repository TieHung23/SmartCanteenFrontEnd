import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { MealDetailSchema, MealDetail, MealListItem } from "@/types/meal.types";

export type CreateMealPayload = Omit<MealDetail, "id">;
export type UpdateMealPayload = Partial<CreateMealPayload>;

export interface PaginatedList<T> {
  items: T[];
  totalCount?: number;
}

export const mealService = {
  getMeals: async (params?: { pageNumber?: number; pageSize?: number; isActive?: boolean }) => {
    try {
      const response = await apiClient.get<
        PaginatedList<MealListItem>,
        PaginatedList<MealListItem>
      >(API_ENDPOINTS.MEAL.LIST, { params });
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách món ăn:", error);
      throw error;
    }
  },

  getMealDetail: async (id: string): Promise<{ value: MealDetail }> => {
    try {
      const response = await apiClient.get<{
        data?: { value?: unknown; [key: string]: unknown };
        value?: unknown;
      }>(API_ENDPOINTS.MEAL.GET(id));
      const responseBody = response.data || response;
      const validatedData = MealDetailSchema.parse(
        (responseBody as { value?: unknown }).value || responseBody,
      );
      return { value: validatedData };
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết món ăn ID ${id}:`, error);
      throw error;
    }
  },

  createMeal: async (data: CreateMealPayload) => {
    return await apiClient.post<MealDetail, MealDetail>(API_ENDPOINTS.MEAL.CREATE, data);
  },

  updateMeal: async (id: string, data: UpdateMealPayload) => {
    return await apiClient.put<MealDetail, MealDetail>(API_ENDPOINTS.MEAL.UPDATE(id), data);
  },

  deleteMeal: async (id: string) => {
    return await apiClient.delete<boolean, boolean>(API_ENDPOINTS.MEAL.DELETE(id));
  },
};
