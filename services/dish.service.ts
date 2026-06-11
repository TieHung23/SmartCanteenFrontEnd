import apiClient from "@/lib/api/client";
import type { Dish } from "@/types/dish.types";
import type { ApiResponse, PaginatedList } from "./meal.service";

export const dishService = {
  getDishes: async (params?: {
    categoryId?: string;
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
    name?: string;
  }): Promise<PaginatedList<Dish>> => {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedList<Dish>>>("/api/dishes", {
        params,
      });

      return response.value;
    } catch (error) {
      console.error("Error listing dishes in dishService:", error);
      throw error;
    }
  },
};
