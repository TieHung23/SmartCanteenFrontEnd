"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ManagerBackground } from "./_components/manager-background";
import {
  BarChart3,
  CalendarDays,
  ChefHat,
  Layers,
  Users,
  Coins,
  RotateCcw,
  Cpu,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  X,
  Package,
  ShoppingBag,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

import { getSafeUserAvatar } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-manager",
});

interface SubMenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface MenuItem {
  name: string;
  path?: string;
  icon: LucideIcon;
  subItems?: SubMenuItem[];
}

interface MenuGroup {
  label: string;
  icon?: LucideIcon;
  items: MenuItem[];
}

const MANAGER_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Báo cáo",
    icon: BarChart3,
    items: [
      { name: "Báo cáo tổng hợp", path: "/manager", icon: BarChart3 },
      { name: "Báo cáo ca phục vụ", path: "/manager/reports/sessions", icon: TrendingUp },
    ],
  },
  {
    label: "Quản lý",
    icon: Layers,
    items: [
      { name: "Người dùng", path: "/manager/users", icon: Users },
      { name: "Danh mục", path: "/manager/categories", icon: Layers },
      { name: "Món ăn", path: "/manager/menu", icon: ChefHat },
      {
        name: "Hoàn tiền",
        icon: Coins,
        subItems: [
          { name: "Danh sách yêu cầu", path: "/manager/refunds", icon: Coins },
          { name: "Chính sách hoàn tiền", path: "/manager/refund-policies", icon: RotateCcw },
        ],
      },
      { name: "Ca phục vụ", path: "/manager/sessions", icon: CalendarDays },
      { name: "Đơn hàng", path: "/manager/orders", icon: ShoppingBag },
      { name: "Xác thực danh tính", path: "/manager/verify", icon: BadgeCheck },
    ],
  },
  {
    label: "Hệ thống",
    icon: Cpu,
    items: [
      { name: "Khay (Trays)", path: "/manager/trays", icon: Package },
      { name: "Robot", path: "/manager/robot", icon: Cpu },
      { name: "Serving Jobs", path: "/manager/serving-jobs", icon: Cpu },
      { name: "Ô Kệ (Slots)", path: "/manager/pickup-slots", icon: Package },
      { name: "Cài đặt", path: "/manager/settings", icon: Settings },
    ],
  },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Sidebar is hidden by default to maximize main content width and height
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(["Quản lý", "Hệ thống", "Báo cáo"]),
  );
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(
    () => new Set(["Hoàn tiền"]),
  );

  // Auto-close sidebar drawer when navigating
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [pathname]);

  const isLinkActive = useCallback(
    (targetPath: string) => {
      if (targetPath === "/manager") {
        return pathname === "/manager";
      }
      return pathname.startsWith(targetPath);
    },
    [pathname],
  );

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const toggleSubmenu = useCallback((name: string) => {
    setExpandedSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const displayName = user?.name || "Quản Lý";
  const displayEmail = user?.email || "manager@canteen.vn";
  const avatarUrl = getSafeUserAvatar(user?.imgUrl, user?.id || user?.name);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#D35400]/20 border-t-[#D35400] rounded-full animate-spin" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải...</p>
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
      style={{ fontFamily: "var(--font-manager), var(--font-sans), sans-serif" }}
    >
      <ManagerBackground />

      {/* Floating Edge Pull Handle - Cục Popup kéo sát mép màn hình màu Xám */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={cn(
          "fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-16 bg-gray-300 hover:bg-orange-400 text-white rounded-r-2xl shadow-2xl hover:w-10 transition-all duration-300 group cursor-pointer border-y border-r border-gray-600/50",
          sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
        title="Nhấn để kéo menu quản lý"
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
              <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={40}
                  height={35}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 leading-tight">
                  Smart <span className="text-[#E86A33]">Canteen</span>
                </h2>
                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Menu Quản Lý
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

          {/* Navigation menu (Hidden scrollbar) */}
          <div className="relative flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {MANAGER_MENU_GROUPS.map((group) => {
              const isGroupExpanded = expandedGroups.has(group.label);
              const GroupIcon = group.icon || Cpu;

              return (
                <div key={group.label} className="space-y-2">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-black text-gray-800 uppercase tracking-wider bg-gray-50 border border-gray-200/60 rounded-2xl hover:bg-orange-50/50 hover:text-[#D35400] transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className="w-4.5 h-4.5 text-[#D35400]" />
                      <span>{group.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-gray-400 transition-transform duration-200",
                        isGroupExpanded ? "rotate-180" : "",
                      )}
                    />
                  </button>

                  {isGroupExpanded && (
                    <ul className="space-y-1 pl-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;

                        if (item.subItems) {
                          const isSubExpanded = expandedSubmenus.has(item.name);
                          const hasActiveChild = item.subItems.some((s) => isLinkActive(s.path));

                          return (
                            <li key={item.name} className="space-y-1">
                              <button
                                onClick={() => toggleSubmenu(item.name)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200",
                                  hasActiveChild
                                    ? "bg-orange-50/70 text-[#D35400]"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <ItemIcon
                                    className={cn(
                                      "w-4 h-4 shrink-0",
                                      hasActiveChild ? "text-[#D35400]" : "text-gray-400",
                                    )}
                                  />
                                  <span className="truncate">{item.name}</span>
                                </div>
                                <ChevronDown
                                  className={cn(
                                    "w-3.5 h-3.5 transition-transform duration-200 text-gray-400",
                                    isSubExpanded ? "rotate-180" : "",
                                  )}
                                />
                              </button>

                              {isSubExpanded && (
                                <div className="ml-4 pl-3 border-l-2 border-orange-100 space-y-1">
                                  {item.subItems.map((sub) => {
                                    const active = isLinkActive(sub.path);
                                    const SubIcon = sub.icon;
                                    return (
                                      <Link
                                        key={sub.path}
                                        href={sub.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                                          active
                                            ? "bg-[#D35400] text-white shadow-xs"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                                        )}
                                      >
                                        <SubIcon className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{sub.name}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </li>
                          );
                        }

                        const active = item.path ? isLinkActive(item.path) : false;

                        return (
                          <li key={item.name}>
                            <Link
                              href={item.path || "#"}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200",
                                active
                                  ? "bg-[#D35400] text-white shadow-xs"
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
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer profile panel */}
        {user && (
          <div className="border-t border-gray-100 pt-4 bg-white shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/80 border border-gray-100/50">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-xs">
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

      {/* Main page content area - FULL WIDTH 100% & FULL HEIGHT 100% */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full h-full">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth [&_*]:tracking-[0.02em]">
          {children}
        </main>
      </div>
    </div>
  );
}
