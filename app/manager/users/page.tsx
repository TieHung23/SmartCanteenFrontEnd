"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCcw as RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import Modal from "../_components/modal";
import { cn } from "@/lib/utils";
import { managerUserService } from "@/services/manager-user.service";
import {
  AccountStatus,
  UserRole,
  type ManagerUserDetail,
  type ManagerUserFilters,
  type ManagerUserListItem,
} from "@/types/manager-user.types";

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

const ROLE_OPTIONS = [
  { value: "", label: "Tất cả vai trò" },
  { value: String(UserRole.User), label: "Sinh viên" },
  { value: String(UserRole.Lecturer), label: "Giảng viên" },
  { value: String(UserRole.Staff), label: "Nhân viên" },
  { value: String(UserRole.Manager), label: "Quản lý" },
  { value: String(UserRole.Admin), label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: String(AccountStatus.Active), label: "Đang hoạt động" },
  { value: String(AccountStatus.PendingEmailVerification), label: "Chờ xác thực email" },
  { value: String(AccountStatus.PendingIdentityVerification), label: "Chờ xác thực danh tính" },
  { value: String(AccountStatus.Suspended), label: "Tạm khóa" },
  { value: String(AccountStatus.Banned), label: "Bị cấm" },
];

const ROLE_LABELS: Record<number, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Manager]: "Quản lý",
  [UserRole.User]: "Sinh viên",
  [UserRole.Staff]: "Nhân viên",
  [UserRole.Lecturer]: "Giảng viên",
};

export function getUserRoleLabel(
  user?: {
    role?: UserRole | number | null;
    roleCategory?: number | null;
    category?: number | null;
    userCategory?: number | null;
  } | null,
): string {
  if (!user) return "Không rõ";
  const cat = user.roleCategory ?? user.category ?? user.userCategory;

  if (cat === 2 || user.role === UserRole.Lecturer || user.role === 5) {
    return "Giảng viên";
  }
  if (user.role === UserRole.Admin || user.role === 1) return "Admin";
  if (user.role === UserRole.Manager || user.role === 2) return "Quản lý";
  if (user.role === UserRole.Staff || user.role === 4) return "Nhân viên";
  if (user.role === UserRole.User || user.role === 3) return "Sinh viên";

  if (cat === 1) return "Sinh viên";
  if (cat === 3) return "Nhân viên";

  return ROLE_LABELS[user.role as number] || "Không rõ";
}

const STATUS_STYLES: Record<AccountStatus, { label: string; className: string; dot: string }> = {
  [AccountStatus.Active]: {
    label: "Đang hoạt động",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  [AccountStatus.PendingEmailVerification]: {
    label: "Chờ email",
    className: "bg-sky-50 text-sky-700 border-sky-100",
    dot: "bg-sky-500",
  },
  [AccountStatus.PendingIdentityVerification]: {
    label: "Chờ xác thực",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  [AccountStatus.Suspended]: {
    label: "Tạm khóa",
    className: "bg-orange-50 text-orange-700 border-orange-100",
    dot: "bg-orange-500",
  },
  [AccountStatus.Banned]: {
    label: "Bị cấm",
    className: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
};

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string; error?: string; reason?: string } };
    message?: string;
  };
  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.response?.data?.reason ||
    err.message ||
    "Không thể xử lý yêu cầu."
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function getPageNumbers(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES[AccountStatus.Active];
  const isActive = status === AccountStatus.Active;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider",
        style.className,
      )}
    >
      <span
        className={cn("w-2 h-2 rounded-full shrink-0", style.dot, isActive && "animate-glow-pulse")}
      />
      {style.label}
    </span>
  );
}

