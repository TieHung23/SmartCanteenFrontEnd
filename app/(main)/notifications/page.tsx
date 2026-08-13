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
  RefreshCw,
  Wallet,
  ShieldCheck,
  Sparkles,
  ChevronRight as ArrowRightIcon,
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
  badgeText: string;
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
      badgeText: "Xác thực",
      categoryLabel: "Danh tính",
      categoryType: "verify",
    };
  }

  if (
    refType.includes("wallet") ||
    notifType.includes("wallet") ||
    refType.includes("refund") ||
    notifType.includes("refund") ||
    title.includes("hoàn tiền") ||
    title.includes("ví") ||
    title.includes("nạp tiền")
  ) {
    return {
      icon: Wallet,
      badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
      badgeText: "Ví & Hoàn tiền",
      categoryLabel: "Tài chính",
      categoryType: "refunds",
    };
  }

  if (
    refType.includes("changeproposal") ||
    notifType.includes("changeproposal") ||
    title.includes("đổi món") ||
    message.includes("đổi món")
  ) {
    return {
      icon: RefreshCw,
      badgeBg: "bg-blue-50 text-blue-600 border-blue-200/60",
      badgeText: "Đề xuất đổi món",
      categoryLabel: "Thực đơn",
      categoryType: "orders",
    };
  }

  if (
    refType.includes("order") ||
    notifType.includes("order") ||
    title.includes("đơn hàng") ||
    title.includes("chuẩn bị") ||
    title.includes("sẵn sàng")
  ) {
    return {
      icon: ShoppingBag,
      badgeBg: "bg-orange-50 text-[#D35400] border-orange-200/60",
      badgeText: "Đơn hàng",
      categoryLabel: "Đơn hàng",
      categoryType: "orders",
    };
  }

  return {
    icon: Bell,
    badgeBg: "bg-amber-50 text-amber-600 border-amber-200/60",
    badgeText: "Hệ thống",
    categoryLabel: "Thông báo",
    categoryType: "system",
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread" | "orders" | "refunds" | "verify">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 20;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

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
      .catch((err) => {
        console.error("Failed to fetch notifications:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, filter, router]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    if (filter === "orders") {
      result = result.filter((n) => getNotificationCategory(n).categoryType === "orders");
    } else if (filter === "refunds") {
      result = result.filter((n) => getNotificationCategory(n).categoryType === "refunds");
    } else if (filter === "verify") {
      result = result.filter((n) => getNotificationCategory(n).categoryType === "verify");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) => n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [notifications, filter, searchQuery]);

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
    <div className="min-h-screen bg-slate-50/50 pb-16 antialiased font-sans">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200/50 p-6 sm:p-8 shadow-xs mb-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-400/10 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-gray-700 transition-all active:scale-95 shadow-2xs shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    Trung tâm Thông báo
                  </h1>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-xs animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" /> {unreadCount} chưa đọc
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  Cập nhật thời gian thực về đơn hàng, hoàn tiền và hoạt động căng tin của bạn
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D35400] hover:bg-[#b84900] text-white text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
            >
              <CheckCheck className="h-4 w-4" />
              Đánh dấu đọc tất cả
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nội dung thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200/60 rounded-2xl text-xs font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 select-none">
              {[
                { id: "all", label: "Tất cả" },
                { id: "unread", label: "Chưa đọc" },
                { id: "orders", label: "Đơn hàng" },
                { id: "refunds", label: "Ví & Hoàn tiền" },
                { id: "verify", label: "Xác thực" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilter(tab.id as typeof filter);
                    setPage(1);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shrink-0",
                    filter === tab.id
                      ? "bg-gray-900 text-white shadow-xs"
                      : "bg-gray-100/70 text-gray-600 hover:bg-gray-200/60 hover:text-gray-900",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notification List Container */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-200/40 p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#D35400] mx-auto mb-3" />
              <p className="text-xs font-medium text-gray-400">Đang tải thông báo hệ thống...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/40 p-12 text-center shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 text-[#D35400] flex items-center justify-center mx-auto shadow-2xs">
                <Bell className="w-8 h-8 opacity-80" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 tracking-wide">
                  Không có thông báo nào
                </h3>
                <p className="text-xs font-medium text-gray-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? "Không tìm thấy thông báo khớp với từ khóa tìm kiếm của bạn."
                    : "Hiện tại bạn đã cập nhật tất cả thông báo mới nhất từ căng tin!"}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const cat = getNotificationCategory(n);
              const CatIcon = cat.icon;

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "group relative overflow-hidden bg-white rounded-3xl border p-5 sm:p-6 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5",
                    !n.isRead
                      ? "border-orange-200/80 bg-gradient-to-r from-orange-50/40 via-white to-amber-50/15"
                      : "border-gray-200/35 hover:border-gray-300",
                  )}
                >
                  {/* Left Highlight bar for unread */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D35400]" />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Category Icon Badge */}
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                        cat.badgeBg,
                      )}
                    >
                      <CatIcon className="w-5 h-5" />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                              cat.badgeBg,
                            )}
                          >
                            {cat.badgeText}
                          </span>
                          {!n.isRead && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-100/70 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                              Mới
                            </span>
                          )}
                        </div>

                        {/* Relative Timestamp */}
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{timeAgo(n.createdAtUtc)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2
                        className={cn(
                          "text-sm sm:text-base font-semibold leading-snug tracking-tight text-gray-900 group-hover:text-[#D35400] transition-colors truncate",
                          !n.isRead && "font-bold text-gray-900",
                        )}
                      >
                        {n.title}
                      </h2>

                      {/* Message Body */}
                      <p className="text-xs sm:text-sm font-normal text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="self-center shrink-0 ml-2 text-gray-300 group-hover:text-[#D35400] group-hover:translate-x-1 transition-all">
                      <ArrowRightIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between bg-white rounded-2xl border border-gray-200/40 p-4 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500">
              Trang <strong className="text-gray-800 font-bold">{page}</strong> trên tổng số{" "}
              <strong className="text-gray-800 font-bold">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
