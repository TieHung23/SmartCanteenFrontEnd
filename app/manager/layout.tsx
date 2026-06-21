"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const MANAGER_MENU = [
  { name: "Dashboard", path: "/manager", icon: "📊" },
  { name: "Serving Sessions", path: "/manager/sessions", icon: "📅" },
  { name: "Menu Settings", path: "/manager/menu", icon: "🥘" },
  { name: "Categories", path: "/manager/categories", icon: "📂" },
  { name: "Manage Users", path: "/manager/users", icon: "👥" },
  { name: "Identity Verify", path: "/manager/verify", icon: "✅" },
  { name: "Refunds", path: "/manager/refunds", icon: "💸" },
  { name: "Robot Slots", path: "/manager/robot", icon: "🤖" },
  { name: "Sales Reports", path: "/manager/reports", icon: "📈" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) =>
    path === "/manager" ? pathname === "/manager" : pathname.startsWith(path);

  const getAvatar = (url: string | null | undefined, id: string) =>
    url && url.trim() !== ""
      ? url
      : `https://api.dicebear.com/9.x/adventurer/svg?seed=${id || "default"}`;

  return (
    <div className="min-h-screen bg-[#ffefe7] flex">
      {/* Left sidebar */}
      <aside className="w-64 shrink-0 flex flex-col p-4">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col flex-1 p-4">
          {/* Dynamic Island pill */}
          <div className="pb-4 flex justify-center">
            <Link
              href="/manager"
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-full"
            >
              <Image
                src="/logo.png"
                alt="Smart Canteen"
                width={28}
                height={28}
                className="w-7 h-7 object-contain rounded-full"
              />
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
                Smart <span className="text-[#E86A33]">Manager</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {MANAGER_MENU.map((menu) => (
              <Link key={menu.path} href={menu.path}>
                <span
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(menu.path)
                      ? "bg-[#D35400] text-white shadow-sm"
                      : "text-gray-500 hover:bg-orange-50 hover:text-[#E86A33]",
                  )}
                >
                  <span className="text-lg">{menu.icon}</span>
                  {menu.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* User avatar at bottom */}
          {user && (
            <div className="relative pt-2 mt-2 border-t border-gray-100" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-orange-50 transition-all"
              >
                <Image
                  src={getAvatar(user.imgUrl, user.id)}
                  alt={user.name || ""}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-9 h-9 rounded-full object-cover border-2 border-transparent hover:border-[#E86A33] transition-all bg-white shadow-sm"
                />
                <span className="text-sm font-medium text-gray-700 truncate">{user.name}</span>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden py-1">
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                  >
                    Edit Profile
                  </Link>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={logout}
                    className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
