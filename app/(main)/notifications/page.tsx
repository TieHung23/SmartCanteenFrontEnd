"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  ChevronRight as ArrowRightIcon,
  RotateCcw,
} from "lucide-react";
import { notificationService } from "@/services/notification.service";
import type { NotificationItem } from "@/types/notification.types";
import { resolveNotificationTargetUrl } from "@/lib/utils/notification-resolver";
import Navbar from "@/components/layout/Navbar";
import { getAccessToken } from "@/lib/auth-token-storage";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

function timeAgo(utc: string): string {
  const diff = Date.now() - new Date(utc).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vài giây trước";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function getNotificationCategory(n: NotificationItem): {
  icon: typeof Bell;
  badgeBg: string;
  categoryLabel: string;
  categoryType: "orders" | "refunds" | "verify" | "system";
} {
  const refType = (n.referenceType || "").toLowerCase();
  const notifType = (n.type || "").toLowerCase();
  const title = (n.title || "").toLowerCase();
  const message = (n.message || "").toLowerCase();

  if (
    refType.includes("verification") ||
    notifType.includes("verification") ||
    title.includes("xác minh") ||
    title.includes("xác thực") ||
    message.includes("xác thực")
  ) {
    return {
      icon: ShieldCheck,
      badgeBg: "bg-purple-50 text-purple-600 border-purple-200/60",
      categoryLabel: "Xác minh",
      categoryType: "verify",
    };
  }

  if (
    refType.includes("refund") ||
    notifType.includes("refund") ||
    title.includes("hoàn tiền") ||
    message.includes("hoàn tiền") ||
    message.includes("ví")
  ) {
    return {
      icon: RotateCcw,
      badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
      categoryLabel: "Ví & Hoàn tiền",
      categoryType: "refunds",
    };
  }

  if (
    refType.includes("order") ||
    notifType.includes("order") ||
    title.includes("đơn hàng") ||
    message.includes("đơn hàng") ||
    message.includes("ca")
  ) {
    return {
      icon: ShoppingBag,
      badgeBg: "bg-orange-50 text-orange-600 border-orange-200/60",
      categoryLabel: "Đơn hàng",
      categoryType: "orders",
    };
  }

  return {
    icon: Bell,
    badgeBg: "bg-slate-100 text-slate-600 border-slate-200/60",
    categoryLabel: "Hệ thống",
    categoryType: "system",
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "orders" | "refunds" | "verify">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }

    let isMounted = true;
    notificationService
      .getList({ pageNumber: 1, pageSize: 100 })
      .then((data: unknown) => {
        if (isMounted) {
          const list = Array.isArray(data)
            ? data
            : (data as { items?: NotificationItem[] })?.items || [];
          setNotifications(list as NotificationItem[]);
        }
      })
      .catch((err: unknown) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    if (filter === "unread") {
      result = result.filter((n) => !n.isRead);
    } else if (filter === "orders") {
      result = result.filter((n) => getNotificationCategory(n).categoryType === "orders");
    } else if (filter === "refunds") {
      result = result.filter((n) => getNotificationCategory(n).categoryType === "refunds");
    } else if (filter === "verify") {
      result = result.filter((n) => getNotificationCategory(n).categoryType === "verify");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [notifications, filter, searchQuery]);

  const totalPages = Math.ceil(filteredNotifications.length / pageSize) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, page, pageSize]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      handleMarkRead(n.id);
    }
    const targetUrl = await resolveNotificationTargetUrl(n);
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#D35400] transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            {/* Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    Trung tâm Thông báo
                  </h1>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-xs font-extrabold shadow-xs">
                      <Sparkles className="w-3 h-3" /> {unreadCount} mới
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 pl-0.5">
                  Cập nhật thời gian thực về đơn hàng, hoàn tiền và hoạt động Canteen
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D35400] hover:bg-[#b04600] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Đánh dấu đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "unread", label: `Chưa đọc (${unreadCount})` },
                  { id: "orders", label: "Đơn hàng" },
                  { id: "refunds", label: "Hoàn tiền" },
                  { id: "verify", label: "Xác minh" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFilter(tab.id as typeof filter);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filter === tab.id
                        ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                        : "bg-slate-100/90 text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-64 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200/90 focus:bg-white focus:border-orange-500 px-3.5 pl-9 py-2 rounded-xl text-xs font-medium text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            {/* Notifications List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
                <p className="text-xs font-semibold">Đang tải thông báo...</p>
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div className="text-center py-24 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-bold text-slate-800">Không có thông báo nào</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Bạn hiện không có thông báo nào thuộc danh mục này.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedNotifications.map((n) => {
                  const cat = getNotificationCategory(n);
                  const CatIcon = cat.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 group",
                        n.isRead
                          ? "bg-white border-slate-100 hover:border-orange-200 hover:bg-orange-50/20"
                          : "bg-orange-50/50 border-orange-200/80 hover:bg-orange-50 shadow-2xs",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs",
                          cat.badgeBg,
                        )}
                      >
                        <CatIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(n.createdAtUtc)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {n.message}
                        </p>
                      </div>

                      <div className="self-center text-slate-300 group-hover:text-orange-500 transition-colors">
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6 text-xs">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Trang trước
                </button>

                <span className="font-bold text-slate-500">
                  Trang {page} / {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trang sau <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
