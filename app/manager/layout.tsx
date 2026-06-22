"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  Cpu,
  TrendingUp,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-manager",
});

const MANAGER_MENU = [
  { name: "Dashboard", path: "/manager", icon: LayoutDashboard },
  { name: "Serving Sessions", path: "/manager/sessions", icon: CalendarDays },
  { name: "Menu Settings", path: "/manager/menu", icon: ChefHat },
  { name: "Categories", path: "/manager/categories", icon: Layers },
  { name: "Manage Users", path: "/manager/users", icon: Users },
  { name: "Identity Verify", path: "/manager/verify", icon: UserCheck },
  { name: "Refunds", path: "/manager/refunds", icon: Coins },
  { name: "Robot Slots", path: "/manager/robot", icon: Cpu },
  { name: "Sales Reports", path: "/manager/reports", icon: TrendingUp },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Auto-close sidebar on route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (path: string) =>
    path === "/manager" ? pathname === "/manager" : pathname.startsWith(path);

  const displayName = user?.name || "Manager Admin";
  const displayEmail = user?.email || "manager@canteen.vn";
  const avatarUrl = user?.imgUrl || null;

  return (
    <div
      className={cn("flex flex-col lg:flex-row h-screen overflow-hidden antialiased select-none", plusJakartaSans.variable)}
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
                Manager Portal
              </p>
            </div>
          </div>

          {/* Navigation menu */}
          <nav className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] px-4 mb-4">
              Control Panel
            </p>
            <ul className="space-y-1.5">
              {MANAGER_MENU.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 group hover:translate-x-1.5",
                        active
                          ? "bg-gray-50 text-[#E86A33] border border-gray-200 shadow-xs"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/80",
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <item.icon
                          className={cn(
                            "w-5 h-5 shrink-0 transition-colors",
                            active ? "text-[#E86A33]" : "text-gray-400 group-hover:text-gray-600",
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {active && <ChevronRight className="w-4 h-4 text-[#E86A33] shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Footer profile panel */}
        {user && (
          <div className="border-t border-gray-100 pt-5 bg-white shrink-0" ref={userMenuRef}>
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

