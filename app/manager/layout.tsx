"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn, getSafeUserAvatar, getUserRoleString } from "@/lib/utils";
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
  Package,
  ShoppingBag,
  BadgeCheck,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

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

  // Hover state for Eden-style collapsible sidebar
  const [isHovered, setIsHovered] = useState(false);
  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(
    () => new Set(["Hoàn tiền"]),
  );

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }
      const role = getUserRoleString(user.role);
      if (role !== "MANAGER") {
        if (role === "STAFF") {
          router.push("/staff");
        } else if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(timer);
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

  if (!isAuthenticated || !user) return null;
  const userRole = getUserRoleString(user.role);
  if (userRole !== "MANAGER") return null;

  return (
    <div
      className={cn(
        "flex h-screen w-screen overflow-hidden antialiased select-none relative",
        plusJakartaSans.variable,
      )}
      style={{ fontFamily: "var(--font-manager), var(--font-sans), sans-serif" }}
    >
      <ManagerBackground />

      {/* Mobile Top Header Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg text-gray-700 hover:text-[#D35400] transition-all"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in"
        />
      )}

      {/* ── DESKTOP & MOBILE SIDEBAR (EDEN STYLED RAIL) ── */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed top-4 bottom-4 left-4 z-40 bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl rounded-3xl flex flex-col justify-between transition-all duration-300 ease-in-out overflow-hidden group",
          // Mobile state vs Desktop state
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0",
          // Desktop expansion on hover
          isHovered ? "md:w-72 md:p-5" : "md:w-20 md:p-3",
          mobileOpen ? "p-5" : "",
        )}
      >
        <div className="flex flex-col flex-1 min-h-0 space-y-6">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 shrink-0 h-12 px-1">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={40} height={35} className="object-contain" />
            </div>

            <div
              className={cn(
                "transition-all duration-200 min-w-0 overflow-hidden whitespace-nowrap",
                isHovered || mobileOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden",
              )}
            >
              <h2 className="text-base font-black text-gray-900 leading-tight">
                Smart <span className="text-[#D35400]">Canteen</span>
              </h2>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                Manager Portal
              </p>
            </div>
          </div>

          {/* Navigation Items (Hidden Scrollbar) */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-0.5">
            {MANAGER_MENU_GROUPS.map((group) => {
              return (
                <div key={group.label} className="space-y-1.5">
                  {/* Group Label - only visible when expanded */}
                  <div
                    className={cn(
                      "text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 transition-all duration-200",
                      isHovered || mobileOpen ? "opacity-100 block" : "opacity-0 hidden",
                    )}
                  >
                    {group.label}
                  </div>

                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;

                      if (item.subItems) {
                        const isSubExpanded = expandedSubmenus.has(item.name);
                        const hasActiveChild = item.subItems.some((s) => isLinkActive(s.path));

                        return (
                          <li key={item.name} className="space-y-1">
                            <button
                              onClick={() => toggleSubmenu(item.name)}
                              title={!isHovered && !mobileOpen ? item.name : undefined}
                              className={cn(
                                "w-full flex items-center justify-between p-3 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer",
                                hasActiveChild
                                  ? "bg-orange-50 text-[#D35400]"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70",
                                !isHovered && !mobileOpen ? "justify-center" : "",
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <ItemIcon
                                  className={cn(
                                    "w-5 h-5 shrink-0",
                                    hasActiveChild ? "text-[#D35400]" : "text-gray-400",
                                  )}
                                />
                                <span
                                  className={cn(
                                    "truncate transition-all duration-200",
                                    isHovered || mobileOpen
                                      ? "opacity-100 w-auto"
                                      : "opacity-0 w-0 hidden",
                                  )}
                                >
                                  {item.name}
                                </span>
                              </div>

                              {(isHovered || mobileOpen) && (
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                                    isSubExpanded ? "rotate-180" : "",
                                  )}
                                />
                              )}
                            </button>

                            {/* Submenu links */}
                            {isSubExpanded && (isHovered || mobileOpen) && (
                              <div className="ml-4 pl-3 border-l-2 border-orange-200 space-y-1">
                                {item.subItems.map((sub) => {
                                  const active = isLinkActive(sub.path);
                                  const SubIcon = sub.icon;
                                  return (
                                    <Link
                                      key={sub.path}
                                      href={sub.path}
                                      className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                                        active
                                          ? "bg-[#D35400] text-white shadow-sm"
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
                            title={!isHovered && !mobileOpen ? item.name : undefined}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-2xl text-sm font-bold transition-all duration-200 group/link",
                              active
                                ? "bg-[#D35400] text-white shadow-lg shadow-orange-500/25"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70",
                              !isHovered && !mobileOpen ? "justify-center" : "",
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <ItemIcon
                                className={cn(
                                  "w-5 h-5 shrink-0 transition-colors",
                                  active
                                    ? "text-white"
                                    : "text-gray-400 group-hover/link:text-gray-700",
                                )}
                              />
                              <span
                                className={cn(
                                  "truncate transition-all duration-200",
                                  isHovered || mobileOpen
                                    ? "opacity-100 w-auto"
                                    : "opacity-0 w-0 hidden",
                                )}
                              >
                                {item.name}
                              </span>
                            </div>
                            {active && (isHovered || mobileOpen) && (
                              <ChevronRight className="w-4 h-4 text-white shrink-0" />
                            )}
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

        {/* Footer Profile Box */}
        {user && (
          <div className="border-t border-gray-100 pt-3 shrink-0">
            <div
              className={cn(
                "flex items-center gap-3 p-2 rounded-2xl bg-gray-50/90 border border-gray-200/60 transition-all",
                !isHovered && !mobileOpen ? "justify-center" : "",
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

              {(isHovered || mobileOpen) && (
                <div className="flex-1 min-w-0 space-y-0.5 whitespace-nowrap overflow-hidden">
                  <p className="text-sm font-black text-gray-900 truncate">{displayName}</p>
                  <p className="text-[10px] font-bold text-gray-400 truncate">{displayEmail}</p>
                </div>
              )}

              {(isHovered || mobileOpen) && (
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-[#D35400] p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all shrink-0 cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area - Reserved Left Padding for Collapsed Rail */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full h-full md:pl-28 transition-all duration-300">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth [&_*]:tracking-[0.02em]">
          {children}
        </main>
      </div>
    </div>
  );
}
