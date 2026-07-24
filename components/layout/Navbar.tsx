"use client";
import { useState, useRef, useEffect, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, ShoppingCart, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { notificationService } from "@/services/notification.service";
import NotificationDropdown from "@/components/features/notifications/NotificationDropdown";
import { getAccessToken } from "@/lib/auth-token-storage";
import { useSignalr } from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";
import { toast } from "sonner";

export default function Navbar() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { user: userData, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getCartCount, openCart } = useCart();
  const totalCount = getCartCount();

  const navLinks = [
    { name: "Trang chủ", href: "/" },
    { name: "Phiên ăn", href: "/session" },
    { name: "Về chúng tôi", href: "/about" },
  ];
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifListenersRef = useRef<((n: NotificationItem) => void)[]>([]);

  const handleNewNotification = useCallback((n: NotificationItem) => {
    setUnreadCount((prev) => prev + 1);
    notifListenersRef.current.forEach((cb) => cb(n));
    const navigableTypes = [
      "Order.StatusChanged",
      "Order.Created",
      "ChangeProposal.Created",
      "Refund.StatusChanged",
    ];
    const shouldNotify =
      navigableTypes.includes(n.type) ||
      (n.referenceType && ["Order", "ChangeProposal", "Refund"].includes(n.referenceType));
    if (shouldNotify) {
      toast.info(n.title, {
        description: n.message,
        action: n.referenceId
          ? {
              label: "Xem",
              onClick: () => (window.location.href = `/orders/${n.referenceId}`),
            }
          : undefined,
        duration: 8000,
      });
    }
  }, []);

  useSignalr(handleNewNotification);

  const registerNotifListener = useCallback((cb: (n: NotificationItem) => void) => {
    notifListenersRef.current.push(cb);
    return () => {
      notifListenersRef.current = notifListenersRef.current.filter((h) => h !== cb);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const count = await notificationService.getUnreadCount();
          setUnreadCount(count);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSafeAvatar = (url: string | null | undefined, id: string) => {
    if (url && url.trim() !== "") return url;
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${id || "default"}`;
  };
  return (
    <header className="w-full px-3 sm:px-6 py-3 bg-[#ffefe7]">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white border border-gray-100 rounded-full shadow-sm px-3 sm:px-5 h-14 sm:h-16 gap-1 sm:gap-3">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Logo Smart Canteen"
            width={55}
            height={55}
            className="w-auto h-[42px] sm:h-[55px] object-contain rounded-full pb-1 sm:pb-2"
            priority
          />
          <span className="text-sm sm:text-base font-semibold text-gray-800 tracking-tight hidden sm:block">
            Smart <span className="text-[#E86A33]">Canteen</span>
          </span>
        </Link>

        {/* Divider */}
        <div className="h-5 sm:h-7 w-px bg-gray-200 shrink-0 hidden sm:block" />

        {/* Nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 sm:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs lg:text-sm font-medium text-gray-500 hover:text-[#E86A33] hover:bg-orange-50 px-2 lg:px-4 py-1.5 lg:py-2 rounded-full transition-all whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-5 sm:h-7 w-px bg-gray-200 shrink-0 hidden md:block" />

        {/* Icons */}
        <div className="flex items-center gap-0 sm:gap-1 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center justify-center w-9 sm:w-10 h-9 sm:h-10 rounded-full text-gray-500 hover:text-[#E86A33] hover:bg-orange-50 transition-all"
            >
              <Bell className="w-[18px] sm:w-5 h-[18px] sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown
                onClose={() => setShowNotifications(false)}
                onRegisterListener={registerNotifListener}
              />
            )}
          </div>
          <button
            onClick={openCart}
            className="relative p-2 sm:p-2.5 rounded-xl hover:bg-orange-50 text-gray-600 hover:text-[#D35400] transition-all group active:scale-95"
          >
            <ShoppingCart className="w-[18px] sm:w-5 h-[18px] sm:h-5 transition-transform group-hover:scale-105" />

            {mounted && totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D35400] text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounceIn">
                {totalCount}
              </span>
            )}
          </button>
        </div>

        {/* User */}
        <div
          className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 relative"
          ref={dropdownRef}
        >
          {isAuthenticated && userData ? (
            <>
              <span className="text-xs sm:text-sm font-bold text-gray-700 hidden sm:block truncate max-w-[120px] lg:max-w-[200px]">
                Xin chào, {userData.name}
              </span>
              <Image
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                src={getSafeAvatar(userData.imgUrl, userData.id)}
                alt={userData.name || "Ảnh đại diện"}
                width={36}
                height={36}
                unoptimized
                className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover border-2 border-transparent hover:border-[#E86A33] cursor-pointer transition-all bg-white shadow-sm"
              />

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <Link
                    href="/profile"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Hồ sơ
                  </Link>
                  <Link
                    href="/notifications"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Thông báo
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Đơn hàng của tôi
                  </Link>
                  <Link
                    href="/change-proposals"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Đề xuất đổi món
                  </Link>
                  <div className="border-t border-gray-100" />
                  <button
                    className="w-full flex items-center gap-2 text-left px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-[#E86A33] border-2 border-[#E86A33] hover:bg-[#E86A33] hover:text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full transition-all whitespace-nowrap"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounceIn { animation: bounceIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
      `,
        }}
      />
    </header>
  );
}
