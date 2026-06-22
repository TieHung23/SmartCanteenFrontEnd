"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { StaffSidebar } from "./_components/staff-sidebar";
import { StaffHeader } from "./_components/staff-header";
import { StaffBackground } from "./_components/staff-background";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-staff",
});

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar on route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div
      className={cn("flex flex-col lg:flex-row h-screen overflow-hidden antialiased select-none", plusJakartaSans.variable)}
      style={{ fontFamily: "var(--font-staff), var(--font-sans), sans-serif" }}
    >
      <StaffBackground />

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
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

