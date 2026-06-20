"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return <div className="text-center py-20 text-gray-400">Verification not found.</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          {detail.userName} &mdash; {detail.userEmail}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">User Info</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="text-sm font-semibold text-gray-900">{detail.userName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm text-gray-700">{detail.userEmail}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Student ID</p>
              <p className="text-sm text-gray-700">{detail.studentId || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Class / Major</p>
              <p className="text-sm text-gray-700">{detail.majorOrClass || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date of Birth</p>
              <p className="text-sm text-gray-700">{detail.dateOfBirth || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Submitted</p>
              <p className="text-sm text-gray-700">
                {new Date(detail.submittedAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <span
                className={cn(
                  "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  detail.status === 0
                    ? "bg-yellow-50 text-yellow-700"
                    : detail.status === 1
                      ? "bg-green-50 text-green-700"
                      : detail.status === 2
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-100 text-gray-500",
                )}
              >
                {STATUS_LABEL[detail.status as keyof typeof STATUS_LABEL] || "Unknown"}
              </span>
            </div>
            {detail.rejectionReason && (
              <div>
                <p className="text-xs text-gray-400">Rejection Reason</p>
                <p className="text-sm text-red-600">{detail.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Documents ({detail.documents.length})
          </h2>
          {detail.documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded.</p>
          ) : (
            <div className="space-y-4">
              {detail.documents.map((doc) => (
                <div key={doc.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      {DOCUMENT_TYPE_LABEL[doc.documentType as keyof typeof DOCUMENT_TYPE_LABEL] ||
                        "Other"}
                    </span>
                    <a
                      href={doc.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#D35400] hover:underline"
                    >
                      Open
                    </a>
                  </div>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={doc.cloudinaryUrl}
                      alt={doc.fileName}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{doc.fileName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detail.status === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => setShowReject(!showReject)}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              Reject
            </button>
          </div>
          {showReject && (
            <div className="space-y-3 pt-2">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
