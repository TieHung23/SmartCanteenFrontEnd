"use client";

import { Activity } from "lucide-react";
import { ServingJobsSection } from "@/components/features/robot/serving-jobs-section";

export default function ManagerServingJobsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Page Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D35400] to-[#E86A33] flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Serving Jobs</h1>
            <p className="text-base text-gray-500 mt-0.5">
              Quản lý, theo dõi tiến trình và giải cứu công việc robot gắp món
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Section ── */}
      <ServingJobsSection />
    </div>
  );
}
