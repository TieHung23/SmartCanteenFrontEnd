import { z } from "zod";

export interface Category {
  id: string;
  name: string;
  description: string;
}

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
}) satisfies z.ZodType<Category>;
