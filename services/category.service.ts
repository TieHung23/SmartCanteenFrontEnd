import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Category } from "@/types/category.types";
import type { PaginatedList } from "./meal.service";

export const categoryService = {
  getAll: async (): Promise<PaginatedList<Category>> => {
    return await apiClient.get<PaginatedList<Category>, PaginatedList<Category>>(
      API_ENDPOINTS.CATEGORY.LIST,
      { params: { pageSize: 100 } },
    );
  },
};
