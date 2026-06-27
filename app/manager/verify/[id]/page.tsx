"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, User, FileText, CheckCircle2, XCircle, X } from "lucide-react";
import { verificationService } from "@/services/verification.service";
import type { AdminVerificationDetail } from "@/types/verification.types";
import { STATUS_LABEL, DOCUMENT_TYPE_LABEL } from "@/types/verification.types";
import { cn } from "@/lib/utils";

export default function VerifyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<AdminVerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await verificationService.adminGetDetail(id);
        setDetail(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleApprove = async () => {
    if (!confirm("Approve this verification request?")) return;
    setActionLoading(true);
    try {
      await verificationService.adminApprove(id);
      router.push("/manager/verify");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await verificationService.adminReject(id, rejectReason.trim());
      router.push("/manager/verify");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải chi tiết yêu cầu xác thực...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs animate-fade-in">
        ⚠️ Yêu cầu xác thực không tồn tại.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12 px-4 md:px-0">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push("/manager/verify")}
          className="flex items-center gap-2 text-base font-bold text-gray-500 hover:text-[#D35400] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Verification
        </button>

        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">Verification Review</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Duyệt thông tin cá nhân và đối chiếu hồ sơ sinh viên:{" "}
            <span className="font-bold text-gray-900">{detail.userName}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* User Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/60 p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
              <User className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="py-3.5 first:pt-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Họ và tên sinh viên
                </p>
                <p className="text-base font-bold text-gray-900 mt-1">{detail.userName}</p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Địa chỉ Email
                </p>
                <p className="text-sm font-semibold text-gray-600 mt-1">{detail.userEmail}</p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Mã số sinh viên (MSSV)
                </p>
                <p className="text-sm font-bold text-gray-700 mt-1">{detail.studentId || "—"}</p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Lớp / Chuyên ngành
                </p>
                <p className="text-sm font-semibold text-gray-600 mt-1">
                  {detail.majorOrClass || "—"}
                </p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ngày sinh
                </p>
                <p className="text-sm font-bold text-gray-700 mt-1">{detail.dateOfBirth || "—"}</p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Thời gian nộp
                </p>
                <p className="text-sm font-semibold text-gray-600 mt-1">
                  {new Date(detail.submittedAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trạng thái hồ sơ
                </p>
                <span
                  className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    detail.status === 0
                      ? "bg-yellow-105 text-yellow-800 border border-yellow-200/60"
                      : detail.status === 1
                        ? "bg-green-105 text-green-800 border border-green-200/60"
                        : "bg-red-105 text-red-800 border border-red-200/60",
                  )}
                >
                  {STATUS_LABEL[detail.status as keyof typeof STATUS_LABEL] || "Unknown"}
                </span>
              </div>
              {detail.rejectionReason && (
                <div className="pt-3.5">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    Lý do từ chối
                  </p>
                  <p className="text-sm text-red-650 mt-1 italic">
                    &ldquo;{detail.rejectionReason}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Documents Column */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-200/60 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <FileText className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">
                Tài liệu đính kèm ({detail.documents.length})
              </h2>
            </div>

            {detail.documents.length === 0 ? (
              <p className="text-base text-gray-400 py-6 italic text-center">
                Không tải lên tài liệu minh chứng nào.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {detail.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200/60 rounded-3xl p-5 bg-gray-50/50 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5 mb-2.5">
                        <span className="text-base font-bold text-gray-800">
                          {DOCUMENT_TYPE_LABEL[
                            doc.documentType as keyof typeof DOCUMENT_TYPE_LABEL
                          ] || "Other"}
                        </span>
                        <button
                          onClick={() => setActivePhoto(doc.cloudinaryUrl)}
                          className="text-sm font-bold text-[#D35400] hover:underline"
                        >
                          Mở ảnh lớn
                        </button>
                      </div>
                      <div
                        onClick={() => setActivePhoto(doc.cloudinaryUrl)}
                        className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-white border border-gray-200/60 cursor-zoom-in hover:opacity-95 transition-all duration-300 image-3d"
                      >
                        <Image
                          src={doc.cloudinaryUrl}
                          alt={doc.fileName}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 1024px) 100vw, 800px"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-auto">{doc.fileName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve/Reject Action box */}
      {detail.status === 0 && (
        <div className="bg-white rounded-3xl border border-gray-200/60 p-8 space-y-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-2">
            <h2 className="text-lg font-bold text-gray-900">Thao tác duyệt hồ sơ</h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-base font-bold transition-all disabled:opacity-60"
            >
              <CheckCircle2 className="w-5 h-5" />
              {actionLoading ? "Đang xử lý..." : "Phê duyệt hồ sơ"}
            </button>
            <button
              onClick={() => setShowReject(!showReject)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-base font-bold transition-all disabled:opacity-60"
            >
              <XCircle className="w-5 h-5" />
              Từ chối duyệt
            </button>
          </div>

          {showReject && (
            <div className="space-y-4 pt-4 border-t border-dashed border-gray-200 animate-slide-down">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Lý do từ chối duyệt *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do bác bỏ yêu cầu xác thực (ví dụ: Hình ảnh CMND/Thẻ sinh viên mờ không rõ số)..."
                  rows={4}
                  className="w-full px-4 py-3 text-base bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 placeholder:text-gray-400 transition-all resize-none animate-fade-in"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-bold transition-all disabled:opacity-60 shadow-xs"
                >
                  Xác nhận Từ Chối
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in backdrop-blur-sm"
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
