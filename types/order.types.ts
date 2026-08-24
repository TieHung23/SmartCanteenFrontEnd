import { z } from "zod";

// 0 = Pending | 1 = ReadyForPickup | 2 = Completed | 3 = Cancelled | 4 = Preparing | 7 = Expired

export type OrderStatus = 0 | 1 | 2 | 3 | 4 | 7;

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  0: { label: "Chờ xử lý", color: "#f07b2e", bg: "#fff8f4", icon: "📋" },
  1: { label: "Sẵn sàng", color: "#2db87a", bg: "#e8f8f0", icon: "✅" },
  2: { label: "Đã hoàn thành", color: "#6366f1", bg: "#eef2ff", icon: "🎉" },
  3: { label: "Đã hủy", color: "#ef4444", bg: "#fef2f2", icon: "❌" },
  4: { label: "Đang chế biến", color: "#3b82f6", bg: "#eff6ff", icon: "⚙️" },
  7: { label: "Đã hết hạn", color: "#6b7280", bg: "#f3f4f6", icon: "⏰" },
};

// 0 = Pending | 1 = Confirmed | 2 = ChangePending | 3 = Swapped | 4 = Refunded | 5 = RefundPending

export type OrderItemStatus = 0 | 1 | 2 | 3 | 4 | 5;

export const ORDER_ITEM_STATUS_META: Record<
  OrderItemStatus,
  { label: string; color: string; bg: string }
> = {
  0: { label: "Đang xử lý", color: "#f07b2e", bg: "#fff8f4" },
  1: { label: "Đã xác nhận", color: "#2db87a", bg: "#e8f8f0" },
  2: { label: "Cần đổi món/hoàn tiền", color: "#ef4444", bg: "#fef2f2" },
  3: { label: "Đã đổi món", color: "#6366f1", bg: "#eef2ff" },
  4: { label: "Đã hoàn tiền", color: "#6b7280", bg: "#f3f4f6" },
  5: { label: "Chờ hoàn tiền duyệt", color: "#f59e0b", bg: "#fffbeb" },
};

export interface OrderItem {
  dishId: string;
  quantity: number;
  unitPrice: number;
  dishName?: string;
  imgUrl?: string | null;
  itemStatus?: OrderItemStatus;
  proposalId?: string | null;
}

export interface OrderListItem {
  id: string;
  sessionId: string;
  sessionName?: string | null;
  transactionId: string | null;
  userId: string;
  status: OrderStatus;
  totalPrice: number;
  itemCount: number;
  createdAtUtc: string;
}

export interface OrderStatusHistory {
  id: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reasonCode?: string | null;
  note?: string | null;
  createdAtUtc: string;
  createdBy?: string | null;
}

export interface OrderDetail extends OrderListItem {
  mealTemplateId?: string | null;
  name?: string | null;
  imgUrl?: string | null;
  items: OrderItem[];
  statusHistories?: OrderStatusHistory[];
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
    itemStatus: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
      .optional(),
    proposalId: z.string().nullable().optional(),
  })
  .passthrough();

export const OrderListItemSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  sessionName: z.string().nullable().optional(),
  transactionId: z.string().nullable(),
  userId: z.string(),
  status: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(7),
  ]),
  totalPrice: z.number(),
  itemCount: z.number().int(),
  createdAtUtc: z.string(),
}) satisfies z.ZodType<OrderListItem>;

export const OrderDetailSchema = OrderListItemSchema.extend({
  items: z.array(OrderItemSchema),
  updatedAtUtc: z.string().nullable(),
}) satisfies z.ZodType<OrderDetail>;

export type Cart = Record<string, Record<string, number>>;

// ── Change Proposal ──

export type ChangeProposalStatus = 0 | 1 | 2 | 3;

export const CHANGE_PROPOSAL_STATUS_META: Record<
  ChangeProposalStatus,
  { label: string; color: string; bg: string }
> = {
  0: { label: "Chờ phản hồi", color: "#f07b2e", bg: "#fff8f4" },
  1: { label: "Đã đổi món", color: "#2db87a", bg: "#e8f8f0" },
  2: { label: "Đã hoàn tiền món", color: "#2db87a", bg: "#e8f8f0" },
  3: { label: "Đã hoàn tiền & hủy đơn", color: "#6366f1", bg: "#eef2ff" },
};

export type AllowedAction = "SwapItem" | "RefundItem" | "RefundOrder";

export interface GetOrdersParams {
  pageSize?: number;
  pageNumber?: number;
  status?: OrderStatus;
  sessionId?: string;
  createdFrom?: string;
  createdTo?: string;
  sessionDateFrom?: string;
  sessionDateTo?: string;
}

export interface ChangeProposalDetail {
  id: string;
  orderId: string;
  currentDishId: string;
  currentDishName: string;
  suggestedDishId: string | null;
  suggestedDishName: string | null;
  selectedDishId: string | null;
  selectedDishName: string | null;
  isRequiredItem: boolean;
  requiredCategoryId: string | null;
  currentUnitPrice?: number | null;
  proposalStatus: ChangeProposalStatus;
  allowedActions: AllowedAction[];
  respondedAtUtc: string | null;
  createdAtUtc: string;
  responseDeadlineUtc?: string | null;
  expiresAtUtc?: string | null;
  isExpired?: boolean;
}
