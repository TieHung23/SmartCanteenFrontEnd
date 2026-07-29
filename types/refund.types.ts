export interface RefundPolicy {
  code: string;
  name: string;
  description: string;
  percent: number;
  requiresImage: boolean;
  isActive: boolean;
}

export const REFUND_POLICIES = [
  { code: "wrong_item", label: "Sai món", description: "Món nhận không đúng với món đã đặt" },
  { code: "missing_item", label: "Thiếu món", description: "Đơn hàng thiếu món so với đã đặt" },
  {
    code: "quality_issue",
    label: "Vấn đề chất lượng",
    description: "Món ăn không đảm bảo chất lượng",
  },
  { code: "other", label: "Lý do khác", description: "Vui lòng mô tả chi tiết trong phần ghi chú" },
] as const;

export type RefundPolicyOption = (typeof REFUND_POLICIES)[number];

export interface RefundRequest {
  id: string;
  orderId: string;
  policyCode: string;
  description: string;
  images: string[];
  status: RefundStatus;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export type RefundStatus = 0 | 1 | 2;

export const REFUND_STATUS_META: Record<
  RefundStatus,
  { label: string; color: string; bg: string }
> = {
  0: { label: "Đang xử lý", color: "#f07b2e", bg: "#fff8f4" },
  1: { label: "Đã duyệt", color: "#2db87a", bg: "#e8f8f0" },
  2: { label: "Từ chối", color: "#ef4444", bg: "#fef2f2" },
};

const STATUS_STRING_TO_NUM: Record<string, RefundStatus> = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
};

export function normalizeRefundStatus(status: unknown): RefundStatus {
  if (typeof status === "number") {
    if (status === 0 || status === 1 || status === 2) return status;
    if (status === 3) return 2;
    return 0;
  }
  if (typeof status === "string") {
    const mapped = STATUS_STRING_TO_NUM[status];
    if (mapped !== undefined) return mapped;
    const num = Number(status);
    if (!isNaN(num) && num >= 0 && num <= 2) return num as RefundStatus;
    if (num === 3) return 2;
  }
  return 0;
}

/* ── Manager ── */
export interface ManagerRefundListItem {
  id: string;
  orderId: string;
  userId: string;
  userName?: string;
  studentId?: string | null;
  orderItemId?: string | null;
  changeProposalId?: string | null;
  dishId?: string | null;
  dishName?: string | null;
  currentDishId?: string | null;
  currentDishName?: string | null;
  suggestedDishId?: string | null;
  suggestedDishName?: string | null;
  selectedDishId?: string | null;
  selectedDishName?: string | null;
  policyName: string;
  refundPercent: number;
  orderAmount: number;
  refundAmount: number;
  status: string;
  imageCount: number;
  createdAtUtc: string;
  reviewedAtUtc: string | null;
}

export interface RefundImage {
  id: string;
  imageUrl: string;
  fileName: string;
}

export interface ManagerRefundDetail {
  id: string;
  orderId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  studentId?: string | null;
  orderItemId?: string | null;
  changeProposalId?: string | null;
  dishId?: string | null;
  dishName?: string | null;
  currentDishId?: string | null;
  currentDishName?: string | null;
  suggestedDishId?: string | null;
  suggestedDishName?: string | null;
  selectedDishId?: string | null;
  selectedDishName?: string | null;
  policyCode: string;
  policyName: string;
  refundPercent: number;
  orderAmount: number;
  refundAmount: number;
  description: string;
  status: string;
  images: RefundImage[];
  reviewedBy: string | null;
  reviewedAtUtc: string | null;
  rejectionReason: string | null;
  walletTransactionId: string | null;
  createdAtUtc: string;
}
