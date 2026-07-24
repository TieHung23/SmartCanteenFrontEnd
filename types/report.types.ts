export interface ReportRange {
  from: string;
  to: string;
  timezone: string;
}

// ── Dashboard (summary) ──

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  refundRate: number;
  topDish: string;
  newCustomers: number;
  totalComplaints: number;
  activeSessions: number;
  orderChange: number;
  revenueChange: number;
  refundChange: number;
  customerChange: number;
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
  status: number;
  label: string;
  count: number;
}

export interface RefundStatsBreakdown {
  type: string;
  label: string;
  count: number;
  amount: number;
  rate: number;
}

export interface RefundStats {
  totalRefunds: number;
  totalRefundAmount: number;
  approvedRefunds: number;
  rejectedRefunds: number;
  pendingRefunds: number;
  refundRate: number;
  breakdown: RefundStatsBreakdown[];
}

export interface SummaryReportResponse {
  range: ReportRange;
  dashboard: DashboardSummary;
  revenueTrend: RevenueDataPoint[];
  popularDishes: PopularDish[];
  orderStats: OrderStats[];
  refundStats: RefundStats;
}

// ── Sessions ──

export interface SessionReportItem {
  sessionId: string;
  sessionName: string;
  availableFrom: string;
  availableTo: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  expiredOrders: number;
  revenue: number;
  refundRequests: number;
  refundAmount: number;
  completionRate: number;
  refundRate: number;
}

export interface SessionReportResponse {
  range: ReportRange;
  items: SessionReportItem[];
}

// ── Order Issues ──

export interface OrderIssueItem {
  type: string;
  label: string;
  count: number;
  rate: number;
}

export interface OrderIssuesResponse {
  range: ReportRange;
  totalOrders: number;
  cancelledOrders: number;
  expiredOrders: number;
  refundRequestedOrders: number;
  cancelledRate: number;
  expiredRate: number;
  refundRequestRate: number;
  items: OrderIssueItem[];
}

// ── Refund Policies ──

export interface RefundPolicyReportItem {
  policyCode: string;
  policyName: string;
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalAmount: number;
  approvedAmount: number;
  approvalRate: number;
}

export interface RefundPolicyReportResponse {
  range: ReportRange;
  items: RefundPolicyReportItem[];
}

// ── Filter ──

export interface DateRange {
  from: string;
  to: string;
}

export type ReportPreset = "today" | "thisWeek" | "thisMonth" | "lastMonth" | "custom";
