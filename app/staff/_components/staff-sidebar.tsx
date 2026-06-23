"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  User,
  LogOut,
  ChevronRight,
  ChefHat,
  Package,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/stores/use-user";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { label: "Serving Orders", href: "/staff/live-orders", icon: ChefHat },
  { label: "Sessions", href: "/staff/sessions", icon: CalendarDays },
  { label: "Orders", href: "/staff/orders", icon: ClipboardList },
  { label: "Stock", href: "/staff/stock", icon: Package },
  { label: "Profile", href: "/staff/profile", icon: User },
];

interface StaffSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function StaffSidebar({ sidebarOpen, setSidebarOpen }: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, fetchProfile } = useUser();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  const displayName = profile?.name || "Staff Admin";
  const displayEmail = profile?.email || "staff@canteen.vn";
  const avatarUrl = profile?.imgUrl || null;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 w-[300px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-transform duration-300 lg:sticky lg:h-screen lg:w-[350px] lg:translate-x-0 p-6 shadow-sm justify-between",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="space-y-8 flex flex-col flex-1 overflow-hidden relative">
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── LOGO BRAND ── */}
        <div className="px-2 py-1 flex items-center gap-4 shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
            <Image src="/logo.png" alt="Logo" width={56} height={48} className="object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              Smart <span className="text-[#D35400]">Canteen</span>
            </h2>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mt-0.5">
              Staff Portal
            </p>
          </div>
        </div>

        {/* ── NAVIGATION MENU ── */}
        <nav className="space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] px-4 mb-4">
            Menu
          </p>
          <ul className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 group hover:translate-x-1.5",
                      isActive
                        ? "bg-gray-50 text-[#D35400] border border-gray-200 shadow-xs"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/80",
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
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
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#D35400]/10 border border-[#D35400]/20 flex items-center justify-center shrink-0 shadow-xs">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[#D35400] font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
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
}
