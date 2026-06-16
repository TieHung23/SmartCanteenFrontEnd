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

export function StaffSidebar() {
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
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 sticky top-0 h-screen justify-between p-6 shadow-sm z-40">
      <div className="space-y-8">
        {/* ── LOGO BRAND ── */}
        <div className="px-2 py-1 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
            <Image src="/logo.png" alt="Logo" width={56} height={48} className="object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
              Smart <span className="text-[#00B69B]">Canteen</span>
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
                      "flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 group",
                      isActive
                        ? "bg-gray-50 text-[#00B69B] border border-gray-200 shadow-xs"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/80",
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <item.icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          isActive ? "text-[#00B69B]" : "text-gray-400 group-hover:text-gray-600",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#00B69B] shrink-0" />}
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
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#00B69B]/10 border border-[#00B69B]/20 flex items-center justify-center shrink-0 shadow-xs">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[#00B69B] font-extrabold text-lg">
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
