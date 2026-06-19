export interface SessionTemplateSetting {
  categoryId: string;
  minQuantity: number;
  maxQuantity: number;
  isRequired: boolean;
}

export interface SessionTemplate {
  id: string;
  name: string;
  settings: SessionTemplateSetting[];
}

export interface SessionDishInfo {
  dishId: string;
  quantity: number;
}

export interface SessionListItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  availableFrom: string;
  availableTo: string;
  availableForOrder: string;
  dishes: SessionDishInfo[];
}

export interface SessionDetail extends SessionListItem {
  mealTemplates: SessionTemplate[];
}

export interface CreateSessionTemplateSetting {
  categoryId: string;
  minQuantity: number;
  maxQuantity: number;
  isRequired: boolean;
}

export interface CreateSessionTemplate {
  name: string;
  settings: CreateSessionTemplateSetting[];
}

export interface CreateSessionRequest {
  name: string;
  description: string;
  availableFrom: string;
  availableTo: string;
  availableForOrder: string;
  mealTemplates: CreateSessionTemplate[];
  dishes: SessionDishInfo[];
}

import { z } from "zod";

export const SessionTemplateSettingSchema = z.object({
  categoryId: z.string().uuid(),
  minQuantity: z.number().int().nonnegative(),
  maxQuantity: z.number().int().positive(),
  isRequired: z.boolean(),
}) satisfies z.ZodType<SessionTemplateSetting>;

export const SessionTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  settings: z.array(SessionTemplateSettingSchema),
}) satisfies z.ZodType<SessionTemplate>;

export const SessionDishInfoSchema = z.object({
  dishId: z.string().uuid(),
  quantity: z.number().int().positive(),
}) satisfies z.ZodType<SessionDishInfo>;

export const SessionListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  availableFrom: z.string(),
  availableTo: z.string(),
  availableForOrder: z.string(),
  dishes: z.array(SessionDishInfoSchema),
}) satisfies z.ZodType<SessionListItem>;

export const SessionDetailSchema = SessionListItemSchema.extend({
  mealTemplates: z.array(SessionTemplateSchema),
}) satisfies z.ZodType<SessionDetail>;
