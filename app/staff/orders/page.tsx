"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { orderService } from "@/services/order.service";
import { useToast } from "@/lib/hooks/use-toast";

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

const MOCK_ORDERS = [
  {
    id: "1123",
    Id: "1123",
    userName: "Marian Det",
    UserName: "Marian Det",
    studentId: "SE180120",
    StudentId: "SE180120",
    status: 2,
    Status: 2,
    totalPrice: 40,
    TotalPrice: 40,
    items: [{ dishName: "Com Suon Nuong", quantity: 1, price: 40 }],
  },
  {
    id: "1130",
    Id: "1130",
    userName: "Ly Det",
    UserName: "Ly Det",
    studentId: "SE180450",
    StudentId: "SE180450",
    status: 2,
    Status: 2,
    totalPrice: 40,
    TotalPrice: 40,
    items: [{ dishName: "Cá ba sa kho tộ", quantity: 1, price: 40 }],
  },
  {
    id: "1124",
    Id: "1124",
    userName: "Dom",
    UserName: "Dom",
    studentId: "SE180990",
    StudentId: "SE180990",
    status: 0,
    Status: 0,
    totalPrice: 40,
    TotalPrice: 40,
    items: [{ dishName: "Ức gà áp chảo", quantity: 1, price: 40 }],
  },
  {
    id: "1125",
    Id: "1125",
    userName: "Yumnh",
    UserName: "Yumnh",
    studentId: "SE170110",
    StudentId: "SE170110",
    status: 0,
    Status: 0,
    totalPrice: 40,
    TotalPrice: 40,
    items: [{ dishName: "Com Trung Chien", quantity: 1, price: 40 }],
  },
  {
    id: "1126",
    Id: "1126",
    userName: "Mony",
    UserName: "Mony",
    studentId: "SE181122",
    StudentId: "SE181122",
    status: 0,
    Status: 0,
    totalPrice: 40,
    TotalPrice: 40,
    items: [{ dishName: "Bún tươi", quantity: 1, price: 40 }],
  },
  {
    id: "1127",
    Id: "1127",
    userName: "Leng",
    UserName: "Leng",
    studentId: "SE160999",
    StudentId: "SE160999",
    status: 0,
    Status: 0,
    totalPrice: 40,
    TotalPrice: 40,
    items: [{ dishName: "Com Ga Xoi Mo", quantity: 1, price: 40 }],
  },
];

