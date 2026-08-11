import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const API_MESSAGE_MAP: Record<string, string> = {
  "Session time overlaps with another session.":
    "Thời gian ca ăn trùng với ca phục vụ khác. Vui lòng chọn thời gian khác.",
  "AvailableFrom must be before AvailableTo.":
    "Thời gian bắt đầu ca ăn phải trước thời gian kết thúc.",
  "AvailableForOrder must be before or equal to AvailableFrom.":
    "Thời gian mở đặt phải trước hoặc bằng thời gian bắt đầu ca ăn.",
  "FinalizationDeadline must be in the future.": "Hạn chốt đơn món ăn phải ở thời điểm tương lai.",
  "Session cannot be updated after ordering has opened.":
    "Không thể cập nhật ca phục vụ sau khi đã mở đặt món.",
  "Optional item must be swapped with a dish from the same category.":
    "Món phụ phải được đổi lấy một món ăn cùng danh mục.",
  "This order already has a pending or approved refund request.":
    "Đơn hàng này đã có yêu cầu hoàn tiền đang chờ xử lý hoặc đã được duyệt.",
  "Cannot accept proposal in status OrderRefundRequested.":
    "Không thể đổi món do đề xuất này đã gửi yêu cầu hủy đơn.",
  "Cannot accept proposal in status Accepted.": "Đề xuất đổi món này đã được chấp nhận trước đó.",
  "Cannot accept proposal in status RefundRequested.":
    "Không thể đổi món do đề xuất này đã gửi yêu cầu hoàn tiền món.",
  "Order is no longer available for change proposal actions.":
    "Đơn hàng này không còn hiệu lực để đổi món (trạng thái đơn hàng đang là Đã hủy).",
};

export function translateApiMessage(message: string): string {
  if (API_MESSAGE_MAP[message]) return API_MESSAGE_MAP[message];
  if (message.startsWith("Cannot accept proposal in status")) {
    return "Không thể đổi món do đề xuất này đã được xử lý hoặc đã gửi yêu cầu hoàn tiền.";
  }
  return message;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSessionActive(availableFrom: string, availableTo: string): boolean {
  const now = new Date();
  return new Date(availableFrom) <= now && now <= new Date(availableTo);
}

export function isSessionExpired(availableTo: string): boolean {
  return new Date(availableTo) < new Date();
}

export function isSessionUpcoming(availableFrom: string): boolean {
  return new Date(availableFrom) > new Date();
}

export function getSafeUserAvatar(url?: string | null, identifier?: string | null): string {
  if (url && url.trim() !== "") {
    if (url.startsWith("/")) return url;
    try {
      new URL(url);
      return url;
    } catch {
      // invalid URL string, fall back to seed
    }
  }
  const seed = identifier && identifier.trim() !== "" ? identifier.trim() : "default";
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
}
