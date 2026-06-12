import { useApiData } from "./useApiData";
import { mealService, PaginatedList } from "@/services/meal.service";
import type { MealDetail, MealListItem } from "@/types/meal.types";

export function useMeals(isActive?: boolean) {
  return useApiData<PaginatedList<MealListItem>>(async () => {
    const data = await mealService.getMeals({ pageSize: 50, isActive });
    return {
      value: data,
      isSuccess: true,
      message: undefined, // đổi null → undefined
    };
  }, [isActive]);
}

export function useMeal(id: string | null) {
  return useApiData<MealDetail | null>(async () => {
    if (!id) {
      return { isSuccess: false, value: null, message: "No ID provided" };
    }
    try {
      const result = await mealService.getMealDetail(id);
      return { value: result.value, isSuccess: true, message: undefined }; // đổi null → undefined
    } catch {
      return { isSuccess: false, value: null, message: "Failed to fetch meal" };
    }
  }, [id]);
}
