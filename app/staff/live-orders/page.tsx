"use client";

import { useEffect, useState, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  Search,
  QrCode,
  Eye,
  Ban,
  UtensilsCrossed,
  RefreshCw,
  ChefHat,
  BellRing,
  X,
  AlertTriangle,
  Hash,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalSearch } from "@/lib/stores/use-search";

interface OrderItem {
  dishName: string;
  quantity: number;
  price: number;
}

interface LiveOrder {
  id: string;
  studentName: string;
  studentId: string;
  status: "Processing" | "ReadyForPickup" | "Completed" | "Cancelled" | "Failed";
  items: OrderItem[];
  totalPrice: number;
  note?: string;
  createdAt: string;
}

const MOCK_LIVE_ORDERS: LiveOrder[] = [
  {
    id: "ORD-240612-001",
    studentName: "Nguyễn Văn An",
    studentId: "SE170123",
    status: "Processing",
    items: [
      { dishName: "Cơm sườn nướng", quantity: 1, price: 35000 },
      { dishName: "Canh rau củ", quantity: 1, price: 10000 },
    ],
    totalPrice: 45000,
    createdAt: "2026-06-16T11:20:00Z",
  },
  {
    id: "ORD-240612-002",
    studentName: "Trần Thị Bình",
    studentId: "SE180456",
    status: "Processing",
    items: [
      { dishName: "Cá ba sa kho tộ", quantity: 1, price: 35000 },
      { dishName: "Cơm trắng", quantity: 1, price: 5000 },
      { dishName: "Dưa leo", quantity: 1, price: 5000 },
    ],
    totalPrice: 45000,
    createdAt: "2026-06-16T11:22:00Z",
  },
  {
    id: "ORD-240612-003",
    studentName: "Lê Hoàng Nam",
    studentId: "SE190789",
    status: "ReadyForPickup",
    items: [
      { dishName: "Ức gà áp chảo", quantity: 2, price: 25000 },
      { dishName: "Salad trộn", quantity: 1, price: 15000 },
    ],
    totalPrice: 65000,
    createdAt: "2026-06-16T11:15:00Z",
  },
  {
    id: "ORD-240612-004",
    studentName: "Phạm Minh Đức",
    studentId: "SE160234",
    status: "ReadyForPickup",
    items: [{ dishName: "Bún bò Huế", quantity: 1, price: 40000 }],
    totalPrice: 40000,
    createdAt: "2026-06-16T11:10:00Z",
  },
  {
    id: "ORD-240612-005",
    studentName: "Hoàng Thị Mai",
    studentId: "SE200567",
    status: "Processing",
    items: [
      { dishName: "Cơm gà xối mỡ", quantity: 1, price: 35000 },
      { dishName: "Nước ngọt", quantity: 1, price: 10000 },
    ],
    totalPrice: 45000,
    createdAt: "2026-06-16T11:25:00Z",
  },
  {
    id: "ORD-240612-006",
    studentName: "Võ Thanh Tùng",
    studentId: "SE210890",
    status: "Processing",
    items: [
      { dishName: "Mì xào bò", quantity: 1, price: 30000 },
      { dishName: "Chả giò", quantity: 2, price: 5000 },
      { dishName: "Rau muống luộc", quantity: 1, price: 8000 },
    ],
    totalPrice: 48000,
    createdAt: "2026-06-16T11:28:00Z",
  },
  {
    id: "ORD-240612-007",
    studentName: "Đặng Thị Hương",
    studentId: "SE151234",
    status: "ReadyForPickup",
    items: [{ dishName: "Phở bò tái", quantity: 1, price: 45000 }],
    totalPrice: 45000,
    createdAt: "2026-06-16T11:05:00Z",
  },
  {
    id: "ORD-240612-008",
    studentName: "Bùi Quốc Anh",
    studentId: "SE220345",
    status: "Processing",
    items: [
      { dishName: "Cơm tấm bì chả", quantity: 1, price: 35000 },
      { dishName: "Trà đá", quantity: 1, price: 5000 },
    ],
    totalPrice: 40000,
    createdAt: "2026-06-16T11:30:00Z",
  },
];

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Processing: {
    label: "Đang chế biến",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  ReadyForPickup: {
    label: "Sẵn sàng nhận",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Completed: {
    label: "Hoàn thành",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  Cancelled: {
    label: "Đã hủy",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  Failed: {
    label: "Thất bại",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function elapsedMinutes(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 60000);
}

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<LiveOrder[]>(MOCK_LIVE_ORDERS);
  const [loading, setLoading] = useState(false);
  const searchQuery = useGlobalSearch((s) => s.query);
  const setSearchQuery = useGlobalSearch((s) => s.setQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [manualQrInput, setManualQrInput] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) =>
          o.status === "Processing" && Math.random() > 0.85
            ? { ...o, status: "ReadyForPickup" as const }
            : o,
        ),
      );
      setLoading(false);
      setCountdown(10);
    }, 600);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchOrders();
          return 10;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.studentName.toLowerCase().includes(q) ||
      o.studentId.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    processing: orders.filter((o) => o.status === "Processing").length,
    ready: orders.filter((o) => o.status === "ReadyForPickup").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    failed: orders.filter((o) => o.status === "Failed").length,
  };

  const handleComplete = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "Completed" as const } : o)),
    );
    toast.success(`Đơn #${orderId.slice(0, 8)} đã hoàn thành`);
    setSelectedOrder(null);
  };

  const handleCancel = () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id ? { ...o, status: "Cancelled" as const, note: cancelReason } : o,
      ),
    );
    toast.success(`Đơn #${selectedOrder.id.slice(0, 8)} đã hủy`);
    setCancelReason("");
    setSelectedOrder(null);
  };

  const handleQrPickup = () => {
    const token = manualQrInput.trim();
    if (!token) return;
    const found = orders.find((o) => o.id.toLowerCase() === token.toLowerCase());
    if (found && found.status === "ReadyForPickup") {
      setOrders((prev) =>
        prev.map((o) => (o.id === found.id ? { ...o, status: "Completed" as const } : o)),
      );
      toast.success(`Bàn giao thành công - Đơn #${found.id.slice(0, 8)}`);
      setManualQrInput("");
    } else if (found && found.status !== "ReadyForPickup") {
      toast.error("Đơn chưa sẵn sàng để bàn giao");
    } else {
      toast.error("Không tìm thấy mã đơn");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
            <ChefHat className="w-9 h-9 text-[#FF4C24]" />
            Phục Vụ Trực Tiếp
          </h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Giám sát đơn hàng đang chế biến, bàn giao món và xử lý sự cố
          </p>
        </div>
        <div className="flex items-center gap-4 text-base">
          <span className="text-gray-400 font-medium flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Làm mới sau {countdown}s
          </span>
          <button
            onClick={fetchOrders}
            className="bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold px-5 py-2.5 rounded-xl transition shadow-xs"
          >
            Làm mới ngay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          {
            label: "Đang chế biến",
            value: stats.processing,
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: ChefHat,
          },
          {
            label: "Sẵn sàng nhận",
            value: stats.ready,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            icon: BellRing,
          },
          {
            label: "Đã hoàn thành",
            value: stats.completed,
            color: "text-blue-600",
            bg: "bg-blue-50",
            icon: CheckCircle2,
          },
          {
            label: "Thất bại",
            value: stats.failed,
            color: "text-rose-600",
            bg: "bg-rose-50",
            icon: AlertTriangle,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-5 shadow-sm"
          >
            <div
              className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}
            >
              <s.icon className={`w-7 h-7 ${s.color}`} />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên hoặc MSSV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4C24]/20 text-gray-900 font-medium"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-base bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 outline-none font-bold focus:ring-2 focus:ring-[#FF4C24]/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Processing">Đang chế biến</option>
              <option value="ReadyForPickup">Sẵn sàng nhận</option>
              <option value="Completed">Hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
              <option value="Failed">Thất bại</option>
            </select>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Quét / nhập mã QR đơn..."
                value={manualQrInput}
                onChange={(e) => setManualQrInput(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 text-base bg-amber-50/40 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 text-gray-900 font-medium"
              />
            </div>
            <button
              onClick={handleQrPickup}
              className="bg-amber-600 hover:bg-amber-700 text-white text-base font-bold px-6 py-3.5 rounded-xl transition shadow-xs shrink-0"
            >
              Xác nhận
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF4C24]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 text-center text-base text-gray-400 font-semibold">
            Không tìm thấy đơn hàng nào
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const s = STATUS_STYLES[order.status];
              const elapsed = elapsedMinutes(order.createdAt);
              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-start gap-5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF4C24]/10 to-orange-100 flex items-center justify-center shrink-0 border-2 border-white shadow-xs">
                        <span className="text-xl font-extrabold text-[#FF4C24]">
                          {order.studentName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 font-mono">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full border ${s.bg} ${s.text}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          {elapsed > 15 &&
                            order.status !== "Completed" &&
                            order.status !== "Cancelled" && (
                              <span className="text-sm font-bold text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Quá {elapsed} phút
                              </span>
                            )}
                        </div>
                        <h4 className="font-bold text-gray-900 mt-2 text-lg">
                          {order.studentName}
                        </h4>
                        <div className="flex items-center gap-4 mt-1.5 text-sm font-medium text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Hash className="w-4 h-4" />
                            {order.studentId}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4" />
                            {order.items.reduce((s, i) => s + i.quantity, 0)} món
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatTime(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {order.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-sm bg-gray-100 text-gray-600 font-medium px-3 py-1 rounded-lg"
                            >
                              {item.dishName} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 lg:flex-col lg:items-end shrink-0">
                      <span className="text-xl font-extrabold text-[#FF4C24]">
                        {order.totalPrice.toLocaleString()} P
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </button>
                        {order.status === "ReadyForPickup" && (
                          <button
                            onClick={() => handleComplete(order.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Bàn giao
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Chi Tiết Đơn Hàng</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  #{selectedOrder.id.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Thông tin khách hàng
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF4C24]/10 flex items-center justify-center text-[#FF4C24] font-bold">
                    {selectedOrder.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedOrder.studentName}</p>
                    <p className="text-sm text-gray-500 font-mono">
                      MSSV: {selectedOrder.studentId}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Món ăn trong đơn
                </h4>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{item.dishName}</p>
                          <p className="text-xs text-gray-400">
                            Đơn giá: {item.price.toLocaleString()} P
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">
                        {(item.price * item.quantity).toLocaleString()} P
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm font-bold text-gray-600">Tổng cộng</span>
                  <span className="text-lg font-black text-[#FF4C24]">
                    {selectedOrder.totalPrice.toLocaleString()} P
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3 border">
                <Clock className="w-4 h-4 text-gray-400" />
                Đặt lúc {formatTime(selectedOrder.createdAt)} ·{" "}
                {elapsedMinutes(selectedOrder.createdAt)} phút trước
              </div>

              {(selectedOrder.status === "Processing" ||
                selectedOrder.status === "ReadyForPickup") && (
                <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Nghiệp vụ quầy
                  </p>

                  {selectedOrder.status === "ReadyForPickup" && (
                    <button
                      onClick={() => handleComplete(selectedOrder.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Xác nhận bàn giao món (Hoàn thành)
                    </button>
                  )}

                  {selectedOrder.status === "Processing" && (
                    <button
                      onClick={() => handleComplete(selectedOrder.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Đánh dấu đã chế biến xong
                    </button>
                  )}

                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-red-700 text-xs font-bold">
                      <Ban className="w-3.5 h-3.5" />
                      Hủy đơn (can thiệp đặc biệt)
                    </div>
                    <textarea
                      placeholder="Nhập lý do hủy đơn (bắt buộc)..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full text-sm p-3 border border-red-200 rounded-xl outline-none bg-white font-medium resize-none"
                      rows={2}
                    />
                    <button
                      onClick={handleCancel}
                      disabled={!cancelReason.trim()}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-400 text-white font-bold text-sm py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Xác nhận hủy đơn
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
