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

/* ── Manager ── */
export interface ManagerRefundListItem {
  id: string;
  orderId: string;
  userId: string;
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
