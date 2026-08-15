export type TrayStatus = "Available" | "Reserved" | "InUse";

export interface Tray {
  id: string;
  code: string;
  status: TrayStatus;
  currentOrderId: string | null;
  updatedAtUtc: string | null;
}

export interface TrayDetail extends Tray {
  createdAtUtc?: string | null;
  slotCode?: string | null;
  slotId?: string | null;
  orderCode?: string | null;
  orderStatus?: string | null;
  customerName?: string | null;
  note?: string | null;
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

export interface ForceReleaseTrayResponse {
  id: string;
  code: string;
  status: TrayStatus;
}

export interface RetireTrayResponse {
  id: string;
  code: string;
}
