import { z } from "zod";

export interface MealSetting {
  categoryId: string;
  quantity: number;
}

export interface MealListItem {
  id: string;
  name: string;
  description: string;
  priceAmount: number;
  priceCurrency: string;
  isActive: boolean;
  availableFrom: string;
  availableTo: string;
  availableForOrder: string;
}

export interface MealDetail extends MealListItem {
  mealSettings: MealSetting[];
}

export const MealSettingSchema = z.object({
  categoryId: z.string(),
  quantity: z.number().int().nonnegative(),
}) satisfies z.ZodType<MealSetting>;

export const MealListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceAmount: z.number().nonnegative(),
  priceCurrency: z.string(),
  isActive: z.boolean(),
  availableFrom: z.string(),
  availableTo: z.string(),
  availableForOrder: z.string(),
}) satisfies z.ZodType<MealListItem>;

export const MealDetailSchema = MealListItemSchema.extend({
  mealSettings: z.array(MealSettingSchema),
}) satisfies z.ZodType<MealDetail>;
