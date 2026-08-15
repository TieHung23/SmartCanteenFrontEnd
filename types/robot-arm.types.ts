export type RobotArmStatus = "Idle" | "Busy" | "Error" | "Maintenance" | "Offline";

export interface RobotArmLane {
  slotConfigurationId: string;
  sessionId: string;
  laneCode: string;
  dishId: string;
  dishName: string;
  capacity: number;
}

export interface RobotArm {
  id: string;
  code: string;
  name: string;
  ipAddress: string;
  stationIndex: number;
  status: RobotArmStatus;
  lastHeartbeatUtc: string | null;
}

export interface RobotArmDetail extends RobotArm {
  lanes: RobotArmLane[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateRobotArmPayload {
  code: string;
  ipAddress: string;
  stationIndex: number;
  name: string;
}

export interface UpdateRobotArmPayload {
  ipAddress: string;
  stationIndex: number;
  name: string;
}

export interface ToggleMaintenanceResponse {
  id: string;
  code: string;
  status: RobotArmStatus;
}
