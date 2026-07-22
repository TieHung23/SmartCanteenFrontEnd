export type RobotArmStatus = "Idle" | "Busy" | "Error" | "Maintenance" | "Offline";

export interface RobotArm {
  id: string;
  code: string;
  name: string;
  ipAddress: string;
  stationIndex: number;
  status: RobotArmStatus;
  lastHeartbeatUtc: string | null;
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
