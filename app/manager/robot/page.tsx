import Link from "next/link";
import { Cpu, PackageCheck, Radio, Utensils } from "lucide-react";

const robotLanes = [
  { label: "Làn nhận A", status: "Sẵn sàng", icon: PackageCheck },
  { label: "Làn nhận B", status: "Chờ", icon: PackageCheck },
  { label: "Khu vực chờ", status: "Đang giám sát", icon: Utensils },
];

const robotSteps = [
  "Đơn hàng đã thanh toán có thể tạo công việc phục vụ qua robot.",
  "API hiện tại hỗ trợ tạo công việc nhưng chưa có danh sách quản lý.",
  "Trang này giữ sẵn giao diện robot cho đến khi kết nối dữ liệu thực tế.",
];

export default function ManagerRobotPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Vị trí Robot</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Giám sát làn phục vụ và trạng thái sẵn sàng của robot.
          </p>
        </div>
        <Link
          href="/manager/sessions"
          className="shrink-0 inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#D35400] text-white rounded-2xl font-black text-base hover:bg-[#b84900] transition-all shadow-md active:scale-95"
        >
          <Utensils className="w-5 h-5" />
          Xem ca phục vụ
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {robotLanes.map((lane) => (
          <div
            key={lane.label}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  {lane.label}
                </p>
                <p className="text-xl font-black text-gray-900 mt-2">{lane.status}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shrink-0">
                <lane.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Dữ liệu từ xa robot đang chờ</h2>
            <p className="text-base text-gray-500 mt-2 max-w-3xl">
              Mô-đun robot hiện tại hỗ trợ tạo công việc phục vụ cho đơn hàng. Nguồn cấp dữ liệu
              trực tiếp có thể được thêm vào đây khi backend cung cấp các điểm cuối về hàng đợi,
              khay hoặc trạng thái robot.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Radio className="w-5 h-5 text-[#D35400]" />
          <h3 className="text-xl font-black text-gray-900">Danh sách kiểm tra tích hợp</h3>
        </div>
        <div className="space-y-4">
          {robotSteps.map((step, index) => (
            <div key={step} className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-black shrink-0">
                {index + 1}
              </span>
              <p className="text-base font-medium text-gray-600">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
