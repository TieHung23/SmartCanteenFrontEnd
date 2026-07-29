export interface SlotConfiguration {
  id: string;
  sessionId: string;
  dishId: string;
  laneCode: string;
  capacity: number;
  robotArmId: string | null;
}

export interface SlotConfigurationDetail extends SlotConfiguration {
  sessionName: string;
  dishName: string;
  robotArmCode: string | null;
  robotArmName: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface SlotConfigurationListResponse {
  configurations: SlotConfiguration[];
}

export interface CreateSlotConfigurationPayload {
  sessionId: string;
  dishId: string;
  laneCode: string;
  capacity: number;
  robotArmId: string | null;
}

export interface UpdateSlotConfigurationPayload {
  dishId: string;
  laneCode: string;
  capacity: number;
  robotArmId: string | null;
}

export interface DeleteSlotConfigurationResponse {
  id: string;
  laneCode: string;
}
