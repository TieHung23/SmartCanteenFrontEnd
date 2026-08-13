"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn, getSafeUserAvatar } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ManagerBackground } from "../manager/_components/manager-background";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  LogOut,
  ChevronRight,
  X,
  type LucideIcon,
} from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-admin",
});

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  icon: LucideIcon;
  items: MenuItem[];
}

const ADMIN_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Quản Trị Hệ Thống",
    icon: ShieldCheck,
    items: [
      { name: "Tổng quan", path: "/admin", icon: LayoutDashboard },
      { name: "Nhật ký API", path: "/admin/logs", icon: FileText },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [pathname]);

  const isLinkActive = useCallback(
    (targetPath: string) => {
      if (targetPath === "/admin") {
        return pathname === "/admin";
      }
      return pathname.startsWith(targetPath);
    },
    [pathname],
  );

  const displayName = user?.name || "Quản Trị Viên";
  const displayEmail = user?.email || "admin@canteen.vn";
  const avatarUrl = getSafeUserAvatar(user?.imgUrl, user?.id || user?.name);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-[#D35400] border-4 border-[#D35400]/20 border-t-[#D35400] rounded-full animate-spin" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div
      className={cn(
        "flex h-screen w-screen overflow-hidden antialiased select-none relative",
        plusJakartaSans.variable,
      )}
      style={{ fontFamily: "var(--font-admin), var(--font-sans), sans-serif" }}
    >
      <ManagerBackground />

      {/* Floating Edge Pull Handle */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={cn(
          "fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-16 bg-gray-900 hover:bg-[#D35400] text-white rounded-r-2xl shadow-2xl hover:w-10 transition-all duration-300 group cursor-pointer border-y border-r border-gray-700/50",
          sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
        title="Nhấn để kéo menu quản trị"
      >
        <ChevronRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in"
        />
      )}

      {/* Slide-over Drawer Sidebar Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[300px] sm:w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out p-6 shadow-2xl justify-between",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="space-y-6 flex flex-col flex-1 overflow-hidden relative">
          {/* Close drawer button */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs bg-gradient-to-br from-amber-500 to-orange-600">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 leading-tight">
                  Smart <span className="text-[#D35400]">Admin</span>
                </h2>
                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Hệ Thống Quản Trị
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

          {/* Navigation menu */}
          <div className="relative flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {ADMIN_MENU_GROUPS.map((group) => {
              const GroupIcon = group.icon;

              return (
                <div key={group.label} className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                    <GroupIcon className="w-4 h-4 text-[#D35400]" />
                    <span>{group.label}</span>
                  </div>

                  <ul className="space-y-1 pl-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isLinkActive(item.path);

                      return (
                        <li key={item.name}>
                          <Link
                            href={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200",
                              active
                                ? "bg-[#D35400] text-white shadow-md shadow-orange-500/20"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <ItemIcon
                                className={cn(
                                  "w-4 h-4 shrink-0",
                                  active ? "text-white" : "text-gray-400",
                                )}
                              />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {active && <ChevronRight className="w-4 h-4 text-white shrink-0" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer profile panel */}
        {user && (
          <div className="border-t border-gray-100 pt-4 bg-white shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/80 border border-gray-100/50">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 text-white flex items-center justify-center shrink-0 shadow-xs border border-gray-200">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs font-medium text-gray-400 truncate">{displayEmail}</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-[#D35400] p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all shrink-0"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main page content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full h-full">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth [&_*]:tracking-[0.02em]">
          {children}
        </main>
      </div>
    </div>
  );
}
