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
  id: string;
  dishId: string;
  dishName?: string;
  imgUrl?: string | null;
  priceAmount?: number;
  categoryId?: string;
  preparedQuantity?: number | null;
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
  isFinalized?: boolean;
  finalizedAtUtc?: string | null;
  finalizationDeadline?: string | null;
  autoFinalizePolicy?: number;
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

export interface CreateSessionDishPayload {
  dishId: string;
}

export interface CreateSessionRequest {
  name: string;
  description: string;
  availableFrom: string;
  availableTo: string;
  availableForOrder: string;
  finalizationDeadline?: string;
  autoFinalizePolicy?: number;
  mealTemplates: CreateSessionTemplate[];
  dishes: CreateSessionDishPayload[];
}

import { z } from "zod";

export const SessionTemplateSettingSchema = z.object({
  categoryId: z.string(),
  minQuantity: z.number().int().nonnegative(),
  maxQuantity: z.number().int().positive(),
  isRequired: z.boolean(),
}) satisfies z.ZodType<SessionTemplateSetting>;

export const SessionTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  settings: z.array(SessionTemplateSettingSchema),
}) satisfies z.ZodType<SessionTemplate>;

export const SessionDishInfoSchema = z
  .object({
    id: z.string(),
    dishId: z.string(),
    dishName: z.string().optional(),
    imgUrl: z.string().nullable().optional(),
    priceAmount: z.number().optional(),
    categoryId: z.string().optional(),
    preparedQuantity: z.number().int().nonnegative().nullable().optional(),
  })
  .passthrough() satisfies z.ZodType<SessionDishInfo>;

export const SessionListItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    isActive: z.boolean(),
    availableFrom: z.string(),
    availableTo: z.string(),
    availableForOrder: z.string(),
    dishes: z.array(SessionDishInfoSchema),
    isFinalized: z.boolean().optional(),
    finalizedAtUtc: z.string().nullable().optional(),
    finalizationDeadline: z.string().nullable().optional(),
  })
  .passthrough() satisfies z.ZodType<SessionListItem>;

export const SessionDetailSchema = SessionListItemSchema.extend({
  mealTemplates: z.array(SessionTemplateSchema),
}).passthrough() satisfies z.ZodType<SessionDetail>;

export interface SessionCalendarDay {
  date: string;
  sessionCount: number;
}

export interface SessionCalendarData {
  year: number;
  timezone: string;
  totalDays: number;
  totalSessions: number;
  days: SessionCalendarDay[];
}

/** Portions currently on order for a single dish in a session. */
export interface SessionDishQuantity {
  dishId: string;
  dishName: string;
  orderedQuantity: number;
}

/** Response of GET /api/sessions/{id}/dish-quantities (Manager only). */
export interface SessionDishQuantities {
  sessionId: string;
  sessionName: string;
  totalOrderedQuantity: number;
  dishes: SessionDishQuantity[];
}
