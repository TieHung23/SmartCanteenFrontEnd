"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { User, FileText, CheckCircle2, XCircle, X } from "lucide-react";
import { verificationService } from "@/services/verification.service";
import type { AdminVerificationDetail } from "@/types/verification.types";
import { STATUS_LABEL, DOCUMENT_TYPE_LABEL } from "@/types/verification.types";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { cn } from "@/lib/utils";

interface VerifyDetailsContentProps {
  requestId: string;
  onSuccess: () => void;
}

export function VerifyDetailsContent({ requestId, onSuccess }: VerifyDetailsContentProps) {
  const [detail, setDetail] = useState<AdminVerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await verificationService.adminGetDetail(requestId);
        setDetail(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [requestId]);

  const refreshDetail = async () => {
    try {
      const data = await verificationService.adminGetDetail(requestId);
      setDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    const result = await Swal.fire({
      title: "Xác nhận phê duyệt?",
      text: "Bạn có chắc chắn muốn phê duyệt hồ sơ này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Phê duyệt",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-200 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await verificationService.adminApprove(requestId);
      await refreshDetail();
      setActionDone("approved");
      Swal.fire({
        title: "Đã phê duyệt!",
        text: "Hồ sơ sinh viên đã được phê duyệt thành công.",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Lỗi!",
        text: "Không thể phê duyệt yêu cầu. Vui lòng thử lại.",
        icon: "error",
        confirmButtonColor: "#D35400",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    const result = await Swal.fire({
      title: "Xác nhận từ chối?",
      text: "Bạn có chắc chắn muốn từ chối hồ sơ này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-200 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await verificationService.adminReject(requestId, rejectReason.trim());
      await refreshDetail();
      setActionDone("rejected");
      Swal.fire({
        title: "Đã từ chối!",
        text: "Yêu cầu xác thực đã bị từ chối.",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Lỗi!",
        text: "Không thể từ chối yêu cầu. Vui lòng thử lại.",
        icon: "error",
        confirmButtonColor: "#D35400",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-500">Đang tải chi tiết yêu cầu xác thực...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-3xl text-sm font-bold shadow-xs">
        Yêu cầu xác thực không tồn tại.
      </div>
    );
  }

  const isResolved = detail.status === 2 || detail.status === 3 || detail.status === 4;
  const statusLabel = STATUS_LABEL[detail.status as keyof typeof STATUS_LABEL] || "Không xác định";

  return (
    <div className="space-y-6">
      {/* Result Banner after action */}
      {actionDone && (
        <div
          className={cn(
            "rounded-3xl p-6 border animate-fade-in",
            actionDone === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                actionDone === "approved"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600",
              )}
            >
              {actionDone === "approved" ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={cn(
                  "text-lg font-black",
                  actionDone === "approved" ? "text-green-800" : "text-red-800",
                )}
              >
                {actionDone === "approved" ? "Đã phê duyệt thành công!" : "Đã từ chối yêu cầu"}
              </h3>
              <p
                className={cn(
                  "text-sm font-semibold mt-0.5",
                  actionDone === "approved" ? "text-green-600" : "text-red-600",
                )}
              >
                Hồ sơ của <strong>{detail.userName}</strong> đã được xử lý.
                {actionDone === "rejected" && (
                  <span className="block mt-1 italic text-red-500">
                    Lý do: &ldquo;{rejectReason}&rdquo;
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onSuccess}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Đóng & Quay lại danh sách
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* User Info Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
              <User className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
            </div>

            <div className="divide-y divide-gray-100 text-sm">
              <div className="py-3 first:pt-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Họ và tên sinh viên
                </p>
                <p className="font-bold text-gray-900 mt-1">
                  {detail.userName && detail.userName.trim() !== ""
                    ? detail.userName
                    : `User #${detail.userId?.slice(0, 8) || detail.id.slice(0, 8)}`}
                </p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Địa chỉ Email
                </p>
                <p className="font-semibold text-gray-600 mt-1 truncate">
                  {detail.userEmail && detail.userEmail.trim() !== ""
                    ? detail.userEmail
                    : "Chưa cập nhật email"}
                </p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Mã số sinh viên (MSSV)
                </p>
                <p className="font-bold text-gray-700 mt-1">{detail.studentId || "—"}</p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Lớp / Chuyên ngành
                </p>
                <p className="font-semibold text-gray-600 mt-1">{detail.majorOrClass || "—"}</p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ngày sinh
                </p>
                <p className="font-bold text-gray-700 mt-1">{detail.dateOfBirth || "—"}</p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Thời gian nộp
                </p>
                <p className="font-semibold text-gray-600 mt-1">
                  {new Date(detail.submittedAt).toLocaleString("vi-VN")}
                </p>
              </div>
              {detail.reviewedAt && (
                <div className="py-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Thời gian xử lý
                  </p>
                  <p className="font-semibold text-gray-600 mt-1">
                    {new Date(detail.reviewedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trạng thái hồ sơ
                </p>
                <span
                  className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                    detail.status === 1 || detail.status === 0
                      ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                      : detail.status === 2
                        ? "bg-green-50 text-green-800 border-green-200"
                        : detail.status === 3
                          ? "bg-red-50 text-red-800 border-red-200"
                          : "bg-gray-50 text-gray-800 border-gray-200",
                  )}
                >
                  {statusLabel}
                </span>
              </div>
              {detail.rejectionReason && (
                <div className="py-3 pt-4">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    Lý do từ chối
                  </p>
                  <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-2xl mt-2 italic">
                    &ldquo;{detail.rejectionReason}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Documents Column */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <FileText className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">
                Tài liệu đính kèm ({detail.documents.length})
              </h2>
            </div>

            {detail.documents.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 italic text-center">
                Không tải lên tài liệu minh chứng nào.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {detail.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-3">
                        <span className="text-sm font-bold text-gray-800">
                          {DOCUMENT_TYPE_LABEL[
                            doc.documentType as keyof typeof DOCUMENT_TYPE_LABEL
                          ] || "Khác"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivePhoto(doc.cloudinaryUrl)}
                          className="text-xs font-bold text-[#D35400] hover:underline cursor-pointer"
                        >
                          Mở ảnh lớn
                        </button>
                      </div>
                      <div
                        onClick={() => setActivePhoto(doc.cloudinaryUrl)}
                        className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-white border border-gray-200 cursor-zoom-in hover:opacity-95 transition-all duration-300"
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
                    <p className="text-[10px] text-gray-400 truncate mt-2">{doc.fileName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve/Reject Action box - only show when status is Pending (0 or 1) and no action done yet */}
      {!actionDone && (detail.status === 0 || detail.status === 1) && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-gray-100 pb-2">
            <h2 className="text-base font-bold text-gray-900">Thao tác duyệt hồ sơ</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-xs cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {actionLoading ? "Đang xử lý..." : "Phê duyệt hồ sơ"}
            </button>
            <button
              onClick={() => setShowReject(!showReject)}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-xs cursor-pointer active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              Từ chối duyệt
            </button>
          </div>

          {showReject && (
            <div className="space-y-3 pt-3 border-t border-dashed border-gray-200 animate-slide-down">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Lý do từ chối duyệt *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do bác bỏ yêu cầu xác thực (ví dụ: Hình ảnh CMND/Thẻ sinh viên mờ không rõ số)..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-xs"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  Xác nhận Từ Chối
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Already resolved - show a note */}
      {!actionDone && isResolved && (
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            {detail.status === 2 ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <p className="text-sm font-bold text-gray-600">
              Yêu cầu này đã được xử lý. Trạng thái:{" "}
              <span
                className={cn(
                  "inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ml-1",
                  detail.status === 2
                    ? "bg-green-50 text-green-800 border-green-200"
                    : detail.status === 3
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-gray-100 text-gray-800 border-gray-200",
                )}
              >
                {statusLabel}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in backdrop-blur-sm"
          >
            <div
              className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
