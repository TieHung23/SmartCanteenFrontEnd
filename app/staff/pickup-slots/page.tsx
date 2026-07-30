"use client";

import { Smartphone, Download, AlertCircle, QrCode } from "lucide-react";

export default function StaffPickupSlotsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Gán Ô Nhận Hàng (Bind Pickup Slot)
        </h1>
        <p className="text-base text-gray-500 mt-1">
          Tính năng gán ô nhận hàng trực tiếp tại khay cất đồ
        </p>
      </div>

      {/* Main Announcement Card */}
      <div className="max-w-3xl mx-auto bg-gradient-to-b from-white to-orange-50/40 rounded-3xl border border-orange-200/80 p-8 md:p-12 shadow-sm text-center space-y-8 my-8">
        <div className="w-20 h-20 rounded-3xl bg-orange-100/80 text-[#D35400] flex items-center justify-center mx-auto shadow-sm border border-orange-200">
          <Smartphone className="w-10 h-10" />
        </div>

        <div className="space-y-3 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Thông Báo Nền Tảng
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            Yêu cầu sử dụng Ứng dụng Di động
          </h2>
          <p className="text-base text-gray-600 font-semibold leading-relaxed">
            Tính năng{" "}
            <span className="text-[#D35400] font-black">Gán ô nhận hàng (Bind Pickup Slot)</span>{" "}
            hiện chưa hỗ trợ trên nền tảng Web. Vui lòng tải ứng dụng trên di động để thực hiện thao
            tác quét mã và gán ô nhanh chóng.
          </p>
        </div>

        {/* QR & Download Instructions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs max-w-md mx-auto flex flex-col sm:flex-row items-center gap-6 text-left">
          <div className="w-28 h-28 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shrink-0 p-2 relative">
            <QrCode className="w-20 h-20 text-gray-800" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">Quét mã QR để tải App</h3>
            <p className="text-xs text-gray-500 font-medium">
              Tương thích với hệ điều hành Android & iOS trên thiết bị di động của Nhân viên Smart
              Canteen.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#D35400] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                <Download className="w-3.5 h-3.5" /> Smart Canteen App v2.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
