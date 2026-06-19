"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const MANAGER_MENU = [
  { name: "Dashboard", path: "/manager", icon: "📊" },
  { name: "Serving Sessions", path: "/manager/sessions", icon: "📅" },
  { name: "Menu Settings", path: "/manager/menu", icon: "🥘" },
  { name: "Manage Users", path: "/manager/users", icon: "👥" },
  { name: "Identity Verify", path: "/manager/verify", icon: "✅" },
  { name: "Refunds", path: "/manager/refunds", icon: "💸" },
  { name: "Robot Slots", path: "/manager/robot", icon: "🤖" },
  { name: "Sales Reports", path: "/manager/reports", icon: "📈" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      <Navbar />
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 py-3 overflow-x-auto scrollbar-none">
            {MANAGER_MENU.map((menu) => {
              const isActive = pathname === menu.path || pathname.startsWith(menu.path + "/");
              return (
                <Link key={menu.path} href={menu.path}>
                  <span
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-[#D35400] text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                    )}
                  >
                    <span className="text-base">{menu.icon}</span>
                    {menu.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
