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

/* ── Admin / Manager ── */
export interface AdminVerificationListItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  submittedAt: string;
  documentCount: number;
}

export interface VerificationDocument {
  id: string;
  documentType: number;
  cloudinaryUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface AdminVerificationDetail {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  studentId: string | null;
  majorOrClass: string | null;
  dateOfBirth: string | null;
  status: number;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  expiresAt: string;
  documents: VerificationDocument[];
}
