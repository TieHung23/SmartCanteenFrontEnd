"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { notificationService } from "@/services/notification.service";
import type { NotificationItem } from "@/types/notification.types";
import { resolveNotificationTargetUrl } from "@/lib/utils/notification-resolver";
import Navbar from "@/components/layout/Navbar";
import { getAccessToken } from "@/lib/auth-token-storage";
import { ROUTES } from "@/config/routes";

function timeAgo(utc: string): string {
  const diff = Date.now() - new Date(utc).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vài giây trước";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const pageSize = 20;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }

    startTransition(() => {
      setLoading(true);
    });

    const params: { pageNumber: number; pageSize: number; isRead?: boolean } = {
      pageNumber: page,
      pageSize,
    };
    if (filter === "unread") params.isRead = false;

    notificationService
      .getList(params)
      .then((res) => {
        setNotifications(res.items || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch(() => {
        console.error("Failed to fetch notifications");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, filter, router]);

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) handleMarkRead(n.id);
    const targetUrl = await resolveNotificationTargetUrl(n);
    if (targetUrl) router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-gray-50 transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
              <p className="text-sm text-gray-500">
                Trang {page}/{totalPages}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-[#E86A33] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => {
                  setFilter("unread");
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === "unread"
                    ? "bg-[#E86A33] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Chưa đọc
              </button>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-[#E86A33] hover:border-[#E86A33] shadow-sm transition-all"
            >
              <CheckCheck className="h-4 w-4" />
              Đọc tất cả
            </button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#E86A33]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <Bell className="mb-3 h-12 w-12" />
              <p className="text-sm">Không có thông báo</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-all ${
                    !n.isRead ? "bg-orange-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-4 px-6 py-5">
                    <div
                      className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                        !n.isRead ? "bg-[#E86A33]" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`${
                          !n.isRead ? "font-bold" : "font-medium"
                        } text-gray-800 truncate`}
                      >
                        {n.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" /> {timeAgo(n.createdAtUtc)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Trước
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Sau <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
