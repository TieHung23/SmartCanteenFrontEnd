export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  refundRate: number;
  topDish: string;
  orderChange: number;
  revenueChange: number;
  refundChange: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface PopularDish {
  dishId: string;
  dishName: string;
  totalOrders: number;
  totalQuantity: number;
  revenue: number;
}

export interface OrderStats {
  status: string;
  label: string;
  count: number;
}

export interface RefundStats {
  totalRefunds: number;
  totalRefundAmount: number;
  approvedRefunds: number;
  rejectedRefunds: number;
  pendingRefunds: number;
}

export interface DateRange {
  from: string;
  to: string;
}

export type ReportPreset = "today" | "thisWeek" | "thisMonth" | "lastMonth" | "custom";
