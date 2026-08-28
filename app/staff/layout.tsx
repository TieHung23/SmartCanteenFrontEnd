"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Plus_Jakarta_Sans } from "next/font/google";
import { StaffSidebar } from "./_components/staff-sidebar";
import { StaffHeader } from "./_components/staff-header";
import { StaffBackground } from "./_components/staff-background";
import { cn, getUserRoleString } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-staff",
});

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }
      const role = getUserRoleString(user.role);
      if (role !== "STAFF") {
        if (role === "MANAGER") {
          router.push("/manager");
        } else if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setSidebarOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#D35400]/20 border-t-[#D35400] rounded-full animate-spin" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải Cổng Nhân Viên...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  const userRole = getUserRoleString(user.role);
  if (userRole !== "STAFF") return null;

  return (
    <div
      className={cn(
        "flex h-screen w-screen overflow-hidden antialiased select-none relative",
        plusJakartaSans.variable,
      )}
      style={{ fontFamily: "var(--font-staff), var(--font-sans), sans-serif" }}
    >
      <StaffBackground />

      {/* Sidebar Backdrop Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in"
        />
      )}

      {/* Eden Hover-Expand Sidebar */}
      <StaffSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full h-full md:pl-28 transition-all duration-300">
        <StaffHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth [&_*]:tracking-[0.02em]">
          {children}
        </main>
      </div>
    </div>
  );
}
