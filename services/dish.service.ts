import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Dish, DishListPayload, DishUpdatePayload } from "@/types/dish.types";
import { type ApiResponse, type PaginatedList } from "./session.service";

export const dishService = {
  getDishes: async (params?: {
    categoryId?: string;
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
    name?: string;
  }): Promise<PaginatedList<Dish>> => {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedList<Dish>>>(
        API_ENDPOINTS.DISH.LIST,
        { params },
      );

      const checkResponse = response as unknown as {
        value?: PaginatedList<Dish>;
        data?: { value?: PaginatedList<Dish> };
      };

      if (checkResponse && checkResponse.value) {
        return checkResponse.value;
      }

      if (checkResponse && checkResponse.data && checkResponse.data.value) {
        return checkResponse.data.value;
      }

      const fallbackData = (response as unknown as { data?: PaginatedList<Dish> }).data || response;
      return fallbackData as PaginatedList<Dish>;
    } catch (error) {
      console.error("Error listing dishes in dishService:", error);
      throw error;
    }
  },

  getDish: async (id: string): Promise<Dish> => {
    try {
      const response = (await apiClient.get<ApiResponse<Dish>>(
        API_ENDPOINTS.DISH.GET(id),
      )) as unknown as ApiResponse<Dish>;
      return response.value;
    } catch (error) {
      console.error(`Error fetching dish ${id}:`, error);
      throw error;
    }
  },

  createDish: async (data: DishListPayload): Promise<Dish> => {
    try {
      const formData = new FormData();
      formData.append("Name", data.name ?? "");
      formData.append("Description", data.description ?? "");
      formData.append("Price", String(data.price ?? 0));
      formData.append("CategoryId", data.categoryId ?? "");
      if (data.image) {
        formData.append("Image", data.image);
      }

      const response = (await apiClient.post<ApiResponse<Dish>>(
        API_ENDPOINTS.DISH.CREATE,
        formData,
        { headers: { "Content-Type": null } },
      )) as unknown as ApiResponse<Dish>;
      return response.value;
    } catch (error) {
      console.error("Error creating dish:", error);
      throw error;
    }
  },

  updateDish: async (id: string, data: DishUpdatePayload): Promise<Dish> => {
    try {
      const formData = new FormData();
      formData.append("Name", data.name ?? "");
      formData.append("Description", data.description ?? "");
      formData.append("Price", String(data.price ?? 0));
      formData.append("CategoryId", data.categoryId ?? "");
      if (data.isActive !== undefined) {
        formData.append("IsActive", String(data.isActive));
      }
      if (data.image) {
        formData.append("Image", data.image);
      }

      const response = (await apiClient.put<ApiResponse<Dish>>(
        API_ENDPOINTS.DISH.UPDATE(id),
        formData,
        { headers: { "Content-Type": null } },
      )) as unknown as ApiResponse<Dish>;
      return response.value;
    } catch (error) {
      console.error(`Error updating dish ${id}:`, error);
      throw error;
    }
  },

  deleteDish: async (id: string): Promise<{ id: string; message: string }> => {
    try {
      const response = (await apiClient.delete<ApiResponse<{ id: string; message: string }>>(
        API_ENDPOINTS.DISH.DELETE(id),
      )) as unknown as ApiResponse<{ id: string; message: string }>;
      return response.value;
    } catch (error) {
      console.error(`Error deleting dish ${id}:`, error);
      throw error;
    }
  },
};
