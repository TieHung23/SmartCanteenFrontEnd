import { z } from "zod";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number; // số điểm
  currency: string;
  stockQuantity: number;
  isActive: boolean;
  mealId: string;
  categoryId: string;
}

export const DishSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string(),
  stockQuantity: z.number().int(),
  isActive: z.boolean(),
  mealId: z.string(),
  categoryId: z.string(),
}) satisfies z.ZodType<Dish>;
