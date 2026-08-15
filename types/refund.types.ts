export interface RefundPolicy {
  id: string;
  code: string;
  name: string;
  description?: string;
  refundPercent: number;
  isActive: boolean;
}

export interface CreateRefundRequestPayload {
  orderId: string;
  policyCode: string;
  description: string;
  images: File[];
}

export interface RefundRequest {
  id: string;
  orderId: string;
  policyCode: string;
  policyName?: string;
  description?: string;
  status: string | number; // "Pending" | "Approved" | "Rejected" or 1 | 2 | 3
  createdAtUtc: string;
  refundAmount?: number;
  rejectionReason?: string;
  changeProposalId?: string | null;
  images?: string[];
}

export interface CustomerRefundListItem {
  id: string;
  orderId: string;
  policyCode?: string;
  policyName?: string;
  description?: string;
  status: string | number;
  refundAmount?: number;
  refundPercent?: number;
  orderAmount?: number;
  dishName?: string;
  currentDishName?: string;
  selectedDishName?: string;
  createdAtUtc: string;
  reviewedAtUtc?: string | null;
}

export interface RefundImage {
  id?: string;
  imageUrl?: string;
  fileName?: string;
}

export interface CustomerRefundDetail {
  id: string;
  orderId: string;
  policyCode?: string;
  policyName?: string;
  description?: string;
  status: string | number;
  refundAmount?: number;
  refundPercent?: number;
  orderAmount?: number;
  dishName?: string;
  currentDishName?: string;
  selectedDishName?: string;
  suggestedDishName?: string;
  images?: (RefundImage | string)[];
  reviewedBy?: string | null;
  reviewedAtUtc?: string | null;
  rejectionReason?: string | null;
  walletTransactionId?: string | null;
  createdAtUtc: string;
}

export interface ManagerRefundListItem {
  id: string;
  orderId: string;
  userId?: string;
  userName?: string;
  policyCode?: string;
  policyName?: string;
  description?: string;
  status: string | number;
  refundAmount?: number;
  refundPercent?: number;
  orderAmount?: number;
  dishName?: string;
  currentDishName?: string;
  selectedDishName?: string;
  changeProposalId?: string | null;
  createdAtUtc: string;
}

export interface ManagerRefundDetail extends CustomerRefundDetail {
  userId?: string;
  userName?: string;
  userEmail?: string;
  changeProposalId?: string | null;
}

export type RefundStatus = 1 | 2 | 3;

export const REFUND_STATUS_META: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Đang xử lý", color: "#D35400", bg: "#FFF5ED" },
  2: { label: "Đã duyệt", color: "#10B981", bg: "#ECFDF5" },
  3: { label: "Từ chối", color: "#EF4444", bg: "#FEF2F2" },
};

const STATUS_STRING_TO_NUM: Record<string, number> = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
};

export function normalizeRefundStatus(status: unknown): number {
  if (typeof status === "number") {
    if (status === 0 || status === 1) return 1; // Pending
    if (status === 2) return 2; // Approved
    if (status === 3) return 3; // Rejected
    return 1;
  }
  if (typeof status === "string") {
    const s = status.trim();
    if (STATUS_STRING_TO_NUM[s] !== undefined) {
      return STATUS_STRING_TO_NUM[s];
    }
    const lower = s.toLowerCase();
    if (lower === "pending" || lower === "0" || lower === "1") return 1;
    if (lower === "approved" || lower === "2") return 2;
    if (lower === "rejected" || lower === "3") return 3;
  }
  return 1;
}
