"use client";

import { memo } from "react";
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
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const StaffSidebar = memo(function StaffSidebar({
  sidebarOpen,
  setSidebarOpen,
}: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();

  const handleLogout = () => {
    clearAuthTokens();
    router.push("/login");
  };

  const displayName = profile?.name || "Nhân Viên";
  const displayEmail = profile?.email || "staff@canteen.vn";
  const avatarUrl = getSafeUserAvatar(profile?.imgUrl, profile?.id || profile?.name);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 w-[300px] sm:w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out p-6 shadow-2xl justify-between",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="space-y-6 flex flex-col flex-1 overflow-hidden relative">
        {/* Header Drawer */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
              <Image src="/logo.png" alt="Logo" width={40} height={35} className="object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-tight">
                Smart <span className="text-[#D35400]">Canteen</span>
              </h2>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                Cổng Nhân Viên
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── NAVIGATION MENU ── */}
        <nav className="space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] px-3 mb-3">
            Danh Mục Quản Lý
          </p>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/staff" ? pathname === "/staff" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group hover:translate-x-1.5",
                      isActive
                        ? "bg-[#D35400]/10 text-[#D35400] border border-[#D35400]/20 shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <item.icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          isActive ? "text-[#D35400]" : "text-gray-400 group-hover:text-gray-600",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#D35400] shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-gray-100 pt-5 bg-white shrink-0">
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100/50">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-xs">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-base font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-sm font-medium text-gray-400 truncate">{displayEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all shrink-0"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
});
