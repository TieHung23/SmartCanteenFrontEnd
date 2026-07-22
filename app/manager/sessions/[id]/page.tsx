"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SessionDetailsContent } from "../_components/session-details-content";

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/manager/sessions")}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
      </div>

      {/* Session detail content */}
      <SessionDetailsContent sessionId={id} onBack={() => router.push("/manager/sessions")} />
    </div>
  );
}
