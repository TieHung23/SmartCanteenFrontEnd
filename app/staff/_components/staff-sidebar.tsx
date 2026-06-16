"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation"; // Sử dụng duy nhất next/navigation chuẩn
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { label: "Sessions Management", href: "/staff/sessions", icon: CalendarDays },
  { label: "Order Management", href: "/staff/orders", icon: ClipboardList },
  { label: "Profile", href: "/staff/profile", icon: User },
];

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  return (
    <aside className="w-82 bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0 h-screen justify-between p-6 shadow-xs z-40">
      <div className="space-y-10">
        {/* ── LOGO BRAND TO RÕ (KHỚP MẪU DASHBOARD) ── */}
        <div className="px-3 py-1 flex items-center gap-4">
          <div className="w-15 h-15 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center shadow-2xs">
            <Image src="/logo.png" alt="Logo" width={58} height={50} className="object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
              Smart <span className="text-[#00B69B]">Canteen</span>
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
              Modern Staff Portal
            </p>
          </div>
        </div>

        {/* ── NAVIGATION MENU HIỂN THỊ TO, SANG TRỌNG ── */}
        <nav className="space-y-1.5">
          <p className="text-[20px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">
            Main Menu
          </p>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-2xl text-lg font-semibold transition-all duration-200 group",
                      isActive
                        ? "bg-gray-50 text-[#00B69B] border border-gray-100 shadow-2xs scale-200"
                        : "text-gray-400 hover:text-gray-800 hover:bg-gray-50/80",
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <item.icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          isActive ? "text-[#00B69B]" : "text-gray-400 group-hover:text-gray-600",
                        )}
                      />
                      <span className="truncate tracking-wide">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#00B69B] shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ── FOOTER: THÔNG TIN USER BLOCK TO VÀ ĐẬM NÉT ── */}
      <div className="border-t border-gray-100 pt-5 bg-white shrink-0">
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/50 shadow-3xs">
          <div className="w-11 h-11 rounded-xl bg-[#00B69B]/10 border border-[#00B69B]/20 flex items-center justify-center shrink-0 shadow-2xs">
            <span className="text-[#00B69B] font-black text-sm">S</span>
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-black text-gray-900 truncate">Staff Admin</p>
            <p className="text-xs font-semibold text-gray-400 truncate font-mono">
              staff@canteen.vn
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all shrink-0"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
