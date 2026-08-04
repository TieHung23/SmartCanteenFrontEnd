"use client";

import { useState, useEffect, useCallback } from "react";
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
  return d.toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChangeProposalsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
          >
            <ArrowLeftRight className="w-4 h-4" /> Quay lại
          </button>

          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <div>
                <h1 className="text-3xl font-black text-gray-800">Đề xuất đổi món</h1>
                <p className="text-sm text-gray-400 font-semibold mt-1">
                  {loading
                    ? "Đang tải..."
                    : activeCount > 0
                      ? `Bạn có ${activeCount} đề xuất đang chờ xử lý`
                      : "Tất cả đề xuất đã được xử lý"}
                </p>
              </div>
              <button
                onClick={fetchProposals}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-32">
                <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-700">Không có đề xuất đổi món nào</p>
                <p className="text-sm text-gray-400 mt-1">Tất cả đơn hàng của bạn đều ổn định.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => (
                  <div
                    key={group.orderId}
                    className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70">
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Đơn hàng
                          </p>
                          <p className="font-mono font-bold text-gray-800 mt-0.5 text-sm">
                            #{group.orderId.slice(0, 8)}...
                          </p>
                        </div>

                        {group.sessionName && (
                          <div className="flex items-center gap-1.5 bg-orange-100/80 text-orange-950 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-orange-200/60">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-[#D35400]" />
                            <span>Ca: {group.sessionName}</span>
                            {group.sessionTime && (
                              <span className="text-orange-900 font-semibold border-l border-orange-300/60 pl-2 ml-0.5">
                                ⏰ {group.sessionTime}
                              </span>
                            )}
                          </div>
                        )}

                        {group.orderCreatedAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(group.orderCreatedAt)}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/orders/${group.orderId}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#D35400] hover:text-[#b04600] transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs hover:border-orange-200"
                      >
                        Xem đơn hàng
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {group.proposals.map((proposal) => {
                        const statusMeta = CHANGE_PROPOSAL_STATUS_META[proposal.proposalStatus];
                        return (
                          <div
                            key={proposal.id}
                            className="px-6 py-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-[#D35400]" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate text-sm">
                                  {proposal.currentDishName}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {proposal.isRequiredItem ? "Bắt buộc" : "Tùy chọn"}
                                  {proposal.suggestedDishName &&
                                    ` • Gợi ý: ${proposal.suggestedDishName}`}
                                </p>
                                {proposal.responseDeadlineUtc && (
                                  <p className="text-[11px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                                    ⏰ Hạn phản hồi:{" "}
                                    {new Date(proposal.responseDeadlineUtc).toLocaleString(
                                      "vi-VN",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      },
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
                              style={{
                                color: statusMeta.color,
                                backgroundColor: statusMeta.bg,
                              }}
                            >
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
