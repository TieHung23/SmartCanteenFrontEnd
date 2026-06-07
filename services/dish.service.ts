import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Dish } from "@/types/dish.types";

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const dishService = {
  getDishesByMeal: async (mealId: string): Promise<PaginatedList<Dish>> => {
    return await apiClient.get<PaginatedList<Dish>, PaginatedList<Dish>>(API_ENDPOINTS.DISH.LIST, {
      params: { mealId, isActive: true, pageSize: 200 },
    });
  },
};
