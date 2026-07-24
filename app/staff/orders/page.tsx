"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Loader2,
  Clock,
  CheckCircle2,
  Search,
  QrCode,
  Eye,
  ShoppingBag,
  Truck,
  Ban,
  DollarSign,
  BellRing,
} from "lucide-react";
import { orderService } from "@/services/order.service";
import { pickupService } from "@/services/pickup.service";
import { robotService } from "@/services/robot.service";
import { sessionService } from "@/services/session.service";
import { useToast } from "@/lib/hooks/use-toast";
import { useGlobalSearch } from "@/lib/stores/use-search";
import type { OrderStatus } from "@/types/order.types";

interface OrderItem {
  dishName?: string;
  quantity?: number;
  price?: number;
}

interface StaffOrder {
  id?: string;
  Id?: string;
  userName?: string;
  UserName?: string;
  studentId?: string;
  StudentId?: string;
  status?: number;
  Status?: number;
  totalPrice?: number;
  TotalPrice?: number;
  items?: OrderItem[];
  Items?: OrderItem[];
}

const STATUS_MAP: Record<number, { label: string; icon: typeof Clock; className: string }> = {
  0: { label: "Chờ xử lý", icon: Clock, className: "text-amber-600 bg-amber-50 border-amber-200" },
  1: { label: "Sẵn sàng nhận", icon: Truck, className: "text-blue-600 bg-blue-50 border-blue-200" },
  2: {
    label: "Đã hoàn thành",
    icon: CheckCircle2,
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  3: { label: "Đã hủy đơn", icon: Ban, className: "text-red-600 bg-red-50 border-red-200" },
};

export default function StaffOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "all">("all");

  const searchQuery = useGlobalSearch((s) => s.query);
  const setSearchQuery = useGlobalSearch((s) => s.setQuery);
  const [selectedOrder, setSelectedOrder] = useState<StaffOrder | null>(null);
  const [manualQrToken, setManualQrToken] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const fetchOrders = async () => {
      try {
        const statusFilter = filter !== "all" ? (filter as OrderStatus) : undefined;

        const data = await orderService.getAll({
          pageSize: 100,
          pageNumber: 1,
          ...(statusFilter !== undefined ? { status: statusFilter } : {}),
        });
        let items = (data?.items || []) as unknown as StaffOrder[];

        if (items.length === 0) {
          const activeSessions = await sessionService.getSessions({ pageSize: 10 });
          const currentSession =
            activeSessions.items.find(
              (s) => s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date()),
            ) || activeSessions.items[0];
          if (currentSession) {
            const sessionData = await orderService.getManagerOrdersBySession(currentSession.id, {
              pageSize: 100,
              pageNumber: 1,
              ...(statusFilter !== undefined ? { status: statusFilter } : {}),
            });
            items = (sessionData?.items || []) as unknown as StaffOrder[];
          }
        }

        setOrders(items);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filter]);

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const id = (order.id || order.Id || "").toLowerCase();
    const studentId = (order.studentId || order.StudentId || "").toLowerCase();
    const userName = (order.userName || order.UserName || "").toLowerCase();

    return id.includes(query) || studentId.includes(query) || userName.includes(query);
  });

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => (o.status ?? o.Status) === 2).length;
    const canceled = orders.filter((o) => (o.status ?? o.Status) === 3).length;
    const revenue = orders
      .filter((o) => (o.status ?? o.Status) === 2)
      .reduce((sum, o) => sum + (o.totalPrice || o.TotalPrice || 0), 0);

    return { total, delivered, canceled, revenue };
  }, [orders]);

  const refetchOrders = async () => {
    try {
      const statusFilter = filter !== "all" ? (filter as OrderStatus) : undefined;
      const data = await orderService.getAll({
        pageSize: 100,
        pageNumber: 1,
        ...(statusFilter !== undefined ? { status: statusFilter } : {}),
      });
      let items = (data?.items || []) as unknown as StaffOrder[];

      if (items.length === 0) {
        const activeSessions = await sessionService.getSessions({ pageSize: 10 });
        const currentSession =
          activeSessions.items.find(
            (s) => s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date()),
          ) || activeSessions.items[0];
        if (currentSession) {
          const sessionData = await orderService.getManagerOrdersBySession(currentSession.id, {
            pageSize: 100,
            pageNumber: 1,
            ...(statusFilter !== undefined ? { status: statusFilter } : {}),
          });
          items = (sessionData?.items || []) as unknown as StaffOrder[];
        }
      }

      setOrders(items);
    } catch {
      setOrders([]);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: number) => {
    try {
      if (status === 2) {
        await orderService.confirmReceived(orderId);
      } else {
        await orderService.updateOrderStatus(orderId, status);
      }
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái đơn hàng.",
      });
      setSelectedOrder(null);
      refetchOrders();
    } catch {
      toast({
        title: "Thất bại",
        description: "Không thể cập nhật trạng thái đơn hàng.",
      });
    }
  };

  const handleVerifyQrManually = async () => {
    if (!manualQrToken.trim()) return;
    try {
      const orderId = manualQrToken.trim();
      await orderService.confirmReceived(orderId);
      toast({
        title: "Bàn giao thành công",
        description: "Đơn hàng đã được chuyển sang trạng thái Hoàn thành.",
      });
      setManualQrToken("");
      refetchOrders();
    } catch {
      toast({
        title: "Thất bại",
        description: "Mã đơn không hợp lệ hoặc lỗi kết nối.",
      });
    }
  };

  const handleCancelOrderOverride = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    try {
      const orderId = selectedOrder.id || selectedOrder.Id;
      if (!orderId) return;
      await orderService.updateOrderStatus(orderId, 3, cancelReason);

      toast({ title: "Đã hủy đơn", description: "Đơn hàng đã được hủy thành công." });
      setSelectedOrder(null);
      setCancelReason("");
      refetchOrders();
    } catch {
      toast({ title: "Lỗi", description: "Không thể can thiệp hủy đơn." });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header tiêu đề */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Quản Lý Đơn Hàng</h1>
        <p className="text-lg text-gray-500 mt-1.5">Theo dõi, xử lý đơn hàng và bàn giao món ăn</p>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tổng đơn</div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-gray-900">{stats.total}</span>
            <span className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4C24]">
              <ShoppingBag className="w-6 h-6" />
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Đã giao</div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-gray-900">{stats.delivered}</span>
            <span className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Truck className="w-6 h-6" />
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Đã hủy</div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-gray-900">{stats.canceled}</span>
            <span className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Ban className="w-6 h-6" />
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Doanh thu</div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-extrabold text-gray-900">
              {stats.revenue.toLocaleString()} P
            </span>
            <span className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-6 h-6" />
            </span>
          </div>
        </div>
      </div>

      {/* ── THANH BỘ LỌC VÀ XÁC NHẬN QR ── */}
      <div className="bg-white p-6 border border-gray-200 rounded-2xl grid grid-cols-1 lg:grid-cols-4 gap-5 items-center shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo MSSV, Tên hoặc Mã đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-5 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4C24]/20 text-gray-900 font-medium"
          />
        </div>

        <div>
          <select
            value={String(filter)}
            onChange={(e) => setFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full text-base bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 outline-none font-bold focus:ring-2 focus:ring-[#FF4C24]/20"
          >
            <option value="all">📍 Tất cả trạng thái</option>
            <option value="0">⏳ Chờ xử lý (Pending)</option>
            <option value="1">📦 Sẵn sàng nhận (Ready)</option>
            <option value="2">✅ Đã giao (Completed)</option>
            <option value="3">❌ Đã hủy (Cancelled)</option>
          </select>
        </div>

        <div className="lg:col-span-2 flex gap-3">
          <div className="relative flex-1">
            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nhập ID đơn / mã QR để bàn giao món..."
              value={manualQrToken}
              onChange={(e) => setManualQrToken(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 text-base bg-amber-50/40 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 text-gray-900 font-medium"
            />
          </div>
          <button
            onClick={handleVerifyQrManually}
            className="bg-amber-600 hover:bg-amber-700 text-white text-base font-bold px-6 py-3.5 rounded-xl transition shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </div>

      {/* ── TẦNG 3: HIỂN THỊ HÌNH KHỐI ROW-BLOCK ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#FF4C24]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center text-sm text-gray-400 font-bold shadow-2xs">
            Không tìm thấy dữ liệu đơn hàng nào trùng khớp.
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const currentId = order.id || order.Id || `temp-${idx}`;
            const currentStatus = order.status ?? order.Status ?? 0;
            const currentUserName = order.userName || order.UserName || "Ẩn danh";
            const currentStudentId = order.studentId || order.StudentId || "N/A";
            const currentItems: OrderItem[] = order.items || order.Items || [];
            const currentTotalPrice = order.totalPrice || order.TotalPrice || 0;

            const s = STATUS_MAP[currentStatus] || STATUS_MAP[0];

            return (
              <div
                key={currentId}
                className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 flex items-center justify-center border-2 border-white shadow-xs shrink-0 text-2xl font-extrabold text-gray-700 select-none">
                    {currentUserName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 font-mono">
                        #{currentId.slice(0, 8)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-lg border ${s.className}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-lg text-gray-900 truncate">
                      {currentUserName}
                    </h4>
                    <p className="text-sm font-medium text-gray-500">
                      MSSV: {currentStudentId} · {currentItems.length} món
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 border-t md:border-none pt-4 md:pt-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider text-left md:text-right">
                      Tổng điểm
                    </div>
                    <div className="text-xl font-extrabold text-[#FF4C24] mt-1 flex items-center justify-start md:justify-end gap-1">
                      <span>{currentTotalPrice.toLocaleString()}</span>
                      <Image
                        src="/logo_point.png"
                        alt="coin"
                        width={14}
                        height={14}
                        className="object-contain inline-block"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStatus === 0 && (
                      <button
                        onClick={() => handleUpdateStatus(currentId, 1)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        Sẵn sàng nhận
                      </button>
                    )}
                    {(currentStatus === 1 || currentStatus === 0) && (
                      <button
                        onClick={() => handleUpdateStatus(currentId, 2)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Thu món (Hoàn thành)
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition shadow-xs"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── TẦNG 4: MODAL POPUP XỬ LÝ CHI TIẾT ĐƠN ── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gray-900 text-[#FF4C24] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base tracking-tight text-white">
                  Chi Tiết Đơn Hàng #{(selectedOrder.id || selectedOrder.Id)?.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5 border">
                <p className="font-bold text-gray-500 text-xs uppercase tracking-wider">
                  Thông tin khách hàng
                </p>
                <p className="font-black text-gray-800 text-base mt-1">
                  {selectedOrder.userName || selectedOrder.UserName || "N/A"}
                </p>
                <p className="font-semibold text-gray-400 font-mono text-xs">
                  Mã sinh viên: {selectedOrder.studentId || selectedOrder.StudentId || "N/A"}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                  Thực đơn suất ăn
                </h4>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white shadow-2xs">
                  {(selectedOrder.items || selectedOrder.Items || []).map((item, idx: number) => (
                    <div key={idx} className="p-3.5 flex justify-between text-sm items-center">
                      <div>
                        <p className="font-bold text-gray-800">{item.dishName || "Món ăn"}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          Số lượng: {item.quantity || 0}
                        </p>
                      </div>
                      <span className="font-black text-gray-900 flex items-center gap-1">
                        <span>{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                        <Image
                          src="/logo_point.png"
                          alt="coin"
                          width={12}
                          height={12}
                          className="object-contain inline-block"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {(selectedOrder.status ?? selectedOrder.Status ?? 0) < 2 && (
                <div className="border-t border-dashed border-gray-200 pt-4 space-y-4">
                  <h4 className="text-xs font-black text-amber-600 uppercase tracking-wider">
                    Nghiệp vụ quầy điều hành
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const orderId = selectedOrder.id || selectedOrder.Id;
                        if (orderId) handleUpdateStatus(orderId, 1);
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <BellRing className="w-4 h-4" />
                      Sẵn sàng nhận (Bước 1)
                    </button>

                    <button
                      onClick={() => {
                        const orderId = selectedOrder.id || selectedOrder.Id;
                        if (orderId) handleUpdateStatus(orderId, 2);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Thu món (Bước 2)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={async () => {
                        try {
                          const orderId = selectedOrder.id || selectedOrder.Id;
                          if (!orderId) return;
                          await pickupService.assign({ orderId });
                          toast({
                            title: "Đã gán pickup",
                            description: "Pickup slot đã được gán cho đơn hàng.",
                          });
                          refetchOrders();
                        } catch {
                          const orderId = selectedOrder.id || selectedOrder.Id;
                          if (orderId) handleUpdateStatus(orderId, 1);
                        }
                      }}
                      className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs py-2.5 rounded-xl transition uppercase tracking-wider"
                    >
                      Gán Pickup Slot
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const orderId = selectedOrder.id || selectedOrder.Id;
                          if (!orderId) return;
                          await robotService.createServingJob({ orderId });
                          toast({
                            title: "Đã tạo robot job",
                            description: "Robot sẽ bắt đầu phục vụ đơn hàng.",
                          });
                          refetchOrders();
                        } catch {
                          const orderId = selectedOrder.id || selectedOrder.Id;
                          if (orderId) handleUpdateStatus(orderId, 1);
                        }
                      }}
                      className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs py-2.5 rounded-xl transition uppercase tracking-wider"
                    >
                      Tạo Robot Serving
                    </button>
                  </div>

                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-3">
                    <textarea
                      placeholder="Lý do hủy đơn hàng (Bắt buộc)..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full text-xs p-3 border border-red-200 rounded-xl outline-none bg-white font-medium"
                      rows={2}
                    />
                    <button
                      onClick={handleCancelOrderOverride}
                      disabled={!cancelReason.trim()}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-400 text-white font-black text-xs py-3 rounded-xl transition uppercase tracking-wider shadow-2xs"
                    >
                      Xác Nhận Can Thiệp Hủy Đơn
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
