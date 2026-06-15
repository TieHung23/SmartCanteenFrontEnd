export type VerificationDocumentType = 1 | 2 | 3;

export type VerificationStatusType = 0 | 1 | 2 | 3;

export const DOCUMENT_TYPE_LABEL: Record<VerificationDocumentType, string> = {
  1: "Student Card",
  2: "Transcript",
  3: "Other",
};

export const STATUS_LABEL: Record<VerificationStatusType, string> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
  3: "Expired",
};

export interface VerificationMeResponse {
  requestId: string;
  status: VerificationStatusType;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationSubmitResponse {
  requestId: string;
}
