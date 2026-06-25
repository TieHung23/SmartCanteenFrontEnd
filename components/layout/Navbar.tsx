"use client";
import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, ShoppingCart, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { notificationService } from "@/services/notification.service";
import NotificationDropdown from "@/components/features/notifications/NotificationDropdown";
import { getAccessToken } from "@/lib/auth-token-storage";

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
    { name: "Home", href: "/" },
    { name: "Session", href: "/session" },
    { name: "About Us", href: "/about" },
  ];
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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
    <header className="w-full px-6 py-4 bg-[#ffefe7]">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white border border-gray-100 rounded-full shadow-sm px-6 h-16 gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Smart Canteen Logo"
            width={55}
            height={55}
            className="w-auto h-55 object-contain rounded-full pb-2"
            priority
          />
          <span className="text-base font-semibold text-gray-800 tracking-tight hidden sm:block">
            Smart <span className="text-[#E86A33]">Canteen</span>
          </span>
        </Link>

        {/* Divider */}
        <div className="h-7 w-px bg-gray-200 shrink-0" />

        {/* Nav */}
        <nav className="flex flex-1 items-center justify-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-500 hover:text-[#E86A33] hover:bg-orange-50 px-4 py-2 rounded-full transition-all whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-7 w-px bg-gray-200 shrink-0" />

        {/* Icons */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-[#E86A33] hover:bg-orange-50 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>
          <button
            onClick={openCart}
            className="relative p-2.5 rounded-xl hover:bg-orange-50 text-gray-600 hover:text-[#D35400] transition-all group active:scale-95"
          >
            <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-105" />

            {mounted && totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D35400] text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounceIn">
                {totalCount}
              </span>
            )}
          </button>
        </div>

        {/* User */}
        <div
          className="flex items-center gap-3 pl-4 border-l border-gray-200 relative"
          ref={dropdownRef}
        >
          {isAuthenticated && userData ? (
            <>
              <span className="text-sm font-bold text-gray-700 hidden sm:block">
                Hi, {userData.name}
              </span>
              <Image
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                src={getSafeAvatar(userData.imgUrl, userData.id)}
                alt={userData.name || "User avatar"}
                width={40}
                height={40}
                unoptimized
                className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-[#E86A33] cursor-pointer transition-all bg-white shadow-sm"
              />

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <Link
                    href="/profile"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    My Orders
                  </Link>
                  <div className="border-t border-gray-100" />
                  <button
                    className="w-full flex items-center gap-2 text-left px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-[#E86A33] border-2 border-[#E86A33] hover:bg-[#E86A33] hover:text-white px-5 py-2 rounded-full transition-all"
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
