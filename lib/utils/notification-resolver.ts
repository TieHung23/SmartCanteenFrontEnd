import { changeProposalService } from "@/services/change-proposal.service";
import { refundService } from "@/services/refund.service";
import type { NotificationItem } from "@/types/notification.types";

/**
 * Resolves the destination URL for a given notification item.
 * Handles actionUrl if available, or falls back to referenceId/referenceType.
 */
export async function resolveNotificationTargetUrl(
  n: NotificationItem,
  role?: string,
): Promise<string> {
  const actionUrl = (n.actionUrl || "").trim();
  const refId = (n.referenceId || "").trim();
  const refType = (n.referenceType || "").toLowerCase();
  const notifType = (n.type || "").toLowerCase();
  const title = (n.title || "").toLowerCase();
  const message = (n.message || "").toLowerCase();

  // 1. If actionUrl is provided and is a valid relative path, use it directly
  if (actionUrl && actionUrl.startsWith("/")) {
    return actionUrl;
  }

  // 2. Verification / Identity notifications
  if (
    refType.includes("verification") ||
    notifType.includes("verification") ||
    refType.includes("identity") ||
    notifType.includes("identity") ||
    title.includes("xác minh") ||
    title.includes("xác thực") ||
    message.includes("xác minh") ||
    message.includes("xác thực") ||
    title.includes("verification")
  ) {
    if (refType.includes("admin") || notifType.includes("admin") || title.includes("admin")) {
      return "/manager/verify";
    }
    return "/verification";
  }

  // 3. Wallet / Transaction notifications
  if (
    refType.includes("wallet") ||
    notifType.includes("wallet") ||
    refType.includes("transaction") ||
    notifType.includes("transaction") ||
    title.includes("ví") ||
    title.includes("nạp tiền") ||
    title.includes("rút tiền")
  ) {
    return "/wallet/transactions";
  }

  if (!refId) return "/notifications";

  // 4. ChangeProposal notifications
  if (refType.includes("changeproposal") || notifType.includes("changeproposal")) {
    try {
      const proposal = await changeProposalService.getById(refId);
      if (proposal?.orderId) {
        return role === "Staff"
          ? `/staff/orders/${proposal.orderId}`
          : `/orders/${proposal.orderId}`;
      }
    } catch (err) {
      console.warn("Could not resolve proposal ID to order ID, falling back to referenceId:", err);
    }
    return role === "Staff" ? `/staff/orders/${refId}` : `/orders/${refId}`;
  }

  // 5. Refund notifications
  if (refType.includes("refund") || notifType.includes("refund")) {
    try {
      const refund = await refundService.getRefundDetail(refId);
      if (refund?.orderId) {
        return role === "Staff" ? `/staff/orders/${refund.orderId}` : `/orders/${refund.orderId}`;
      }
    } catch (err) {
      console.warn("Could not resolve refund ID to order ID, falling back to referenceId:", err);
    }
    return role === "Staff" ? `/staff/orders/${refId}` : `/orders/${refId}`;
  }

  // 6. Default for Order or any other referenceType with referenceId
  if (role === "Staff") {
    return `/staff/orders/${refId}`;
  }
  if (role === "Manager") {
    return `/manager/orders/${refId}`;
  }

  return `/orders/${refId}`;
}
