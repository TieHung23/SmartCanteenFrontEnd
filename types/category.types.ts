import { z } from "zod";

export interface Category {
  id: string;
  name: string;
  description: string;
  imgUrl: string | null;
}

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imgUrl: z.string().nullable(),
}) satisfies z.ZodType<Category>;
