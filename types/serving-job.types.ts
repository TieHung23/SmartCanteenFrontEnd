export type ServingJobStatus =
  | "Queued"
  | "Pushed"
  | "Assembling"
  | "OnShelf"
  | "Collected"
  | "Failed"
  | "Cancelled";

export interface ServingJob {
  jobId: string;
  orderId: string;
  status: ServingJobStatus;
  trayId: string | null;
  trayCode: string | null;
  pickupSlotId: string | null;
  failureReason: string | null;
  createdAtUtc: string;
  pushedAtUtc: string | null;
  acknowledgedAtUtc: string | null;
  completedAtUtc: string | null;
}

export type ServingJobEventType =
  | "Connected"
  | "Disconnected"
  | "JobReceived"
  | "PickStarted"
  | "PickCompleted"
  | "PlaceCompleted"
  | "Error"
  | "Recovered"
  | "EmergencyStop";

export interface ServingJobEvent {
  servingJobId?: string | null;
  eventType: ServingJobEventType;
  dishId: string | null;
  dishName: string | null;
  robotArmId: string | null;
  station: string | null;
  message: string | null;
  occurredAtUtc: string;
}

export interface ServingJobListResponse {
  total: number;
  jobs: ServingJob[];
}

export interface ServingJobEventsResponse {
  jobId: string;
  orderId: string;
  total: number;
  events: ServingJobEvent[];
}

export interface ServingJobActionResponse {
  jobId: string;
  orderId: string;
  status: ServingJobStatus;
}

export interface ManualCompleteServingJobPayload {
  note?: string | null;
}
