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
  getById: async (id: string): Promise<RobotArmDetail> => {
    const response = (await apiClient.get<ApiResponse<RobotArmDetail>>(
      API_ENDPOINTS.MANAGER.ROBOT_ARMS.GET(id),
    )) as unknown as ApiResponse<RobotArmDetail>;
    return response.value;
  },

  getList: async (): Promise<RobotArm[]> => {
    const response = (await apiClient.get<ApiResponse<RobotArmListResponse>>(
      API_ENDPOINTS.MANAGER.ROBOT_ARMS.LIST,
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
};
