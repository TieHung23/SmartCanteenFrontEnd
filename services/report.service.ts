import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { sessionService, type ApiResponse } from "./session.service";
import { orderService } from "./order.service";
import type { OrderListItem } from "@/types/order.types";
import type {
  SummaryReportResponse,
  SessionReportResponse,
  OrderIssuesResponse,
  RefundPolicyReportResponse,
  SessionDetailReportData,
  OrderStats,
  SessionDetailOrderTrendItem,
  PopularDish,
  SessionDetailRecentOrder,
} from "@/types/report.types";

export const reportService = {
  getSummary: async (params?: { from?: string; to?: string }) => {
    const response = (await apiClient.get<ApiResponse<SummaryReportResponse>>(
      API_ENDPOINTS.REPORT.SUMMARY,
      { params },
    )) as unknown as ApiResponse<SummaryReportResponse>;
    return response.value;
  },

  getSessions: async (params?: { from?: string; to?: string }) => {
    const response = (await apiClient.get<ApiResponse<SessionReportResponse>>(
      API_ENDPOINTS.REPORT.SESSIONS,
      { params },
    )) as unknown as ApiResponse<SessionReportResponse>;
    return response.value;
  },

  getSessionDetail: async (sessionId: string): Promise<SessionDetailReportData> => {
    try {
      const response = (await apiClient.get<ApiResponse<SessionDetailReportData>>(
        API_ENDPOINTS.REPORT.SESSION_DETAIL(sessionId),
      )) as unknown as ApiResponse<SessionDetailReportData>;
      if (response?.value) {
        return response.value;
      }
    } catch (err) {
      console.warn(
        `[reportService.getSessionDetail] Backend reporting endpoint failed for session ${sessionId}, using fallback:`,
        err,
      );
    }

    // Fallback: Build SessionDetailReportData from sessionService and orderService
    try {
      const sessionInfo = await sessionService.getSessionDetail(sessionId);
      const ordersRes = await orderService
        .getManagerOrdersBySession(sessionId, { pageSize: 200 })
        .catch(() => null);

      const orders: OrderListItem[] = ordersRes?.items || [];

      // Calculate KPI summary
      const totalOrders = orders.length;
      let completedOrders = 0;
      let cancelledOrders = 0;
      let expiredOrders = 0;
      let pendingOrders = 0;
      let preparingOrders = 0;
      let readyForPickupOrders = 0;
      let totalRevenue = 0;

      orders.forEach((o) => {
        if (o.status === 2) completedOrders++;
        else if (o.status === 3) cancelledOrders++;
        else if (o.status === 7) expiredOrders++;
        else if (o.status === 0) pendingOrders++;
        else if (o.status === 4) preparingOrders++;
        else if (o.status === 1) readyForPickupOrders++;

        if (o.status !== 3 && o.status !== 7) {
          totalRevenue += o.totalPrice || 0;
        }
      });

      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
      const refundRate =
        totalOrders > 0 ? ((cancelledOrders + expiredOrders) / totalOrders) * 100 : 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const orderStats: OrderStats[] = [
        { status: 0, label: "Chờ xử lý", count: pendingOrders },
        { status: 4, label: "Đang chế biến", count: preparingOrders },
        { status: 1, label: "Sẵn sàng", count: readyForPickupOrders },
        { status: 2, label: "Hoàn thành", count: completedOrders },
        { status: 3, label: "Đã hủy", count: cancelledOrders },
        { status: 7, label: "Hết hạn", count: expiredOrders },
      ];

      // Build 30-min order trend
      const trendMap: Record<string, { orders: number; revenue: number }> = {};
      orders.forEach((o) => {
        if (!o.createdAtUtc) return;
        const d = new Date(o.createdAtUtc);
        const mins = d.getMinutes() < 30 ? "00" : "30";
        const hour = String(d.getHours()).padStart(2, "0");
        const bucket = `${hour}:${mins}`;
        if (!trendMap[bucket]) {
          trendMap[bucket] = { orders: 0, revenue: 0 };
        }
        trendMap[bucket].orders += 1;
        if (o.status !== 3 && o.status !== 7) {
          trendMap[bucket].revenue += o.totalPrice || 0;
        }
      });

      const orderTrend: SessionDetailOrderTrendItem[] = Object.entries(trendMap)
        .map(([timeBucket, val]) => ({
          timeBucket,
          orders: val.orders,
          revenue: val.revenue,
        }))
        .sort((a, b) => a.timeBucket.localeCompare(b.timeBucket));

      const popularDishes: PopularDish[] = (sessionInfo.dishes || []).map((d) => ({
        dishId: d.dishId,
        dishName: d.dishName || "Món ăn",
        imgUrl: d.imgUrl ?? null,
        totalOrders: 0,
        totalQuantity: d.preparedQuantity || 0,
        revenue: (d.priceAmount || 0) * (d.preparedQuantity || 0),
      }));

      const recentOrders: SessionDetailRecentOrder[] = orders.slice(0, 20).map((o) => ({
        orderId: o.id,
        userId: o.userId || "",
        customerName: o.sessionName ? `Đơn hàng (${o.sessionName})` : "Khách hàng",
        customerEmail: "",
        status: o.status,
        totalPrice: o.totalPrice,
        itemCount: o.itemCount,
        createdAtUtc: o.createdAtUtc,
      }));

      return {
        session: {
          sessionId: sessionInfo.id,
          sessionName: sessionInfo.name,
          description: sessionInfo.description,
          isActive: Boolean(sessionInfo.isActive),
          isFinalized: Boolean(sessionInfo.isFinalized),
          availableForOrder: sessionInfo.availableForOrder,
          availableFrom: sessionInfo.availableFrom,
          availableTo: sessionInfo.availableTo,
          finalizationDeadline: sessionInfo.finalizationDeadline ?? undefined,
          finalizedAtUtc: sessionInfo.finalizedAtUtc,
        },
        summary: {
          totalOrders,
          pendingOrders,
          preparingOrders,
          readyForPickupOrders,
          completedOrders,
          cancelledOrders,
          expiredOrders,
          totalRevenue,
          refundRequests: 0,
          approvedRefunds: 0,
          rejectedRefunds: 0,
          pendingRefunds: 0,
          refundAmount: 0,
          completionRate,
          cancelRate,
          refundRate,
          averageOrderValue,
        },
        timeline: [],
        orderTrend,
        orderStats,
        popularDishes,
        recentOrders,
      };
    } catch (fallbackError) {
      console.error("[reportService.getSessionDetail] Fallback failed:", fallbackError);
      throw fallbackError;
    }
  },

  getOrderIssues: async (params?: { from?: string; to?: string }) => {
    const response = (await apiClient.get<ApiResponse<OrderIssuesResponse>>(
      API_ENDPOINTS.REPORT.ORDER_ISSUES,
      { params },
    )) as unknown as ApiResponse<OrderIssuesResponse>;
    return response.value;
  },

  getRefundPolicies: async (params?: { from?: string; to?: string }) => {
    const response = (await apiClient.get<ApiResponse<RefundPolicyReportResponse>>(
      API_ENDPOINTS.REPORT.REFUND_POLICIES,
      { params },
    )) as unknown as ApiResponse<RefundPolicyReportResponse>;
    return response.value;
  },
};
