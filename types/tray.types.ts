export type TrayStatus = "Available" | "Reserved" | "InUse";

export interface Tray {
  id: string;
  code: string;
  status: TrayStatus;
  currentOrderId: string | null;
  updatedAtUtc: string | null;
}

export interface TrayPoolSummary {
  available: number;
  reserved: number;
  inUse: number;
  trays: Tray[];
}

export interface CreateTraySinglePayload {
  code: string;
}

export interface CreateTrayBulkPayload {
  prefix: string;
  from: number;
  to: number;
}

export interface CreateTrayResponse {
  createdCodes: string[];
  skippedCodes: string[];
}
