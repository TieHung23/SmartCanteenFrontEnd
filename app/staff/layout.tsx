import { Nunito } from "next/font/google";
import { StaffSidebar } from "./_components/staff-sidebar";
import { StaffHeader } from "./_components/staff-header";
import { StaffBackground } from "./_components/staff-background";
import { cn } from "@/lib/utils";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-staff",
});

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn("flex h-screen overflow-hidden antialiased", nunito.variable)}
      style={{ fontFamily: "var(--font-staff), var(--font-sans), sans-serif" }}
    >
      <StaffBackground />
      <StaffSidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <StaffHeader />
        <main className="flex-1 overflow-y-auto p-5 md:p-8 scroll-smooth [&_*]:tracking-[0.02em]">
          {children}
        </main>
      </div>
    </div>
  );
}
