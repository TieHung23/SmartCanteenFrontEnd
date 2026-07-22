"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Ban, Hourglass, ChevronLeft } from "lucide-react";
import { userService } from "@/services/user.service";
import { ROUTES } from "@/config/routes";
import {
  clearAuthTokens,
  clearBlockedAccountInfo,
  getBlockedAccountInfo,
} from "@/lib/auth-token-storage";

const STATUS_MAP: Record<number, { icon: typeof Ban; title: string; message: string }> = {
  4: {
    icon: Hourglass,
    title: "Tài khoản tạm thời bị đình chỉ",
    message:
      "Tài khoản của bạn hiện đang bị đình chỉ. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.",
  },
  5: {
    icon: Ban,
    title: "Tài khoản đã bị cấm",
    message: "Tài khoản của bạn đã bị quản trị viên cấm. Bạn không thể tiếp tục sử dụng hệ thống.",
  },
};

export default function SuspendedPage() {
  const router = useRouter();
  const [blockedInfo] = useState(() => getBlockedAccountInfo());
  const [status, setStatus] = useState<number | null>(blockedInfo?.status ?? null);
  const [userName, setUserName] = useState<string>("");
  const [reason] = useState<string>(blockedInfo?.reason || "");

  useEffect(() => {
    if (blockedInfo?.status) {
      return;
    }

    userService
      .getProfile()
      .then((profile) => {
        setStatus(profile.status);
        setUserName(profile.name || profile.email);
      })
      .catch(() => {
        clearAuthTokens();
        router.push(ROUTES.LOGIN);
      });
  }, [blockedInfo, router]);

  const info = status ? STATUS_MAP[status] : null;
  if (!info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const Icon = info.icon;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <Icon className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">{info.title}</h1>
        {userName && <p className="mb-1 text-sm text-gray-500">{userName}</p>}
        <p className="mb-8 text-gray-600">{info.message}</p>

        {reason && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-800">
            <p className="font-semibold">Lý do</p>
            <p className="mt-1">{reason}</p>
          </div>
        )}

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-8 text-left text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Cần hỗ trợ?</p>
              <p className="mt-1 text-amber-700">
                Vui lòng liên hệ quản trị viên hoặc gửi email đến{" "}
                <a href="mailto:support@smartcanteen.com" className="underline font-medium">
                  support@smartcanteen.com
                </a>{" "}
                để được giải quyết.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            clearAuthTokens();
            clearBlockedAccountInfo();
            router.push(ROUTES.LOGIN);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại trang đăng nhập
        </button>
      </div>
    </div>
  );
}
