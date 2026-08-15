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
  ): Promise<ServingJobListResponse> => {
    const statusParam = status && status !== "All" ? status : undefined;
    const response = (await apiClient.get<ApiResponse<ServingJobListResponse>>(
      API_ENDPOINTS.MANAGER.SERVING_JOBS.LIST(statusParam, take),
    )) as unknown as ApiResponse<ServingJobListResponse>;
    return response.value;
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

  getEvents: async (id: string): Promise<ServingJobEventsResponse> => {
    const response = (await apiClient.get<ApiResponse<ServingJobEventsResponse>>(
      API_ENDPOINTS.MANAGER.SERVING_JOBS.EVENTS(id),
    )) as unknown as ApiResponse<ServingJobEventsResponse>;
    return response.value;
  },
};
