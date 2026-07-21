export interface SlotConfiguration {
  id: string;
  sessionId: string;
  dishId: string;
  laneCode: string;
  capacity: number;
  robotArmId: string | null;
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
