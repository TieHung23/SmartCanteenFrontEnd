"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ManagerBackground } from "./_components/manager-background";
import {
  LayoutDashboard,
  CalendarDays,
  ChefHat,
  Layers,
  Users,
  UserCheck,
  Coins,
  RotateCcw,
  Cpu,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Package,
  Route,
  type LucideIcon,
} from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-manager",
});

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  icon?: LucideIcon;
  items: MenuItem[];
}

const MANAGER_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Bảng Điều Khiển",
    items: [{ name: "Bảng Điều Khiển", path: "/manager", icon: LayoutDashboard }],
  },
  {
    label: "Quản Lý",
    icon: CalendarDays,
    items: [
      { name: "Phiên Phục Vụ", path: "/manager/sessions", icon: CalendarDays },
      { name: "Đơn Hàng", path: "/manager/orders", icon: Package },
      { name: "Thực Đơn", path: "/manager/menu", icon: ChefHat },
      { name: "Danh Mục", path: "/manager/categories", icon: Layers },
    ],
  },
  {
    label: "Người Dùng",
    icon: Users,
    items: [
      { name: "Quản Lý", path: "/manager/users", icon: Users },
      { name: "Xác Thực", path: "/manager/verify", icon: UserCheck },
    ],
  },
  {
    label: "Hoàn Tiền",
    icon: Coins,
    items: [
      { name: "Yêu Cầu", path: "/manager/refunds", icon: Coins },
      { name: "Chính Sách", path: "/manager/refund-policies", icon: RotateCcw },
    ],
  },
  {
    label: "Hệ Thống",
    icon: Cpu,
    items: [
      { name: "Robot", path: "/manager/robot", icon: Cpu },
      { name: "Khay (Trays)", path: "/manager/trays", icon: Package },
      { name: "Ô Kệ (Slots)", path: "/manager/pickup-slots", icon: Package },
      { name: "Cấu Hình Lane", path: "/manager/slot-configs", icon: Route },
      { name: "Báo Cáo", path: "/manager/reports", icon: TrendingUp },
      { name: "Cài Đặt", path: "/manager/settings", icon: Settings },
    ],
  },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const activeGroup = MANAGER_MENU_GROUPS.find((g) =>
      g.items.some((item) =>
        item.path === "/manager" ? pathname === "/manager" : pathname.startsWith(item.path),
      ),
    );
    return new Set(
      activeGroup ? [activeGroup.label] : [MANAGER_MENU_GROUPS[0]?.label].filter(Boolean),
    );
  });

  // Auto-close sidebar on route changes on mobile
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }

  const isActive = (path: string) =>
    path === "/manager" ? pathname === "/manager" : pathname.startsWith(path);

  const isGroupActive = (group: MenuGroup) => group.items.some((item) => isActive(item.path));

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const displayName = user?.name || "Quản Lý";
  const displayEmail = user?.email || "manager@canteen.vn";
  const avatarUrl = user?.imgUrl || null;

  // Show loading while checking auth
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

  // Redirect handled by useEffect above
  if (!isAuthenticated) return null;

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row h-screen overflow-hidden antialiased select-none",
        plusJakartaSans.variable,
      )}
      style={{ fontFamily: "var(--font-manager), var(--font-sans), sans-serif" }}
    >
      <ManagerBackground />

      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-30 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-800 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0">
            <Image src="/logo.png" alt="Logo" width={32} height={28} className="object-contain" />
          </div>
          <span className="font-bold text-gray-900 text-lg">Smart Canteen</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Sleek full-height responsive sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[300px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-transform duration-300 lg:sticky lg:h-screen lg:w-[350px] lg:translate-x-0 p-6 shadow-sm justify-between group/sidebar",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
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

          {/* Logo brand */}
          <div className="px-2 py-1 flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
              <Image src="/logo.png" alt="Logo" width={56} height={48} className="object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                Smart <span className="text-[#E86A33]">Canteen</span>
              </h2>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mt-0.5">
                Cổng Quản Lý
              </p>
            </div>
          </div>

          {/* Navigation menu with auto-scroll on hover */}
          <div className="relative flex-1 min-h-0">
            <nav
              className="sidebar-nav h-full pr-1"
              onMouseEnter={(e) => {
                const nav = e.currentTarget;
                const rect = nav.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;
                const scrollable = nav.scrollHeight - nav.clientHeight;
                if (scrollable <= 0) return;
                nav.scrollTop = (mouseY / rect.height) * scrollable;
              }}
              onMouseMove={(e) => {
                const nav = e.currentTarget;
                const rect = nav.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;
                const scrollable = nav.scrollHeight - nav.clientHeight;
                if (scrollable <= 0) return;
                const targetScroll = (mouseY / rect.height) * scrollable;
                const diff = targetScroll - nav.scrollTop;
                if (Math.abs(diff) > 0.5) nav.scrollTop += diff * 0.12;
              }}
            >
              <ul className="space-y-1 pb-3">
                {MANAGER_MENU_GROUPS.map((group) => {
                  const isSingle = group.items.length === 1;
                  const item = group.items[0];
                  const groupActive = isGroupActive(group);
                  const expanded = expandedGroups.has(group.label);

                  if (isSingle) {
                    return (
                      <li key={group.label}>
                        <Link
                          href={item.path}
                          className={cn(
                            "flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 group hover:translate-x-1.5",
                            isActive(item.path)
                              ? "bg-gray-50 text-[#E86A33] border border-gray-200 shadow-xs"
                              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/80",
                          )}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <item.icon
                              className={cn(
                                "w-5 h-5 shrink-0 transition-colors",
                                isActive(item.path)
                                  ? "text-[#E86A33]"
                                  : "text-gray-400 group-hover:text-gray-600",
                              )}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {isActive(item.path) && (
                            <ChevronRight className="w-4 h-4 text-[#E86A33] shrink-0" />
                          )}
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={group.label}>
                      {(() => {
                        const GroupIcon = group.icon!;
                        return (
                          <button
                            onClick={() => toggleGroup(group.label)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 group",
                              groupActive && !expanded
                                ? "bg-gray-50 text-[#E86A33] border border-gray-200 shadow-xs"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/80",
                            )}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <GroupIcon
                                className={cn(
                                  "w-5 h-5 shrink-0 transition-colors",
                                  groupActive
                                    ? "text-[#E86A33]"
                                    : "text-gray-400 group-hover:text-gray-600",
                                )}
                              />
                              <span className="truncate">{group.label}</span>
                            </div>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 shrink-0 transition-transform duration-200",
                                expanded && "rotate-180",
                                groupActive ? "text-[#E86A33]" : "text-gray-400",
                              )}
                            />
                          </button>
                        );
                      })()}
                      <div
                        className={cn(
                          "grid transition-all duration-200 ease-in-out",
                          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="ml-3 pl-4 border-l-2 border-gray-100 space-y-0.5 mt-0.5 mb-1">
                            {group.items.map((sub) => (
                              <Link
                                key={sub.path}
                                href={sub.path}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                                  isActive(sub.path)
                                    ? "bg-gray-50 text-[#E86A33] border border-gray-200 shadow-xs"
                                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50/60",
                                )}
                              >
                                <sub.icon
                                  className={cn(
                                    "w-4 h-4 shrink-0",
                                    isActive(sub.path) ? "text-[#E86A33]" : "text-gray-400",
                                  )}
                                />
                                <span>{sub.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>

        {/* Footer profile panel */}
        {user && (
          <div className="border-t border-gray-100 pt-5 bg-white shrink-0">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100/50">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#E86A33]/10 border border-[#E86A33]/20 flex items-center justify-center shrink-0 shadow-xs">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-[#E86A33] font-extrabold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-base font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-sm font-medium text-gray-400 truncate">{displayEmail}</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all shrink-0"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main page content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth [&_*]:tracking-[0.02em]">
          {children}
        </main>
      </div>
    </div>
  );
}
