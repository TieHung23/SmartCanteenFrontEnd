import { StaffSidebar } from "./_components/staff-sidebar";
import { StaffHeader } from "./_components/staff-header";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#FDFBF9] overflow-hidden antialiased">
      <StaffSidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <StaffHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">{children}</main>
      </div>
    </div>
  );
}
