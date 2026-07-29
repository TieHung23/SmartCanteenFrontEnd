import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  SummaryReportResponse,
  SessionReportResponse,
  OrderIssuesResponse,
  RefundPolicyReportResponse,
  SessionDetailReportData,
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

  getSessionDetail: async (sessionId: string) => {
    const response = (await apiClient.get<ApiResponse<SessionDetailReportData>>(
      API_ENDPOINTS.REPORT.SESSION_DETAIL(sessionId),
    )) as unknown as ApiResponse<SessionDetailReportData>;
    return response.value;
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
