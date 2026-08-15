import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  RobotArm,
  RobotArmDetail,
  CreateRobotArmPayload,
  UpdateRobotArmPayload,
} from "@/types/robot-arm.types";

interface RobotArmListResponse {
  arms: RobotArm[];
}

export const robotArmService = {
  getById: async (id: string, sessionId?: string): Promise<RobotArmDetail> => {
    const response = (await apiClient.get<ApiResponse<RobotArmDetail>>(
      API_ENDPOINTS.MANAGER.ROBOT_ARMS.GET(id),
      {
        params: sessionId ? { sessionId } : undefined,
      },
    )) as unknown as ApiResponse<RobotArmDetail>;
    return response.value;
  },

  getList: async (sessionId?: string): Promise<RobotArm[]> => {
    const response = (await apiClient.get<ApiResponse<RobotArmListResponse>>(
      API_ENDPOINTS.MANAGER.ROBOT_ARMS.LIST,
      {
        params: sessionId ? { sessionId } : undefined,
      },
    )) as unknown as ApiResponse<RobotArmListResponse>;
    return response.value.arms;
  },

  create: async (data: CreateRobotArmPayload): Promise<RobotArm> => {
    const response = (await apiClient.post<ApiResponse<RobotArm>>(
      API_ENDPOINTS.MANAGER.ROBOT_ARMS.CREATE,
      data,
    )) as unknown as ApiResponse<RobotArm>;
    return response.value;
  },

  update: async (id: string, data: UpdateRobotArmPayload): Promise<RobotArm> => {
    const response = (await apiClient.put<ApiResponse<RobotArm>>(
      API_ENDPOINTS.MANAGER.ROBOT_ARMS.UPDATE(id),
      { ...data, id },
    )) as unknown as ApiResponse<RobotArm>;
    return response.value;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MANAGER.ROBOT_ARMS.DELETE(id));
  },

  toggleMaintenance: async (
    id: string,
    inMaintenance: boolean,
  ): Promise<{ id: string; code: string; status: string }> => {
    const response = (await apiClient.patch<
      ApiResponse<{ id: string; code: string; status: string }>
    >(API_ENDPOINTS.MANAGER.ROBOT_ARMS.MAINTENANCE(id, inMaintenance))) as unknown as ApiResponse<{
      id: string;
      code: string;
      status: string;
    }>;
    return response.value;
  },
};
