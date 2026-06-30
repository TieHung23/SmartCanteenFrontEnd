"use client";

import { BarChart3, Users, DollarSign, Receipt } from "lucide-react";

export default function ManagerDashboard() {
  const kpis = [
    {
      title: "Tổng đơn hàng",
      value: "25.1k",
      color: "text-blue-600",
      icon: Receipt,
      bg: "bg-blue-50",
    },
    {
      title: "Tổng lợi nhuận",
      value: "$2,435k",
      color: "text-emerald-600",
      icon: DollarSign,
      bg: "bg-emerald-50",
    },
    {
      title: "Khiếu nại nhận được",
      value: "3.5M",
      color: "text-rose-600",
      icon: BarChart3,
      bg: "bg-rose-50",
    },
    {
      title: "Khách hàng mới",
      value: "43.5k",
      color: "text-orange-600",
      icon: Users,
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Bảng điều khiển</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Tổng quan báo cáo doanh thu, phản hồi từ khách hàng và hiệu suất bán hàng.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((item, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                {item.title}
              </p>
              <p className={`text-3xl font-black ${item.color} tracking-tight`}>{item.value}</p>
            </div>
            <div
              className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}
            >
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Simulation Area */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-gray-200 transition-colors">
        <h3 className="text-2xl font-black text-gray-900 mb-6">Tổng quan báo cáo doanh thu</h3>
        <div className="h-80 bg-gray-50 rounded-3xl flex flex-col items-center justify-center border border-dashed border-gray-200">
          <p className="text-gray-500 font-bold text-lg">Biểu đồ phân tích doanh thu & báo cáo</p>
          <p className="text-gray-400 text-sm mt-1">Dữ liệu mô phỏng trực quan hóa hệ thống</p>
        </div>
      </div>
    </div>
  );
}
