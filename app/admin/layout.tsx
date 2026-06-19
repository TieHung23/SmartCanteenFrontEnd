"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_MENU = [
  { name: "Dashboard", path: "/admin", icon: "📊" },
  { name: "API Logs", path: "/admin/logs", icon: "📋" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex font-sans">
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-20">
        <div className="h-20 flex items-center px-8">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Admin<span className="text-[#D35400]">Panel</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {ADMIN_MENU.map((menu) => {
            const isActive = pathname === menu.path;
            return (
              <Link key={menu.path} href={menu.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm",
                    isActive
                      ? "bg-[#ffdbc4] text-[#D35400] shadow-[0_4px_10px_rgba(211,84,0,0.05)]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                  )}
                >
                  <span className="text-lg">{menu.icon}</span>
                  {menu.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <Link href="/login">
            <button className="flex items-center gap-3 text-gray-400 hover:text-red-500 transition-colors font-medium text-sm">
              <span>🚪</span> Logout
            </button>
          </Link>
        </div>
      </aside>

      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {ADMIN_MENU.find((m) => m.path === pathname)?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">Admin</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#D35400] flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 md:p-12">{children}</main>
      </div>
    </div>
  );
}
