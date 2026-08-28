"use client";

import { useState, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  User,
  LogOut,
  ChevronRight,
  Package,
  X,
} from "lucide-react";
import { cn, getSafeUserAvatar } from "@/lib/utils";
import { useUser } from "@/lib/stores/use-user";
import { clearAuthTokens } from "@/lib/auth-token-storage";

const NAV_ITEMS = [
  { label: "Trung tâm điều hành", href: "/staff", icon: LayoutDashboard },
  { label: "Ca phục vụ", href: "/staff/sessions", icon: CalendarDays },
  { label: "Bind pickup slot", href: "/staff/pickup-slots", icon: Package },
  { label: "Hồ sơ cá nhân", href: "/staff/profile", icon: User },
];

interface StaffSidebarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export const StaffSidebar = memo(function StaffSidebar({
  sidebarOpen = false,
  setSidebarOpen,
}: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = () => {
    clearAuthTokens();
    router.push("/login");
  };

  const displayName = profile?.name || "Nhân Viên";
  const displayEmail = profile?.email || "staff@canteen.vn";
  const avatarUrl = getSafeUserAvatar(profile?.imgUrl, profile?.id || profile?.name);

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed top-4 bottom-4 left-4 z-40 bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl rounded-3xl flex flex-col justify-between transition-all duration-300 ease-in-out overflow-hidden group",
        // Mobile state vs Desktop state
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0",
        // Desktop expansion on hover
        isHovered ? "md:w-72 md:p-5" : "md:w-20 md:p-3",
        sidebarOpen ? "p-5" : "",
      )}
    >
      <div className="flex flex-col flex-1 min-h-0 space-y-6">
        {/* Header Drawer */}
        <div className="flex items-center justify-between h-12 px-1 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={40} height={35} className="object-contain" />
            </div>
            <div
              className={cn(
                "transition-all duration-200 min-w-0 overflow-hidden whitespace-nowrap",
                isHovered || sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden",
              )}
            >
              <h2 className="text-base font-black text-gray-900 leading-tight">
                Smart <span className="text-[#D35400]">Canteen</span>
              </h2>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                Cổng Nhân Viên
              </p>
            </div>
          </div>
          {setSidebarOpen && sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── NAVIGATION MENU ── */}
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div
            className={cn(
              "text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 transition-all duration-200",
              isHovered || sidebarOpen ? "opacity-100 block" : "opacity-0 hidden",
            )}
          >
            Danh Mục Quản Lý
          </div>

          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/staff" ? pathname === "/staff" : pathname.startsWith(item.href);
              const ItemIcon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen && setSidebarOpen(false)}
                    title={!isHovered && !sidebarOpen ? item.label : undefined}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl text-sm font-bold transition-all duration-200 group/link",
                      isActive
                        ? "bg-[#D35400] text-white shadow-lg shadow-orange-500/25"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70",
                      !isHovered && !sidebarOpen ? "justify-center" : "",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ItemIcon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          isActive ? "text-white" : "text-gray-400 group-hover/link:text-gray-700",
                        )}
                      />
                      <span
                        className={cn(
                          "truncate transition-all duration-200",
                          isHovered || sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden",
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                    {isActive && (isHovered || sidebarOpen) && (
                      <ChevronRight className="w-4 h-4 text-white shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-gray-100 pt-3 shrink-0">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-2xl bg-gray-50/90 border border-gray-200/60 transition-all",
            !isHovered && !sidebarOpen ? "justify-center" : "",
          )}
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-xs">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>

          {(isHovered || sidebarOpen) && (
            <div className="flex-1 min-w-0 space-y-0.5 whitespace-nowrap overflow-hidden">
              <p className="text-sm font-black text-gray-900 truncate">{displayName}</p>
              <p className="text-[10px] font-bold text-gray-400 truncate">{displayEmail}</p>
            </div>
          )}

          {(isHovered || sidebarOpen) && (
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-[#D35400] p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all shrink-0 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
});
