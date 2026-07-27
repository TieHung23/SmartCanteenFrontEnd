import { changeProposalService } from "@/services/change-proposal.service";
import { refundService } from "@/services/refund.service";
import type { NotificationItem } from "@/types/notification.types";

/**
 * Resolves the destination URL for a given notification item.
 * Handles cases where referenceId is an orderId, proposalId, or refundId.
 */
export async function resolveNotificationTargetUrl(n: NotificationItem): Promise<string> {
  if (!n.referenceId) return "/notifications";

  const refId = n.referenceId.trim();
  const refType = (n.referenceType || "").toLowerCase();
  const notifType = (n.type || "").toLowerCase();

  // ChangeProposal notifications
  if (refType.includes("changeproposal") || notifType.includes("changeproposal")) {
    try {
      const proposal = await changeProposalService.getById(refId);
      if (proposal?.orderId) {
        return `/orders/${proposal.orderId}`;
      }
    } catch (err) {
      console.warn("Could not resolve proposal ID to order ID, falling back to referenceId:", err);
    }
    return `/orders/${refId}`;
  }

  // Refund notifications
  if (refType.includes("refund") || notifType.includes("refund")) {
    try {
      const refund = await refundService.getRefundDetail(refId);
      if (refund?.orderId) {
        return `/orders/${refund.orderId}`;
      }
    } catch (err) {
      console.warn("Could not resolve refund ID to order ID, falling back to referenceId:", err);
    }
    return `/orders/${refId}`;
  }

  // Default for Order or any other referenceType
  return `/orders/${refId}`;
}
