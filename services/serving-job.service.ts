import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  ServingJobStatus,
  ServingJobListResponse,
  ServingJobActionResponse,
  ServingJobEventsResponse,
  ManualCompleteServingJobPayload,
} from "@/types/serving-job.types";

export const servingJobService = {
  getList: async (
    status?: ServingJobStatus | "All" | "",
    take?: number,
    sessionId?: string,
  ): Promise<ServingJobListResponse> => {
    const statusParam = status && status !== "All" ? status : undefined;
    const response = (await apiClient.get<unknown>(
      API_ENDPOINTS.MANAGER.SERVING_JOBS.LIST(statusParam, take, sessionId),
    )) as unknown as Record<string, unknown>;

    const rawVal = (response?.value || response) as Record<string, unknown>;
    let rawJobs: Record<string, unknown>[] = [];
    let total = 0;

    if (Array.isArray(rawVal)) {
      rawJobs = rawVal;
      total = rawVal.length;
    } else if (Array.isArray(rawVal?.jobs)) {
      rawJobs = rawVal.jobs as Record<string, unknown>[];
      total = typeof rawVal.total === "number" ? rawVal.total : rawJobs.length;
    } else if (Array.isArray(rawVal?.items)) {
      rawJobs = rawVal.items as Record<string, unknown>[];
      total = typeof rawVal.total === "number" ? rawVal.total : rawJobs.length;
    }

    const jobs = rawJobs.map((j) => {
      const trayObj = (j.tray || j.trayInfo || {}) as Record<string, unknown>;
      const trayCode =
        (j.trayCode as string) ||
        (trayObj.code as string) ||
        (trayObj.trayCode as string) ||
        (j.trayId as string) ||
        null;

      return {
        jobId: (j.jobId || j.id || "") as string,
        orderId: (j.orderId || "") as string,
        status: (j.status || "Queued") as ServingJobStatus,
        trayId: (j.trayId || null) as string | null,
        trayCode: trayCode,
        pickupSlotId: (j.pickupSlotId || null) as string | null,
        failureReason: (j.failureReason || j.errorMessage || null) as string | null,
        createdAtUtc: (j.createdAtUtc || j.createdAt || new Date().toISOString()) as string,
        pushedAtUtc: (j.pushedAtUtc || null) as string | null,
        acknowledgedAtUtc: (j.acknowledgedAtUtc || null) as string | null,
        completedAtUtc: (j.completedAtUtc || null) as string | null,
      };
    });

    return { total, jobs };
  },

  requeue: async (id: string): Promise<ServingJobActionResponse> => {
    const response = (await apiClient.post<ApiResponse<ServingJobActionResponse>>(
      API_ENDPOINTS.MANAGER.SERVING_JOBS.REQUEUE(id),
    )) as unknown as ApiResponse<ServingJobActionResponse>;
    return response.value;
  },

  manualComplete: async (
    id: string,
    payload?: ManualCompleteServingJobPayload,
  ): Promise<ServingJobActionResponse> => {
    const response = (await apiClient.post<ApiResponse<ServingJobActionResponse>>(
      API_ENDPOINTS.MANAGER.SERVING_JOBS.MANUAL_COMPLETE(id),
      payload || { note: null },
    )) as unknown as ApiResponse<ServingJobActionResponse>;
    return response.value;
  },

  bindTray: async (
    id: string,
    payload?: { trayCode?: string; trayId?: string },
  ): Promise<ServingJobActionResponse> => {
    const response = (await apiClient.post<ApiResponse<ServingJobActionResponse>>(
      API_ENDPOINTS.MANAGER.SERVING_JOBS.BIND_TRAY(id),
      payload || {},
    )) as unknown as ApiResponse<ServingJobActionResponse>;
    return response.value;
  },

  getEvents: async (id: string): Promise<ServingJobEventsResponse> => {
    try {
      const response = (await apiClient.get<ApiResponse<ServingJobEventsResponse>>(
        API_ENDPOINTS.MANAGER.SERVING_JOBS.EVENTS(id),
      )) as unknown as ApiResponse<ServingJobEventsResponse>;
      return response?.value || { jobId: id, orderId: "", total: 0, events: [] };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        return { jobId: id, orderId: "", total: 0, events: [] };
      }
      throw err;
    }
  },
};
