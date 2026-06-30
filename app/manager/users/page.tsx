import Link from "next/link";
import { BadgeCheck, ShieldAlert, UserCog, Users } from "lucide-react";

const userWorkflows = [
  {
    title: "Hàng đợi xác thực",
    description:
      "Xem xét các yêu cầu xác thực sinh viên đang chờ trước khi tài khoản có thể sử dụng.",
    href: "/manager/verify",
    icon: BadgeCheck,
  },
  {
    title: "Lịch sử hoàn tiền",
    description: "Kiểm tra yêu cầu hoàn tiền khi đơn hàng hoặc số dư cần xử lý.",
    href: "/manager/refunds",
    icon: ShieldAlert,
  },
];

const userStats = [
  { label: "Sinh viên đang hoạt động", value: "-", hint: "Đang chờ API danh sách người dùng" },
  { label: "Tài khoản nhân viên", value: "-", hint: "Đang chờ API quản lý vai trò" },
  { label: "Người dùng bị khóa", value: "-", hint: "Đang chờ API trạng thái tài khoản" },
];

export default function ManagerUsersPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Quản lý người dùng</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Trang quản lý người dùng cho việc xem xét tài khoản, xác thực và hỗ trợ.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
          >
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-gray-900 mt-2">{stat.value}</p>
            <p className="text-sm font-semibold text-gray-400 mt-2">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shrink-0">
            <UserCog className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">
              Mô-đun tài khoản chưa được kết nối
            </h2>
            <p className="text-base text-gray-500 max-w-3xl">
              Frontend hiện có API hồ sơ, nhưng chưa có API danh sách người dùng hoặc quản lý vai
              trò. Trang này giữ sẵn giao diện và liên kết đến các quy trình đã có.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userWorkflows.map((workflow) => (
          <Link
            key={workflow.href}
            href={workflow.href}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center border border-gray-100 group-hover:text-[#D35400] group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors shrink-0">
                <workflow.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">{workflow.title}</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{workflow.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto" />
        <p className="text-lg font-bold text-gray-400 mt-4">
          Bảng người dùng sẽ xuất hiện tại đây sau khi có endpoint quản lý người dùng.
        </p>
      </div>
    </div>
  );
}
