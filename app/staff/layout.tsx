"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { StaffSidebar } from "./_components/staff-sidebar";
import { StaffHeader } from "./_components/staff-header";
import { StaffBackground } from "./_components/staff-background";
import { cn } from "@/lib/utils";
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar on route changes
  useEffect(() => {
    const timer = setTimeout(() => setSidebarOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden antialiased select-none relative font-sans">
      <StaffBackground />

      {/* Floating Edge Pull Handle - Cục Popup kéo sát mép màn hình màu Xám */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={cn(
          "fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-16 bg-gray-300 hover:bg-orange-400 text-white rounded-r-2xl shadow-2xl hover:w-10 transition-all duration-300 group cursor-pointer border-y border-r border-gray-600/50",
          sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
        title="Nhấn để kéo menu nhân viên"
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

      <StaffSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <StaffHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth [&_*]:tracking-[0.02em]">
          {children}
        </main>
      </div>
    </div>
  );
}
