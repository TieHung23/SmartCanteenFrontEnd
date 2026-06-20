import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Category } from "@/types/category.types";
import type { PaginatedList, ApiResponse } from "./session.service";

export interface CategoryPayload {
  name: string;
  description: string;
  image?: File | null;
}

export const categoryService = {
  getAll: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    name?: string;
  }): Promise<PaginatedList<Category>> => {
    try {
      const response = (await apiClient.get<ApiResponse<PaginatedList<Category>>>(
        API_ENDPOINTS.CATEGORY.LIST,
        {
          params: {
            pageSize: 100,
            ...params,
          },
        },
      )) as unknown as ApiResponse<PaginatedList<Category>>;

      return response.value;
    } catch (error) {
      console.error("Lỗi khi tải danh sách Categories:", error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Category> => {
    try {
      const response = (await apiClient.get<ApiResponse<Category>>(
        API_ENDPOINTS.CATEGORY.GET(id),
      )) as unknown as ApiResponse<Category>;
      return response.value;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  create: async (data: CategoryPayload): Promise<Category> => {
    try {
      const formData = new FormData();
      formData.append("Name", data.name);
      formData.append("Description", data.description);
      if (data.image) {
        formData.append("Image", data.image);
      }

      const response = (await apiClient.post<ApiResponse<Category>>(
        API_ENDPOINTS.CATEGORY.CREATE,
        formData,
        { headers: { "Content-Type": null } },
      )) as unknown as ApiResponse<Category>;
      return response.value;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  update: async (id: string, data: CategoryPayload): Promise<Category> => {
    try {
      const formData = new FormData();
      formData.append("Name", data.name);
      formData.append("Description", data.description);
      if (data.image) {
        formData.append("Image", data.image);
      }

      const response = (await apiClient.put<ApiResponse<Category>>(
        API_ENDPOINTS.CATEGORY.UPDATE(id),
        formData,
        { headers: { "Content-Type": null } },
      )) as unknown as ApiResponse<Category>;
      return response.value;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<{ id: string; message: string }> => {
    try {
      const response = (await apiClient.delete<ApiResponse<{ id: string; message: string }>>(
        API_ENDPOINTS.CATEGORY.DELETE(id),
      )) as unknown as ApiResponse<{ id: string; message: string }>;
      return response.value;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  },
};
