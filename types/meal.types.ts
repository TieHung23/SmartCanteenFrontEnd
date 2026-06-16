import { z } from "zod";

export interface MealTemplateSetting {
  categoryId: string;
  minQuantity: number;
  maxQuantity: number;
  isRequired: boolean;
}

export interface MealTemplate {
  name: string;
  settings: MealTemplateSetting[];
}

export interface MealDishInfo {
  dishId: string;
  quantity: number;
}

export interface MealListItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  availableFrom: string;
  availableTo: string;
  availableForOrder: string;
  dishes: MealDishInfo[];
}

export interface MealDetail extends MealListItem {
  mealTemplates: MealTemplate[];
}

export const MealTemplateSettingSchema = z.object({
  categoryId: z.string().uuid(),
  minQuantity: z.number().int().nonnegative(),
  maxQuantity: z.number().int().positive(),
  isRequired: z.boolean(),
}) satisfies z.ZodType<MealTemplateSetting>;

export const MealTemplateSchema = z.object({
  name: z.string(),
  settings: z.array(MealTemplateSettingSchema),
}) satisfies z.ZodType<MealTemplate>;

export const MealDishInfoSchema = z.object({
  dishId: z.string().uuid(),
  quantity: z.number().int().positive(),
}) satisfies z.ZodType<MealDishInfo>;

export const MealListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  availableFrom: z.string(),
  availableTo: z.string(),
  availableForOrder: z.string(),
  dishes: z.array(MealDishInfoSchema),
}) satisfies z.ZodType<MealListItem>;

export const MealDetailSchema = MealListItemSchema.extend({
  mealTemplates: z.array(MealTemplateSchema),
}) satisfies z.ZodType<MealDetail>;
