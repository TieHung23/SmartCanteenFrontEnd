import { changeProposalService } from "@/services/change-proposal.service";
import { refundService } from "@/services/refund.service";
import { orderService } from "@/services/order.service";
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

  const formatOrderRoute = (orderId: string) => {
    if (role === "Staff") return `/staff/orders/${orderId}`;
    if (role === "Manager") return `/manager/orders/${orderId}`;
    return `/orders/${orderId}`;
  };

  const safeFetchOrder = async (id: string) => {
    if (!id) return null;
    try {
      if (role === "Manager") {
        return await orderService.getManagerOrderById(id);
      }
      return await orderService.getOrderById(id);
    } catch {
      return null;
    }
  };

  // 1. If actionUrl is provided
  if (actionUrl && actionUrl.startsWith("/")) {
    const orderMatch = actionUrl.match(/\/orders\/([a-zA-Z0-9-]+)/);
    if (orderMatch && orderMatch[1]) {
      return formatOrderRoute(orderMatch[1]);
    }

    const validStaticRoutes = [
      "/notifications",
      "/change-proposals",
      "/refunds",
      "/refund",
      "/wallet/transactions",
      "/verification",
      "/manager/verify",
      "/orders",
      "/session",
      "/menu",
      "/checkout",
    ];

    if (
      validStaticRoutes.includes(actionUrl) ||
      actionUrl.startsWith("/refund?") ||
      actionUrl.startsWith("/orders?")
    ) {
      return actionUrl;
    }
  }

  // 2. Direct Order check: If refId is a valid Order ID, ALWAYS go to Order Detail page!
  if (refId) {
    const directOrder = await safeFetchOrder(refId);
    if (directOrder?.id) {
      return formatOrderRoute(directOrder.id);
    }
  }

  // 3. Verification / Identity notifications
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

  // 4. ChangeProposal notifications
  if (refType.includes("changeproposal") || notifType.includes("changeproposal")) {
    if (refId) {
      try {
        const proposal = await changeProposalService.getById(refId);
        if (proposal?.orderId) {
          return formatOrderRoute(proposal.orderId);
        }
      } catch (err) {
        console.warn("Could not resolve proposal ID to order ID:", err);
      }
    }
    return "/change-proposals";
  }

  // 5. Refund Request notifications
  if (refType.includes("refund") || notifType.includes("refund")) {
    if (refId) {
      try {
        const refund = await refundService.getRefundDetail(refId);
        if (refund?.orderId) {
          return formatOrderRoute(refund.orderId);
        }
      } catch (err) {
        console.warn("Could not resolve refund ID to order ID:", err);
      }
    }
    return "/refunds";
  }

  // 6. Meal Session notifications (e.g. ca ăn bị hủy, phiên ăn)
  if (
    refType.includes("session") ||
    notifType.includes("session") ||
    title.includes("ca ăn") ||
    message.includes("ca ăn") ||
    title.includes("phiên ăn") ||
    message.includes("phiên ăn")
  ) {
    if (refId) {
      try {
        const myOrders = await orderService.getMyOrders({ sessionId: refId, pageSize: 1 });
        if (myOrders.items && myOrders.items.length > 0) {
          return formatOrderRoute(myOrders.items[0].id);
        }
        const list = await orderService.getMyOrders({ pageSize: 50 });
        const matched = list.items?.find((o) => o.sessionId === refId);
        if (matched) {
          return formatOrderRoute(matched.id);
        }
      } catch (err) {
        console.warn("Could not find order for session ID:", err);
      }
    }

    if (title.includes("hoàn") || message.includes("hoàn") || message.includes("ví")) {
      return role === "Manager" ? "/manager/orders" : "/wallet/transactions";
    }

    return role === "Staff" ? "/staff/orders" : role === "Manager" ? "/manager/orders" : "/orders";
  }

  // 7. Explicit Wallet Topup / Withdrawal notifications (without specific order)
  if (
    refType.includes("wallet") ||
    notifType.includes("wallet") ||
    refType.includes("transaction") ||
    notifType.includes("transaction") ||
    title.includes("nạp tiền") ||
    title.includes("rút tiền")
  ) {
    if (role !== "Manager" && role !== "Staff") {
      return "/wallet/transactions";
    }
  }

  // 8. Default fallback
  if (refId) {
    try {
      const list = await orderService.getMyOrders({ pageSize: 50 });
      const matched = list.items?.find((o) => o.sessionId === refId || o.id === refId);
      if (matched) return formatOrderRoute(matched.id);
    } catch {
      // Ignore
    }
  }

  return role === "Manager" ? "/manager/orders" : role === "Staff" ? "/staff/orders" : "/orders";
}
