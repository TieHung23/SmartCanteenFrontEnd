import { z } from "zod";

// 0 = Pending | 1 = ReadyForPickup | 2 = Completed | 3 = Cancelled

export type OrderStatus = 0 | 1 | 2 | 3;

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  0: { label: "Pending", color: "#f07b2e", bg: "#fff8f4", icon: "📋" },
  1: { label: "Ready for Pickup", color: "#2db87a", bg: "#e8f8f0", icon: "✅" },
  2: { label: "Completed", color: "#6366f1", bg: "#eef2ff", icon: "🎉" },
  3: { label: "Cancelled", color: "#ef4444", bg: "#fef2f2", icon: "❌" },
};

export interface OrderItem {
  dishId: string;
  quantity: number;
  unitPrice: number;
  dishName?: string;
  imgUrl?: string | null;
}

export interface OrderListItem {
  id: string;
  sessionId: string;
  transactionId: string | null;
  userId: string;
  status: OrderStatus;
  totalPrice: number;
  itemCount: number;
  createdAtUtc: string;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[];
  updatedAtUtc: string | null;
}

export interface CreateOrderResponse {
  id: string;
  transactionId: string;
  totalPrice: number;
  message: string;
  userRemainingBalance: number;
  cartVersion?: number;
}

export interface CreateOrderItem {
  dishId: string;
  quantity: number;
}

export const OrderItemSchema = z
  .object({
    dishId: z.string(),
    quantity: z.number().int(),
    unitPrice: z.number(),
    dishName: z.string().optional(),
    imgUrl: z.string().nullable().optional(),
  })
  .passthrough();

export const OrderListItemSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  transactionId: z.string().nullable(),
  userId: z.string(),
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  totalPrice: z.number(),
  itemCount: z.number().int(),
  createdAtUtc: z.string(),
}) satisfies z.ZodType<OrderListItem>;

export const OrderDetailSchema = OrderListItemSchema.extend({
  items: z.array(OrderItemSchema),
  updatedAtUtc: z.string().nullable(),
}) satisfies z.ZodType<OrderDetail>;

export type Cart = Record<string, Record<string, number>>;
