export type VerificationDocumentType = 1 | 2 | 3;

export type VerificationStatusType = 0 | 1 | 2 | 3 | 4;

export const DOCUMENT_TYPE_LABEL: Record<VerificationDocumentType, string> = {
  1: "Thẻ sinh viên",
  2: "Bảng điểm",
  3: "Khác",
};

export const STATUS_LABEL: Record<VerificationStatusType, string> = {
  0: "Chưa nộp",
  1: "Đang chờ duyệt",
  2: "Đã duyệt",
  3: "Bị từ chối",
  4: "Hết hạn",
};

export interface VerificationMeResponse {
  requestId: string;
  status: VerificationStatusType;
  rejectReason?: string;
  rejectionReason?: string | null;
  createdAt: string;
  submittedAt?: string | null;
  updatedAt: string;
  reviewedAt?: string | null;
  hasOpenRequest?: boolean;
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
  status?: number;
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
