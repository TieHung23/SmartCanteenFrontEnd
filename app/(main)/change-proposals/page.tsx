"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  UtensilsCrossed,
  Calendar,
  ArrowLeft,
  XCircle,
  Clock,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { changeProposalService } from "@/services/change-proposal.service";
import { orderService } from "@/services/order.service";
import { sessionService } from "@/services/session.service";
import { CHANGE_PROPOSAL_STATUS_META, type ChangeProposalDetail } from "@/types/order.types";

interface OrderGroup {
  orderId: string;
  sessionName?: string | null;
  sessionTime?: string | null;
  orderCreatedAt?: string | null;
  proposals: ChangeProposalDetail[];
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChangeProposalsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const all = await changeProposalService.getAll();
      const map = new Map<string, ChangeProposalDetail[]>();
      for (const p of all) {
        const list = map.get(p.orderId) || [];
        list.push(p);
        map.set(p.orderId, list);
      }

      const orderIds = Array.from(map.keys());
      const orderDetailsMap = new Map<
        string,
        { sessionName?: string | null; sessionTime?: string | null; createdAtUtc?: string | null }
      >();

      await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            const order = await orderService.getOrderById(orderId);
            let sessionTimeStr = "";
            let sessionNameStr = order?.sessionName || "";

            if (order?.sessionId) {
              try {
                const session = await sessionService.getSessionDetail(order.sessionId);
                if (session) {
                  if (!sessionNameStr && session.name) {
                    sessionNameStr = session.name;
                  }
                  if (session.availableFrom && session.availableTo) {
                    const fromTime = new Date(session.availableFrom).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const toTime = new Date(session.availableTo).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const sessionDate = new Date(session.availableFrom).toLocaleDateString(
                      "vi-VN",
                      {
                        day: "2-digit",
                        month: "2-digit",
                      },
                    );
                    sessionTimeStr = `${fromTime} - ${toTime} (${sessionDate})`;
                  }
                }
              } catch {
                // Ignore session detail fetch error if session deleted
              }
            }

            orderDetailsMap.set(orderId, {
              sessionName: sessionNameStr,
              sessionTime: sessionTimeStr,
              createdAtUtc: order?.createdAtUtc,
            });
          } catch {
            // Ignore order fetch error
          }
        }),
      );

      const result: OrderGroup[] = [];
      for (const [orderId, proposals] of map) {
        const details = orderDetailsMap.get(orderId);
        result.push({
          orderId,
          sessionName: details?.sessionName,
          sessionTime: details?.sessionTime,
          orderCreatedAt: details?.createdAtUtc,
          proposals,
        });
      }
      setGroups(result);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProposals();
  }, [fetchProposals]);

  const activeCount = groups.reduce(
    (acc, g) => acc + g.proposals.filter((p) => p.proposalStatus === 0).length,
    0,
  );

  const filteredGroups = groups
    .map((g) => {
      if (activeTab === "pending") {
        return { ...g, proposals: g.proposals.filter((p) => p.proposalStatus === 0) };
      }
      if (activeTab === "accepted") {
        return { ...g, proposals: g.proposals.filter((p) => p.proposalStatus === 1) };
      }
      if (activeTab === "rejected") {
        return {
          ...g,
          proposals: g.proposals.filter((p) => p.proposalStatus === 2 || p.proposalStatus === 3),
        };
      }
      return g;
    })
    .filter((g) => g.proposals.length > 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#D35400] transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    Đề xuất đổi món
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 pl-0.5">
                  {loading
                    ? "Đang tải danh sách..."
                    : activeCount > 0
                      ? `Bạn có ${activeCount} đề xuất đang chờ xử lý`
                      : "Tất cả đề xuất đổi món của bạn"}
                </p>
              </div>

              <button
                onClick={fetchProposals}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-500" : ""}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
              {[
                { id: "all", label: "Tất cả" },
                { id: "pending", label: "Chờ xử lý" },
                { id: "accepted", label: "Đã chấp nhận" },
                { id: "rejected", label: "Từ chối / Hủy" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "bg-slate-100/90 text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Section */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
                <p className="text-xs font-semibold">Đang tải danh sách đề xuất...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-24 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                <p className="text-lg font-bold text-slate-800">Không có đề xuất đổi món nào</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tất cả đơn hàng của bạn đều ổn định.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGroups.map((group) => (
                  <div
                    key={group.orderId}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-orange-200 overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Group Header */}
                    <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70">
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Đơn hàng
                          </p>
                          <p className="font-mono font-bold text-slate-800 mt-0.5 text-xs">
                            #{group.orderId.slice(0, 12)}
                          </p>
                        </div>

                        {group.sessionName && (
                          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-950 px-3 py-1 rounded-xl text-xs font-bold border border-orange-200/60">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-[#D35400]" />
                            <span>Ca: {group.sessionName}</span>
                            {group.sessionTime && (
                              <span className="text-orange-900 font-medium border-l border-orange-200 pl-2 ml-0.5">
                                ⏰ {group.sessionTime}
                              </span>
                            )}
                          </div>
                        )}

                        {group.orderCreatedAt && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(group.orderCreatedAt)}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/orders/${group.orderId}`}
                        className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] text-white font-semibold text-xs rounded-full transition-all flex items-center gap-1 shadow-2xs shrink-0"
                      >
                        <span>Xem đơn hàng</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Proposals List */}
                    <div className="divide-y divide-slate-100">
                      {group.proposals.map((proposal) => {
                        const statusMeta = CHANGE_PROPOSAL_STATUS_META[proposal.proposalStatus];
                        return (
                          <div
                            key={proposal.id}
                            className="px-6 py-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 text-[#D35400]">
                                <AlertCircle className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-slate-900 truncate text-sm">
                                    {proposal.currentDishName}
                                  </p>
                                  {proposal.currentUnitPrice !== undefined &&
                                    proposal.currentUnitPrice !== null && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#D35400] bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md">
                                        <span>
                                          {new Intl.NumberFormat("vi-VN").format(
                                            proposal.currentUnitPrice,
                                          )}
                                        </span>
                                        <Image
                                          src="/logo_point.png"
                                          alt="coin"
                                          width={14}
                                          height={14}
                                          className="object-contain inline-block"
                                        />
                                      </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                  {proposal.isRequiredItem ? "Bắt buộc" : "Tùy chọn"}
                                  {proposal.suggestedDishName &&
                                    ` • Gợi ý: ${proposal.suggestedDishName}`}
                                </p>
                                {(proposal.expiresAtUtc || proposal.responseDeadlineUtc) && (
                                  <p
                                    className={`text-xs font-bold mt-1 flex items-center gap-1 ${
                                      proposal.isExpired ? "text-slate-400" : "text-amber-600"
                                    }`}
                                  >
                                    ⏰{" "}
                                    {proposal.isExpired
                                      ? "Đã hết hạn"
                                      : `Hạn phản hồi: ${formatDate(proposal.expiresAtUtc || proposal.responseDeadlineUtc)}`}
                                  </p>
                                )}
                              </div>
                            </div>

                            <span
                              className="text-xs font-bold px-3 py-1 rounded-xl shrink-0 flex items-center gap-1"
                              style={{
                                color: statusMeta.color,
                                backgroundColor: statusMeta.bg,
                              }}
                            >
                              {proposal.proposalStatus === 1 ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : proposal.proposalStatus === 2 || proposal.proposalStatus === 3 ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {statusMeta.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
