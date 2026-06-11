import { z } from "zod";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number; // số điểm
  isActive: boolean;
  categoryId: string;
  imgUrl: string | null;
}

export const DishSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  isActive: z.boolean(),
  categoryId: z.string(),
  imgUrl: z.string().nullable(),
}) satisfies z.ZodType<Dish>;
