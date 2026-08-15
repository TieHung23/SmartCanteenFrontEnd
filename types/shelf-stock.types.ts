export interface ShelfStock {
  id: string;
  sessionId: string;
  dishId: string;
  dishName?: string;
  laneCode: string;
  quantity: number;
  slotConfigurationId: string | null;
}

export interface ShelfStockDetail extends ShelfStock {
  sessionName: string;
  dishName: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ShelfStockListResponse {
  stocks: ShelfStock[];
}

export interface CreateShelfStockPayload {
  sessionId: string;
  dishId: string;
  quantity: number;
  slotConfigurationId?: string | null;
  laneCode?: string;
}

export interface UpdateShelfStockPayload {
  dishId: string;
  laneCode: string;
  quantity: number;
  robotArmId: string | null;
}

export interface RefillShelfStockPayload {
  quantity: number;
}

export interface RefillShelfStockResponse {
  id: string;
  dishId: string;
  quantityAfter: number;
}
