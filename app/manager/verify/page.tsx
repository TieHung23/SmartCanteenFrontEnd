"use client";

import { useEffect, useState } from "react";
import { Eye, ShieldAlert } from "lucide-react";
import { verificationService } from "@/services/verification.service";
import type { AdminVerificationListItem } from "@/types/verification.types";
import Modal from "../_components/modal";
import { VerifyDetailsContent } from "./_components/verify-details-content";

export default function ManagerVerifyPage() {
  const [requests, setRequests] = useState<AdminVerificationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const handleOpenDetails = (id: string) => {
    setDetailsId(id);
    setIsDetailsOpen(true);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const result = await verificationService.adminList({ pageSize: 100 });
      setRequests(result.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Xác thực danh tính</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Phê duyệt hoặc bác bỏ các yêu cầu xác thực danh tính sinh viên.
        </p>
      </div>

      {/* Table/List Container */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">
            Đang tải danh sách yêu cầu xác thực...
          </p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/60 p-16 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="w-12 h-12 text-gray-300" />
          <p className="text-gray-400 font-bold text-lg">Chưa có yêu cầu xác thực nào cần xử lý.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              onClick={() => handleOpenDetails(req.id)}
              className="bg-white rounded-3xl border border-gray-200/60 p-6 hover:shadow-md hover:border-orange-200/60 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-2xs gap-5 card-3d"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100/50 shrink-0 font-bold text-lg uppercase">
                    {req.userName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate tracking-wide">
                      {req.userName}
                    </h3>
                    <p className="text-sm font-semibold text-gray-405 truncate">{req.userEmail}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
                  <span className="font-semibold text-gray-400">Tài liệu:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100/60">
                    {req.documentCount} file(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="font-semibold text-gray-400">Ngày gửi:</span>
                  <span className="font-bold text-gray-600">
                    {new Date(req.submittedAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDetails(req.id);
                }}
                className="w-full py-3 bg-[#D35400]/10 hover:bg-[#D35400] text-[#D35400] hover:text-white rounded-2xl text-sm font-bold transition-all text-center flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Xem xét
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── VERIFY DETAIL MODAL ── */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Chi tiết yêu cầu xác thực"
        size="lg"
      >
        {detailsId && (
          <VerifyDetailsContent
            requestId={detailsId}
            onSuccess={() => {
              setIsDetailsOpen(false);
              fetchRequests();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