function UserAvatar({
  user,
}: {
  user: Pick<ManagerUserListItem, "name" | "imgUrl"> & { id?: string };
}) {
  const avatarUrl =
    user.imgUrl && user.imgUrl.trim() !== ""
      ? user.imgUrl
      : `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(user.id || user.name || "default")}`;

  return (
    <div
      aria-label={user.name}
      role="img"
      className="h-12 w-12 rounded-2xl border border-gray-100/80 bg-cover bg-center shadow-2xs shrink-0 overflow-hidden bg-slate-50"
      style={{ backgroundImage: `url("${avatarUrl}")` }}
    />
  );
}

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<ManagerUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [statCounts, setStatCounts] = useState({
    activeStudents: 0,
    staffAccounts: 0,
    lockedUsers: 0,
  });
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<ManagerUserDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const isLecturerFilter = roleFilter === String(UserRole.Lecturer) || roleFilter === "5";
      const isStudentFilter = roleFilter === String(UserRole.User) || roleFilter === "3";

      const queryParams: ManagerUserFilters = {
        pageNumber,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter ? (Number(statusFilter) as AccountStatus) : undefined,
      };

      if (isLecturerFilter) {
        queryParams.category = 2;
        queryParams.roleCategory = 2;
        queryParams.role = 3;
      } else if (isStudentFilter) {
        queryParams.category = 1;
        queryParams.roleCategory = 1;
        queryParams.role = 3;
      } else if (roleFilter) {
        queryParams.role = Number(roleFilter) as UserRole;
      }

      const result = await managerUserService.getUsers(queryParams);

      // Perform client-side filter pass if backend returns unfiltered items
      let items = result.items || [];
      if (isLecturerFilter) {
        items = items.filter((u) => u.category === 2 || u.roleCategory === 2 || u.role === 5);
      } else if (isStudentFilter) {
        items = items.filter(
          (u) =>
            (u.role === 3 || !u.role) &&
            (u.category === 1 || u.roleCategory === 1 || (!u.category && !u.roleCategory)),
        );
      }

      setUsers(items);
      setPagination({
        totalCount: result.totalCount,
        totalPages: Math.max(1, result.totalPages),
        hasPreviousPage: result.hasPreviousPage,
        hasNextPage: result.hasNextPage,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, roleFilter, search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  const fetchStats = useCallback(async () => {
    try {
      const [activeStudents, staffAccounts, suspendedUsers, bannedUsers] = await Promise.all([
        managerUserService.getUsers({
          pageNumber: 1,
          pageSize: 1,
          role: UserRole.User,
          status: AccountStatus.Active,
        }),
        managerUserService.getUsers({
          pageNumber: 1,
          pageSize: 1,
          role: UserRole.Staff,
        }),
        managerUserService.getUsers({
          pageNumber: 1,
          pageSize: 1,
          status: AccountStatus.Suspended,
        }),
        managerUserService.getUsers({
          pageNumber: 1,
          pageSize: 1,
          status: AccountStatus.Banned,
        }),
      ]);

      setStatCounts({
        activeStudents: activeStudents.totalCount,
        staffAccounts: staffAccounts.totalCount,
        lockedUsers: suspendedUsers.totalCount + bannedUsers.totalCount,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const stats = useMemo(() => {
    return [
      {
        label: "Sinh viên hoạt động",
        value: statCounts.activeStudents,
        hint: "Tài khoản đã xác thực",
        color: "from-emerald-500 to-teal-600",
        shadow: "shadow-emerald-500/25",
        cardBg: "bg-emerald-50/60",
        cardBorder: "border-emerald-100",
        icon: Users,
      },
      {
        label: "Nhân viên",
        value: statCounts.staffAccounts,
        hint: "Tài khoản nhân viên",
        color: "from-sky-500 to-blue-600",
        shadow: "shadow-sky-500/25",
        cardBg: "bg-sky-50/60",
        cardBorder: "border-sky-100",
        icon: UserCog,
      },
      {
        label: "Bị khóa / cấm",
        value: statCounts.lockedUsers,
        hint: "Tạm khóa + bị cấm",
        color: "from-rose-500 to-red-600",
        shadow: "shadow-rose-500/25",
        cardBg: "bg-rose-50/60",
        cardBorder: "border-rose-100",
        icon: Ban,
      },
    ];
  }, [statCounts]);

  const pageNumbers = useMemo(
    () => getPageNumbers(pageNumber, pagination.totalPages),
    [pageNumber, pagination.totalPages],
  );
  const firstItemIndex = pagination.totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const lastItemIndex = Math.min(pageNumber * pageSize, pagination.totalCount);

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const result = await managerUserService.getUserDetail(id);
      setDetails(result);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshDetails = async () => {
    if (!detailsId) return;
    const result = await managerUserService.getUserDetail(detailsId);
    setDetails(result);
  };

  const handleLockAction = async (user: ManagerUserListItem, action: "suspend" | "ban") => {
    const isBan = action === "ban";
    const result = await Swal.fire({
      title: isBan ? "Cấm tài khoản?" : "Tạm khóa tài khoản?",
      html: `<span style="font-size:14px;color:#666">${user.name} sẽ bị <strong>${isBan ? "cấm vĩnh viễn" : "tạm khóa"}</strong> và refresh token đang hoạt động sẽ bị thu hồi.</span>`,
      input: "textarea",
      inputLabel: "Lý do",
      inputPlaceholder: "Nhập lý do xử lý tài khoản...",
      inputValidator: (value) => (!value?.trim() ? "Vui lòng nhập lý do." : null),
      showCancelButton: true,
      confirmButtonText: isBan ? "Cấm tài khoản" : "Tạm khóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: isBan ? "#dc2626" : "#D35400",
      customClass: { popup: "rounded-3xl" },
    });

    if (!result.isConfirmed || !result.value?.trim()) return;

    try {
      if (isBan) {
        await managerUserService.banUser(user.id, result.value.trim());
      } else {
        await managerUserService.suspendUser(user.id, result.value.trim());
      }
      toast.success(isBan ? "Đã cấm tài khoản." : "Đã tạm khóa tài khoản.");
      await fetchUsers();
      await fetchStats();
      await refreshDetails();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleReactivate = async (user: ManagerUserListItem) => {
    const result = await Swal.fire({
      title: "Mở lại tài khoản?",
      html: `<span style="font-size:14px;color:#666">${user.name} sẽ được chuyển về trạng thái đang hoạt động.</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Mở lại",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#16a34a",
      customClass: { popup: "rounded-3xl" },
    });

    if (!result.isConfirmed) return;

    try {
      await managerUserService.reactivateUser(user.id);
      toast.success("Đã mở lại tài khoản.");
      await fetchUsers();
      await fetchStats();
      await refreshDetails();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D35400] to-[#E86A33] flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 animate-float">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Quản lý người dùng
            </h1>
            <p className="text-base text-gray-500 mt-0.5">
              Theo dõi tài khoản, xác thực, trạng thái khóa và các quy trình hỗ trợ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            Promise.all([fetchUsers(), fetchStats()]).finally(() => setLoading(false));
          }}
          className="p-3 border border-gray-200/60 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-xs active:scale-95 shrink-0"
          title="Làm mới"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.cardBg} rounded-2xl border ${stat.cardBorder} p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between`}
          >
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(stat.value)}</p>
              <p className="text-xs text-gray-400 font-medium">{stat.hint}</p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br text-white shadow-lg",
                stat.color,
                stat.shadow,
              )}
            >
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Workflow Cards ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {userWorkflows.map((workflow, idx) => (
          <Link
            key={workflow.href}
            href={workflow.href}
            className="group relative rounded-2xl border border-gray-100/80 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-orange-200/60 overflow-hidden card-3d animate-slide-up-3d"
            style={{ animationDelay: `${(idx + 3) * 100}ms` } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-gray-500 transition-all duration-300 group-hover:border-[#E86A33]/20 group-hover:bg-gradient-to-br group-hover:from-[#D35400]/10 group-hover:to-[#E86A33]/5 group-hover:text-[#D35400] group-hover:shadow-md group-hover:shadow-orange-500/10">
                <workflow.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-[#D35400] transition-colors">
                  {workflow.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-500">{workflow.description}</p>
              </div>
            </div>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] pointer-events-none" />
          </Link>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageNumber(1);
              }}
              placeholder="Tìm theo tên, email hoặc mã sinh viên..."
              className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
            />
          </div>
          <button
            onClick={() => fetchUsers()}
            className="px-6 py-3 bg-gray-900 text-white rounded-3xl text-sm font-bold hover:bg-gray-800 transition-all shadow-xs active:scale-98 shrink-0"
          >
            Tìm kiếm
          </button>
        </div>
        <div className="flex gap-3">
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPageNumber(1);
            }}
            className="h-11 rounded-3xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none transition-all focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15 lg:w-52 shadow-2xs"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPageNumber(1);
            }}
            className="h-11 rounded-3xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none transition-all focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15 lg:w-64 shadow-2xs"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#D35400]/20 border-t-[#D35400]" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải danh sách người dùng...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-lg font-bold text-gray-400">Không tìm thấy người dùng phù hợp.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-gray-100 bg-gray-50/70">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Người dùng
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Số dư
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Đăng nhập cuối
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="transition-all duration-200 hover:bg-orange-50/30 animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` } as React.CSSProperties}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-gray-900">{user.name}</p>
                          <p className="truncate text-xs font-semibold text-gray-500">
                            {user.email}
                          </p>
                          <p className="text-xs font-bold text-gray-400">
                            {user.studentId || user.phoneNumber || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-gray-600">
                        {getUserRoleLabel(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[#D35400]">
                      {formatCurrency(user.balanceAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetails(user.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-[#D35400]/10 hover:text-[#D35400] hover:shadow-sm"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {user.status === AccountStatus.Suspended ? (
                          <button
                            onClick={() => handleReactivate(user)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 hover:shadow-sm"
                            title="Mở lại tài khoản"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLockAction(user, "suspend")}
                            disabled={user.status === AccountStatus.Banned}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-all hover:bg-orange-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                            title="Tạm khóa tài khoản"
                          >
                            <LockKeyhole className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleLockAction(user, "ban")}
                          disabled={user.status === AccountStatus.Banned}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                          title="Cấm tài khoản"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* ── Pagination ── */}
          <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Hiển thị{" "}
              <span className="font-black text-gray-800">
                {firstItemIndex}-{lastItemIndex}
              </span>{" "}
              trong <span className="font-black text-gray-800">{pagination.totalCount}</span> người
              dùng
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                disabled={!pagination.hasPreviousPage || loading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                title="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => setPageNumber(1)}
                    className="hidden h-10 min-w-10 rounded-xl border border-gray-200 px-3 text-sm font-black text-gray-600 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] sm:inline-flex sm:items-center sm:justify-center"
                  >
                    1
                  </button>
                  <span className="hidden px-1 text-sm font-black text-gray-400 sm:inline">
                    ...
                  </span>
                </>
              )}

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setPageNumber(page)}
                  disabled={loading}
                  className={cn(
                    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-50",
                    page === pageNumber
                      ? "border-[#D35400] bg-[#D35400] text-white shadow-md shadow-orange-500/25"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400]",
                  )}
                >
                  {page}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < pagination.totalPages && (
                <>
                  <span className="hidden px-1 text-sm font-black text-gray-400 sm:inline">
                    ...
                  </span>
                  <button
                    onClick={() => setPageNumber(pagination.totalPages)}
                    className="hidden h-10 min-w-10 rounded-xl border border-gray-200 px-3 text-sm font-black text-gray-600 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] sm:inline-flex sm:items-center sm:justify-center"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPageNumber((page) => Math.min(pagination.totalPages, page + 1))}
                disabled={!pagination.hasNextPage || loading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                title="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={Boolean(detailsId)}
        onClose={() => {
          setDetailsId(null);
          setDetails(null);
        }}
        title="Chi tiết người dùng"
        size="lg"
      >
        {detailsLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D35400]/20 border-t-[#D35400]" />
          </div>
        ) : details ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar user={details} />
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{details.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={details.status} />
                    <span className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-gray-500">
                      {getUserRoleLabel(details)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {details.status === AccountStatus.Suspended ? (
                  <button
                    onClick={() => handleReactivate(details)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Mở lại
                  </button>
                ) : (
                  <button
                    onClick={() => handleLockAction(details, "suspend")}
                    disabled={details.status === AccountStatus.Banned}
                    className="inline-flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700 transition-all hover:bg-orange-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    Tạm khóa
                  </button>
                )}
                <button
                  onClick={() => handleLockAction(details, "ban")}
                  disabled={details.status === AccountStatus.Banned}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition-all hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Ban className="h-4 w-4" />
                  Cấm
                </button>
              </div>
            </div>

            {details.statusReason && (
              <div className="rounded-2xl border border-orange-200/60 bg-orange-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-orange-500">
                  Lý do xử lý
                </p>
                <p className="mt-1.5 text-sm font-semibold text-orange-800">
                  {details.statusReason}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem icon={Mail} label="Email" value={details.email} />
              <InfoItem icon={Phone} label="Số điện thoại" value={details.phoneNumber || "-"} />
              <InfoItem icon={UserCog} label="Mã sinh viên" value={details.studentId || "-"} />
              <InfoItem
                icon={BadgeCheck}
                label="Lớp / chuyên ngành"
                value={details.majorOrClass || "-"}
              />
              <InfoItem
                icon={WalletCards}
                label="Số dư"
                value={`${formatCurrency(details.balanceAmount)}đ`}
              />
              <InfoItem
                icon={CheckCircle2}
                label="Xác thực email"
                value={details.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-sm font-semibold text-gray-600 md:grid-cols-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Ngày tạo
                </p>
                <p className="mt-1 text-gray-800">{formatDate(details.createdAtUtc)}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Cập nhật cuối
                </p>
                <p className="mt-1 text-gray-800">{formatDate(details.updatedAtUtc)}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Đăng nhập cuối
                </p>
                <p className="mt-1 text-gray-800">{formatDate(details.lastLoginAt)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:shadow-sm hover:border-gray-200/80">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D35400]/5 text-[#D35400]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
