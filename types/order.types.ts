import { z } from "zod";

// 0 = Pending | 1 = Preparing | 2 = Ready | 3 = Received | 4 = Cancelled

export type OrderStatus = 0 | 1 | 2 | 3 | 4;

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  0: { label: "Ordered", color: "#6b7280", bg: "#f3f4f6", icon: "📋" },
  1: { label: "Preparing", color: "#f07b2e", bg: "#fff8f4", icon: "👨‍🍳" },
  2: { label: "Ready", color: "#2db87a", bg: "#e8f8f0", icon: "✅" },
  3: { label: "Received", color: "#6366f1", bg: "#eef2ff", icon: "🎉" },
  4: { label: "Cancelled", color: "#ef4444", bg: "#fef2f2", icon: "❌" },
};

export interface OrderItem {
  dishId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface OrderListItem {
  id: string;
  mealId: string;
  paymentId: string | null;
  userId: string;
  status: OrderStatus;
  totalPrice: number;
  currency: string;
  itemCount: number;
  createdAtUtc: string;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[];
  updatedAtUtc: string | null;
}

export interface CreateOrderResponse {
  id: string;
  paymentId: string;
  totalPrice: number;
  currency: string;
  message: string;
  userRemainingBalance: number;
}

export interface CreateOrderItem {
  dishId: string;
  quantity: number;
}

export const OrderItemSchema = z.object({
  dishId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number(),
  currency: z.string(),
});

export const OrderListItemSchema = z.object({
  id: z.string(),
  mealId: z.string(),
  paymentId: z.string().nullable(),
  userId: z.string(),
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  totalPrice: z.number(),
  currency: z.string(),
  itemCount: z.number().int(),
  createdAtUtc: z.string(),
}) satisfies z.ZodType<OrderListItem>;

export const OrderDetailSchema = OrderListItemSchema.extend({
  items: z.array(OrderItemSchema),
  updatedAtUtc: z.string().nullable(),
}) satisfies z.ZodType<OrderDetail>;

export type Cart = Record<string, Record<string, number>>;
