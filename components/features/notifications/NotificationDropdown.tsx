"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationService } from "@/services/notification.service";
import { NotificationItem } from "@/types/notification.types";
import { Bell, CheckCheck, X, Clock, ExternalLink } from "lucide-react";

function timeAgo(utc: string): string {
  const diff = Date.now() - new Date(utc).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vài giây trước";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

interface Props {
  onClose: () => void;
  onRegisterListener?: (cb: (n: NotificationItem) => void) => () => void;
}

export default function NotificationDropdown({ onClose, onRegisterListener }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    notificationService
      .getList({ pageSize: 20 })
      .then((res) => {
        setNotifications(res.items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!onRegisterListener) return;
    return onRegisterListener((n: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev];
      });
    });
  }, [onRegisterListener]);

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) handleMarkRead(n.id);
    if (!n.referenceId) return;
    onClose();
    if (
      n.referenceType === "Order" ||
      n.referenceType === "ChangeProposal" ||
      n.referenceType === "Refund"
    ) {
      router.push(`/orders/${n.referenceId}`);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[80vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#E86A33]" />
          <h3 className="text-base font-bold text-gray-800">Thông báo</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#E86A33] hover:bg-orange-50 transition-all"
            title="Đánh dấu đã đọc"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đã đọc
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View All */}
      <Link
        href="/notifications"
        onClick={onClose}
        className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-[#E86A33] hover:bg-orange-50 border-b border-gray-100 transition-all"
      >
        <ExternalLink className="w-4 h-4" />
        Xem tất cả thông báo
      </Link>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-[#E86A33] rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-400">Đang tải...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Không có thông báo</div>
        ) : (
          <div>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left p-5 border-b border-gray-100 hover:bg-gray-50 transition-all ${
                  !n.isRead
                    ? "bg-orange-50/40 border-l-[3px] border-l-[#E86A33]"
                    : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${!n.isRead ? "bg-[#E86A33]" : "bg-transparent"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`${!n.isRead ? "text-base font-bold" : "text-sm font-medium"} text-gray-800 truncate`}
                    >
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                      <Clock className="w-3.5 h-3.5" /> {timeAgo(n.createdAtUtc)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
