export type PickupSlotStatus = "Empty" | "Occupied";

export interface PickupSlot {
  id: string;
  code: string;
  status: PickupSlotStatus;
  orderId: string | null;
  trayId: string | null;
  updatedAtUtc: string | null;
}

export interface PickupSlotSummary {
  empty: number;
  occupied: number;
  slots: PickupSlot[];
}

export interface CreatePickupSlotSinglePayload {
  code: string;
}

export interface CreatePickupSlotBulkPayload {
  prefix: string;
  from: number;
  to: number;
}

export interface CreatePickupSlotResponse {
  createdCodes: string[];
  skippedCodes: string[];
}