export default function StaffOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "all">("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<StaffOrder | null>(null);
  const [manualQrToken, setManualQrToken] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const params: Record<string, unknown> = { pageNumber: 1, pageSize: 100 };
    if (filter !== "all") params.status = filter;

    orderService
      .getMyOrders(params)
      .then((data) => {
        const response = data as {
          items?: StaffOrder[];
          Items?: StaffOrder[];
          value?: { items?: StaffOrder[] };
        };
        let extractedOrders: StaffOrder[] = [];
        if (response && Array.isArray(response.items)) extractedOrders = response.items;
        else if (
          response &&
          Array.isArray((response as Record<string, unknown>).Items as StaffOrder[])
        )
          extractedOrders = (response as Record<string, unknown>).Items as StaffOrder[];
        else if (Array.isArray(response)) extractedOrders = response;
        else if (response && response.value && Array.isArray(response.value.items))
          extractedOrders = response.value.items;

        setOrders(extractedOrders.length > 0 ? extractedOrders : MOCK_ORDERS);
      })
      .catch(() => {
        setOrders(MOCK_ORDERS);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const id = (order?.id || order?.Id || "").toLowerCase();
    const studentId = (order?.studentId || order?.StudentId || "").toLowerCase();
    const userName = (order?.userName || order?.UserName || "").toLowerCase();

    return id.includes(query) || studentId.includes(query) || userName.includes(query);
  });

  // Tính toán các con số Thống kê đầu bảng (KPI Cards)
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => (o.status ?? o.Status) === 2).length;
    const canceled = orders.filter((o) => (o.status ?? o.Status) === 3).length;
    const revenue = orders
      .filter((o) => (o.status ?? o.Status) === 2)
      .reduce((sum, o) => sum + (o.totalPrice || o.TotalPrice || 0), 0);

    return { total, delivered, canceled, revenue };
  }, [orders]);

  const refetchOrders = () => {
    const params: Record<string, unknown> = { pageNumber: 1, pageSize: 100 };
    if (filter !== "all") params.status = filter;
    orderService
      .getMyOrders(params)
      .then((data) => {
        const response = data as {
          items?: StaffOrder[];
          Items?: StaffOrder[];
          value?: { items?: StaffOrder[] };
        };
        let extractedOrders: StaffOrder[] = [];
        if (response && Array.isArray(response.items)) extractedOrders = response.items;
        else if (
          response &&
          Array.isArray((response as Record<string, unknown>).Items as StaffOrder[])
        )
          extractedOrders = (response as Record<string, unknown>).Items as StaffOrder[];
        else if (Array.isArray(response)) extractedOrders = response;
        else if (response && response.value && Array.isArray(response.value.items))
          extractedOrders = response.value.items;
        setOrders(extractedOrders.length > 0 ? extractedOrders : MOCK_ORDERS);
      })
      .catch(() => {});
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
        variant: "destructive",
      });
    }
  };

  const handleCancelOrderOverride = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    try {
      const orderId = selectedOrder.id || selectedOrder.Id;
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/Orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "X-Api-Version": "1.0",
        },
        body: JSON.stringify({ status: 3, note: cancelReason }),
      });

      toast({ title: "Đã hủy đơn", description: "Đơn hàng đã được hủy thành công." });
      setSelectedOrder(null);
      setCancelReason("");
      refetchOrders();
    } catch {
      toast({ title: "Lỗi", description: "Không thể can thiệp hủy đơn.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header tiêu đề */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Xin chào Staff. Chào mừng quay trở lại quầy điều hành Smart Canteen!
        </p>
      </div>

      {/* ── TẦNG 1: THÊM KPI CARDS CHUẨN ĐẸP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Total Orders
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-gray-900">{stats.total}</span>
            <span className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4C24]">
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Total Delivered
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-gray-900">{stats.delivered}</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Truck className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Total Canceled
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-gray-900">{stats.canceled}</span>
            <span className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Ban className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Total Revenue
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-black text-gray-900">
              {stats.revenue.toLocaleString()} P
            </span>
            <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
        </div>
      </div>

      {/* ── TẦNG 2: THANH BỘ LỌC VÀ THANH XÁC NHẬN QR ── */}
      <div className="bg-white p-4 border border-gray-200 rounded-2xl grid grid-cols-1 lg:grid-cols-4 gap-4 items-center shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo MSSV, Tên hoặc Mã đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4C24]/20 text-gray-900 font-medium"
          />
        </div>

        <div>
          <select
            value={String(filter)}
            onChange={(e) => setFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none font-bold focus:ring-2 focus:ring-[#FF4C24]/20"
          >
            <option value="all">📍 Tất cả trạng thái</option>
            <option value="0">⏳ Chờ xử lý (Pending)</option>
            <option value="1">📦 Sẵn sàng nhận món (Ready)</option>
            <option value="2">✅ Đã giao món (Completed)</option>
            <option value="3">❌ Đã hủy (Cancelled)</option>
          </select>
        </div>

        <div className="lg:col-span-2 flex gap-3">
          <div className="relative flex-1">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nhập ID đơn / mã QR để bàn giao món..."
              value={manualQrToken}
              onChange={(e) => setManualQrToken(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-amber-50/40 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 text-gray-900 font-medium"
            />
          </div>
          <button
            onClick={handleVerifyQrManually}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-xs"
          >
            Xác nhận Món
          </button>
        </div>
      </div>

      {/* ── TẦNG 3: HIỂN THỊ HÌNH KHỐI ROW-BLOCK CAO CẤP Y HỆT ẢNH MẪU ── */}
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
            const currentId = order?.id || order?.Id || `temp-${idx}`;
            const currentStatus = order?.status ?? order?.Status ?? 0;
            const currentUserName = order?.userName || order?.UserName || "Ẩn danh";
            const currentStudentId = order?.studentId || order?.StudentId || "N/A";
            const currentItems: OrderItem[] = order?.items || order?.Items || [];
            const currentTotalPrice = order?.totalPrice || order?.TotalPrice || 0;

            const s = STATUS_MAP[currentStatus] || STATUS_MAP[0];

            return (
              <div
                key={currentId}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition-shadow duration-200"
              >
                {/* Khối bên trái: Ảnh đại diện tròn + Tên sinh viên */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 flex items-center justify-center border-2 border-white shadow-xs shrink-0 text-xl font-black text-gray-700 select-none">
                    {currentUserName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 font-mono">
                        Order Id : #{currentId.slice(0, 6)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${s.className}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <h4 className="font-black text-base text-gray-900 truncate">
                      {currentUserName}
                    </h4>
                    <p className="text-xs font-bold text-gray-400 font-mono">
                      MSSV: {currentStudentId} · {currentItems.length} món ăn trong khay
                    </p>
                  </div>
                </div>

                {/* Khối bên phải: Giá Tiền Point + Nút Details */}
                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left md:text-right">
                      Total Point
                    </div>
                    <div className="text-lg font-black text-gray-900 mt-0.5 text-[#FF4C24]">
                      {currentTotalPrice.toLocaleString()} P
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-black text-xs px-4 py-2.5 rounded-xl transition shadow-2xs"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                    Details
                  </button>
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
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base tracking-tight">
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
                        <p className="font-bold text-gray-800">
                          {item.dishName || item.DishName || "Món ăn"}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          Số lượng: {item.quantity || item.Quantity}
                        </p>
                      </div>
                      <span className="font-black text-gray-900">
                        {(item.price || item.Price || 0) * (item.quantity || item.Quantity || 1)} P
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

                  {(selectedOrder.status ?? selectedOrder.Status) === 1 && (
                    <button
                      onClick={async () => {
                        try {
                          await orderService.confirmReceived(selectedOrder.id || selectedOrder.Id);
                          toast({
                            title: "Thành công",
                            description: "Đơn hàng đã được hoàn thành.",
                          });
                          setSelectedOrder(null);
                          refetchOrders();
                        } catch {
                          toast({
                            title: "Lỗi",
                            description: "Không thể cập nhật đơn.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition shadow-xs uppercase tracking-wider"
                    >
                      Bàn giao suất ăn (Hoàn thành)
                    </button>
                  )}

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
