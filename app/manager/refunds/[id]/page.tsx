"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { refundService } from "@/services/refund.service";
import type { ManagerRefundDetail } from "@/types/refund.types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50" },
  Approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50" },
  Rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
};

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ManagerRefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await refundService.managerGetDetail(id);
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
    if (!confirm("Approve this refund request? The user will be credited.")) return;
    setActionLoading(true);
    try {
      await refundService.managerApprove(id);
      router.push("/manager/refunds");
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
      await refundService.managerReject(id, rejectReason.trim());
      router.push("/manager/refunds");
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
    return <div className="text-center py-20 text-gray-400">Refund not found.</div>;
  }

  const style = STATUS_STYLES[detail.status] || STATUS_STYLES.Pending;

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
        <h1 className="text-2xl font-bold text-gray-900">Refund Detail</h1>
        <p className="text-sm text-gray-500 mt-1">Request #{detail.id.slice(0, 8)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Request Info</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">User ID</p>
              <p className="text-sm font-mono text-gray-700">{detail.userId.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Order ID</p>
              <p className="text-sm font-mono text-gray-700">{detail.orderId.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Policy</p>
              <p className="text-sm font-semibold text-gray-900">
                {detail.policyName} ({detail.policyCode})
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Description</p>
              <p className="text-sm text-gray-700">{detail.description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <span
                className={cn(
                  "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  style.bg,
                  style.color,
                )}
              >
                {style.label}
              </span>
            </div>
            {detail.rejectionReason && (
              <div>
                <p className="text-xs text-gray-400">Rejection Reason</p>
                <p className="text-sm text-red-600">{detail.rejectionReason}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Created</p>
              <p className="text-sm text-gray-700">
                {new Date(detail.createdAtUtc).toLocaleString("vi-VN")}
              </p>
            </div>
            {detail.reviewedAtUtc && (
              <div>
                <p className="text-xs text-gray-400">Reviewed At</p>
                <p className="text-sm text-gray-700">
                  {new Date(detail.reviewedAtUtc).toLocaleString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Financial</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Order Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat("vi-VN").format(detail.orderAmount)} pts
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Refund %</p>
              <p className="text-sm text-gray-700">{detail.refundPercent}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Refund Amount</p>
              <p className="text-lg font-bold text-[#D35400]">
                {new Intl.NumberFormat("vi-VN").format(detail.refundAmount)} pts
              </p>
            </div>
            {detail.walletTransactionId && (
              <div>
                <p className="text-xs text-gray-400">Wallet Transaction</p>
                <p className="text-sm font-mono text-gray-700">{detail.walletTransactionId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {detail.images.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Evidence Images ({detail.images.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {detail.images.map((img) => (
              <a
                key={img.id}
                href={img.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  <Image
                    src={img.imageUrl}
                    alt={img.fileName}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                    sizes="200px"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{img.fileName}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {detail.status === "Pending" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {actionLoading ? "Processing..." : "Approve & Credit"}
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
