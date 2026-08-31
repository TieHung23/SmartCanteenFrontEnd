"use client";
import { isAxiosError } from "axios";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";
import { ROUTES } from "@/config/routes";
import {
  User,
  Lock,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Wallet,
  Paintbrush,
  Plus,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Camera,
  History,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { userService, UserProfileResponse } from "@/services/user.service";
import {
  paymentService,
  type TopUpResponse,
  type WalletTransaction,
} from "@/services/payment.service";
import { authService } from "@/services/auth.service";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { useCurrency } from "@/lib/hooks/use-currency";
import { useSignalr } from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";

import { getSafeUserAvatar } from "@/lib/utils";
import { verificationService } from "@/services/verification.service";
import type { VerificationStatusType } from "@/types/verification.types";

const getRoleName = (roleId: number, categoryId?: number) => {
  if (categoryId === 1) return "Sinh viên";
  if (categoryId === 2) return "Giảng viên";
  if (categoryId === 3) return "Nhân viên";
  if (categoryId === 4) return "Khách";

  switch (roleId) {
    case 1:
      return "Quản trị viên";
    case 2:
      return "Quản lý";
    case 3:
      return "Sinh viên";
    case 4:
      return "Nhân viên";
    default:
      return "Người dùng";
  }
};

const getSafeImageUrl = (url: string | null | undefined, identifier?: string | null): string => {
  return getSafeUserAvatar(url, identifier);
};

const normalizeProfile = (data: UserProfileResponse): UserProfileResponse => ({
  ...data,
  name: data.name ?? "",
  email: data.email ?? "",
  phoneNumber: data.phoneNumber ?? "",
  dateOfBirth: data.dateOfBirth ?? "",
  address: data.address ?? "",
  studentId: data.studentId ?? "",
  majorOrClass: data.majorOrClass ?? "",
  gender: data.gender ?? 1,
  balanceAmount: data.balanceAmount ?? 0,
  imgUrl: data.imgUrl ?? null,
});

const CARD_THEME_KEY = "sc_virtual_card_theme";

const cardThemes = [
  {
    id: "orange",
    name: "Canteen Signature",
    background: "bg-gradient-to-br from-orange-400 via-amber-300 to-orange-200",
    shadow: "shadow-orange-300/40",
  },
  {
    id: "dark",
    name: "Midnight Obsidian",
    background: "bg-gradient-to-br from-slate-700 via-gray-600 to-zinc-500",
    shadow: "shadow-gray-400/30",
  },
  {
    id: "blue",
    name: "Royal Sapphire",
    background: "bg-gradient-to-br from-indigo-400 via-blue-300 to-sky-200",
    shadow: "shadow-indigo-300/40",
  },
  {
    id: "emerald",
    name: "Emerald Wealth",
    background: "bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-200",
    shadow: "shadow-emerald-300/40",
  },
  {
    id: "purple",
    name: "Cyberpunk Neon",
    background: "bg-gradient-to-br from-purple-400 via-pink-300 to-rose-200",
    shadow: "shadow-purple-300/40",
  },
  {
    id: "rosegold",
    name: "Rose Gold Prestige",
    background: "bg-gradient-to-br from-rose-300 via-pink-200 to-amber-100",
    shadow: "shadow-rose-300/40",
  },
  {
    id: "aurora",
    name: "Cosmic Aurora",
    background: "bg-gradient-to-br from-violet-400 via-indigo-300 to-fuchsia-200",
    shadow: "shadow-violet-300/40",
  },
  {
    id: "gold",
    name: "Gold Sovereign",
    background: "bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-100",
    shadow: "shadow-amber-300/40",
  },
  {
    id: "ocean",
    name: "Ocean Deep",
    background: "bg-gradient-to-br from-cyan-400 via-sky-300 to-teal-200",
    shadow: "shadow-cyan-300/40",
  },
  {
    id: "lava",
    name: "Crimson Lava",
    background: "bg-gradient-to-br from-rose-400 via-red-300 to-orange-200",
    shadow: "shadow-rose-300/40",
  },
  {
    id: "platinum",
    name: "Platinum Silver",
    background: "bg-gradient-to-br from-slate-300 via-slate-200 to-zinc-200",
    shadow: "shadow-slate-300/40",
  },
  {
    id: "nordic",
    name: "Nordic Forest",
    background: "bg-gradient-to-br from-emerald-500 via-teal-400 to-green-300",
    shadow: "shadow-emerald-400/30",
  },
];

const PAYMENT_METHODS = [{ id: 4, name: "Chuyển khoản ngân hàng" }];
const COMING_SOON_METHODS = ["MoMo", "ZaloPay", "VNPay"];

type WalletTab = "overview" | "topup";
type ProfileTab = "personal" | "wallet" | "security";

export default function ProfilePage() {
  const { logout } = useAuth();
  const { convertVndToPoints, vndPerPoint, pointName, currency, minTopUpAmount, maxTopUpAmount } =
    useCurrency();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<(typeof cardThemes)[0]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CARD_THEME_KEY);
        if (saved) {
          const found = cardThemes.find((t) => t.id === saved);
          if (found) return found;
        }
      } catch {}
    }
    return cardThemes[0];
  });

  const handleSelectTheme = (theme: (typeof cardThemes)[0]) => {
    setSelectedTheme(theme);
    try {
      localStorage.setItem(CARD_THEME_KEY, theme.id);
      toast.success(`Đã lưu giao diện thẻ "${theme.name}"! ✨`);
    } catch (error) {
      console.error("Failed to save card theme:", error);
    }
  };

  const [walletTab, setWalletTab] = useState<WalletTab>("overview");
  const [topUpAmountStr, setTopUpAmountStr] = useState("50000");
  const topUpAmount = Number(topUpAmountStr) || 0;
  const [topUpMethod, setTopUpMethod] = useState(4);
  const [isTopUpping, setIsTopUpping] = useState(false);
  const [topUpResult, setTopUpResult] = useState<TopUpResponse | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusType | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      const res = await verificationService.getMyVerification();
      if (res) {
        setVerificationStatus(res.status);
      }
    } catch (error) {
      console.error("Failed to fetch verification status:", error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = (await userService.getProfile()) as unknown as UserProfileResponse & {
        value?: UserProfileResponse;
      };
      const profileData = response?.value || response;
      const balance = profileData?.balanceAmount ?? 0;
      const data = normalizeProfile(profileData);
      setProfile({ ...data, balanceAmount: Number(balance) });
      setOriginalProfile({ ...data, balanceAmount: Number(balance) });
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  }, []);

  const fetchWalletTransactions = useCallback(async () => {
    setIsLoadingTx(true);
    try {
      const result = await paymentService.getWalletTransactions({ pageSize: 20 });
      setWalletTransactions(result.items || []);
    } catch (error) {
      console.error("Failed to fetch wallet transactions:", error);
    } finally {
      setIsLoadingTx(false);
    }
  }, []);

  useSignalr(
    useCallback(
      (notification: NotificationItem) => {
        refreshProfile();
        fetchWalletTransactions();
        fetchVerificationStatus();
        if (notification.type === "Payment.Completed") {
          toast.success("Nạp tiền thành công! Số dư đã được cập nhật.");
          setTopUpResult(null);
        }
      },
      [refreshProfile, fetchWalletTransactions, fetchVerificationStatus],
    ),
  );

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const initProfile = async () => {
      try {
        const response = (await userService.getProfile()) as unknown as UserProfileResponse & {
          value?: UserProfileResponse;
        };
        const profileData = response?.value || response;
        const balance = profileData?.balanceAmount ?? 0;
        const data = normalizeProfile(profileData);
        setProfile({ ...data, balanceAmount: Number(balance) });
        setOriginalProfile({ ...data, balanceAmount: Number(balance) });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
      await fetchVerificationStatus();
    };
    initProfile();
  }, [fetchVerificationStatus]);

  useEffect(() => {
    if (activeTab === "wallet") {
      const timer = setTimeout(() => {
        fetchWalletTransactions();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchWalletTransactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!profile) return;
    if (name === "gender") {
      setProfile({ ...profile, gender: Number(value) || 1 });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Show preview immediately for instant visual feedback
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);
    setIsSaving(true);

    try {
      // Send the current name (required by backend validation) along with the image file,
      // and omit optional fields (like phone/dob) to avoid format validation errors on them.
      await userService.updateProfile({
        name: profile.name,
        imageFile: file,
      });

      const refreshed = await userService.getProfile();
      const updated = normalizeProfile(refreshed);
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success("Cập nhật ảnh đại diện thành công!");

      setSelectedFile(null);
      setPreviewUrl(null);
      setProfile(updated);
      setOriginalProfile(updated);
    } catch (error) {
      console.error(error);
      setPreviewUrl(null); // Reset preview on failure
      if (isAxiosError(error) && error.response?.data) {
        const data = error.response.data as {
          message?: string;
          errors?: Record<string, string[]>;
          title?: string;
        };
        if (data.errors) {
          const errorMsg = Object.values(data.errors).flat().join(" ");
          toast.error(errorMsg || data.title || "Lỗi tải ảnh lên");
        } else {
          toast.error(data.message || "Lỗi tải ảnh lên");
        }
      } else {
        toast.error("Không thể tải ảnh đại diện lên.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !originalProfile) return;
    setIsSaving(true);
    try {
      await userService.updateProfile({
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        gender: profile.gender,
        studentId: profile.studentId,
        majorOrClass: profile.majorOrClass,
        imageFile: selectedFile,
      });

      const refreshed = await userService.getProfile();
      const updated = normalizeProfile(refreshed);
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success("Cập nhật thông tin thành công!");

      setSelectedFile(null);
      setPreviewUrl(null);
      setProfile(updated);
      setOriginalProfile(updated);
    } catch (error) {
      console.error(error);
      if (isAxiosError(error) && error.response?.data) {
        const data = error.response.data as {
          message?: string;
          errors?: Record<string, string[]>;
          title?: string;
        };
        if (data.errors) {
          const errorMsg = Object.values(data.errors).flat().join(" ");
          toast.error(errorMsg || data.title || "Lỗi cập nhật thông tin");
        } else {
          toast.error(data.message || "Lỗi cập nhật thông tin");
        }
      } else {
        toast.error("Đã xảy ra lỗi khi lưu thông tin cá nhân.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsSaving(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success("Đổi mật khẩu thành công! 🎉");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string } };
      };
      const serverErrors = axiosErr.response?.data?.errors;
      if (serverErrors && serverErrors.NewPassword) {
        serverErrors.NewPassword.forEach((msg: string) => toast.error(msg));
      } else {
        toast.error(axiosErr.response?.data?.message || "Đổi mật khẩu thất bại.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleTopUp = async () => {
    if (topUpAmount < minTopUpAmount) {
      toast.error(`Nạp tối thiểu ${new Intl.NumberFormat("vi-VN").format(minTopUpAmount)} VND`);
      return;
    }
    if (topUpAmount > maxTopUpAmount) {
      toast.error(`Nạp tối đa ${new Intl.NumberFormat("vi-VN").format(maxTopUpAmount)} VND`);
      return;
    }
    setIsTopUpping(true);
    try {
      const result = await paymentService.topUpWallet({
        amountVnd: topUpAmount,
        method: topUpMethod,
      });
      setTopUpResult(result);
      try {
        const { saveLocalTopup } = await import("@/app/(main)/wallet/transactions/page");
        saveLocalTopup({
          id: `topup_${result.paymentId}`,
          type: "topup",
          label: "Nạp tiền",
          amount: result.amountVnd,
          date: new Date().toISOString(),
        });
      } catch {}
      toast.success("Tạo yêu cầu nạp tiền thành công! 🎉");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Nạp tiền thất bại");
    } finally {
      setIsTopUpping(false);
    }
  };

  const s = (v: string | null | undefined) => v ?? "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
      </div>
    );
  }

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-sans">
        Vui lòng đăng nhập để xem thông tin cá nhân.
      </div>
    );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-12 px-4 sm:px-6 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center">
              <div
                className="relative w-28 h-28 mb-4 group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                  <Image
                    src={previewUrl || getSafeImageUrl(profile.imgUrl, profile.id || profile.name)}
                    alt="Profile Avatar"
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-extrabold text-gray-800 text-center">{profile.name}</h2>
              <p className="text-sm font-semibold text-gray-400 mt-1">
                {getRoleName(profile.role, profile.category)}
              </p>

              <div className="w-full mt-8 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all
                    ${activeTab === "personal" ? "bg-orange-50 text-[#D35400]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                >
                  <User className="w-5 h-5" /> Thông tin cá nhân
                </button>

                <button
                  onClick={() => {
                    setActiveTab("wallet");
                    fetchWalletTransactions();
                  }}
                  className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all
                    ${activeTab === "wallet" ? "bg-orange-50 text-[#D35400]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                >
                  <Wallet className="w-5 h-5" /> Ví &amp; Thẻ của tôi
                </button>

                <div className="h-px w-full bg-gray-100 my-2" />

                <button
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all
                    ${activeTab === "security" ? "bg-orange-50 text-[#D35400]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                >
                  <Lock className="w-5 h-5" /> Đổi mật khẩu
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full text-gray-500 hover:bg-red-50 hover:text-red-500 px-5 py-3.5 rounded-2xl font-bold text-sm transition-colors mt-2"
                >
                  <LogOut className="w-5 h-5" /> Đăng xuất
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 min-h-[600px]">
            {activeTab === "personal" && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-extrabold text-gray-800 mb-8">Thông tin cá nhân</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={s(profile.name)}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all focus:shadow-[0_0_0_4px_rgba(211,84,0,0.05)]"
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2 relative">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      value={s(profile.email)}
                      readOnly
                      className="w-full bg-gray-100 border border-transparent px-5 py-3.5 rounded-xl text-sm font-bold text-gray-500 outline-none pr-28 cursor-not-allowed"
                    />
                    {profile.emailVerified && (
                      <span className="absolute bottom-3.5 right-4 flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                      </span>
                    )}
                  </div>

                  {profile.category !== 2 && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Mã số sinh viên
                        </label>
                        <input
                          type="text"
                          name="studentId"
                          value={s(profile.studentId)}
                          disabled
                          className="w-full bg-gray-100 border border-gray-200 px-5 py-3.5 rounded-xl text-sm font-bold text-gray-400 cursor-not-allowed outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Chuyên ngành / Lớp
                        </label>
                        <input
                          type="text"
                          name="majorOrClass"
                          value={s(profile.majorOrClass)}
                          onChange={handleInputChange}
                          placeholder="VD: Công nghệ phần mềm"
                          className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={s(profile.phoneNumber)}
                      onChange={handleInputChange}
                      placeholder="09xx xxx xxx"
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={s(profile.dateOfBirth?.split("T")[0])}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-600 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2 bg-transparent">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={profile?.gender ?? 1}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat"
                    >
                      <option value={1}>♂ Nam</option>
                      <option value={2}>♀ Nữ</option>
                      <option value={3}>⚤ Khác</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={s(profile.address)}
                      onChange={handleInputChange}
                      placeholder="Địa chỉ hiện tại của bạn"
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-6 border-t border-gray-100 pt-8">
                  <button
                    onClick={() => {
                      setProfile(originalProfile);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all"
                  >
                    Hủy thay đổi
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-[#D35400] hover:bg-[#B34700] shadow-[0_4px_14px_0_rgba(211,84,0,0.39)] hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[160px] disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </button>
                </div>

                <div className="mt-10 border-t border-gray-100 pt-8">
                  <h3 className="text-lg font-extrabold text-gray-800 mb-4">Trạng thái xác thực</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            profile.emailVerified ? "bg-emerald-100" : "bg-red-100"
                          }`}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              profile.emailVerified ? "text-emerald-600" : "text-red-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Xác thực Email</p>
                          <p
                            className={`text-xs font-medium ${
                              profile.emailVerified ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {profile.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
                          </p>
                        </div>
                      </div>
                      {!profile.emailVerified && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                          Bắt buộc
                        </span>
                      )}
                    </div>

                    {(() => {
                      const isIdentityVerified =
                        verificationStatus === 2 ||
                        (profile?.status === 1 &&
                          verificationStatus !== 1 &&
                          verificationStatus !== 3);
                      const isPendingVerification = verificationStatus === 1;
                      const isRejectedVerification = verificationStatus === 3;

                      return (
                        <Link
                          href={ROUTES.VERIFICATION}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isIdentityVerified
                                  ? "bg-emerald-100"
                                  : isPendingVerification
                                    ? "bg-blue-100"
                                    : isRejectedVerification
                                      ? "bg-red-100"
                                      : "bg-amber-100"
                              }`}
                            >
                              <ShieldCheck
                                className={`w-4 h-4 ${
                                  isIdentityVerified
                                    ? "text-emerald-600"
                                    : isPendingVerification
                                      ? "text-blue-600"
                                      : isRejectedVerification
                                        ? "text-red-500"
                                        : "text-amber-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">Định danh tài khoản</p>
                              <p
                                className={`text-xs font-medium ${
                                  isIdentityVerified
                                    ? "text-emerald-600"
                                    : isPendingVerification
                                      ? "text-blue-600"
                                      : isRejectedVerification
                                        ? "text-red-500"
                                        : "text-amber-600"
                                }`}
                              >
                                {isIdentityVerified
                                  ? "Đã định danh"
                                  : isPendingVerification
                                    ? "Đang chờ duyệt"
                                    : isRejectedVerification
                                      ? "Bị từ chối"
                                      : "Chưa định danh"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                isIdentityVerified
                                  ? "text-emerald-600"
                                  : "text-[#D35400] group-hover:underline"
                              }`}
                            >
                              {isIdentityVerified
                                ? "Đã xác thực"
                                : isPendingVerification
                                  ? "Xem tiến độ"
                                  : isRejectedVerification
                                    ? "Nộp lại giấy tờ"
                                    : "Nộp giấy tờ"}
                            </span>
                            {isIdentityVerified ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#D35400]" />
                            )}
                          </div>
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="animate-fadeIn">
                <div className="flex gap-2 mb-6 border-b border-gray-100 pb-4">
                  <button
                    onClick={() => {
                      setWalletTab("overview");
                      fetchWalletTransactions();
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      walletTab === "overview"
                        ? "bg-orange-50 text-[#D35400]"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Tổng quan
                  </button>
                  <button
                    onClick={() => setWalletTab("topup")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      walletTab === "topup"
                        ? "bg-orange-50 text-[#D35400]"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Nạp tiền
                  </button>
                </div>

                {walletTab === "overview" && (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-extrabold text-gray-800">Ví điện tử</h3>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                          Số dư khả dụng
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <p className="text-3xl font-black text-[#D35400]">
                            {new Intl.NumberFormat("vi-VN").format(profile.balanceAmount)}
                          </p>
                          <div
                            className="relative w-7 h-7 select-none animate-bounce"
                            style={{ animationDuration: "3s" }}
                          >
                            <Image
                              src="/logo_point.png"
                              alt="F-Point Coin"
                              fill
                              sizes="28px"
                              className="object-contain drop-shadow-[0_2px_4px_rgba(211,84,0,0.2)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-md mx-auto mb-12">
                      <div
                        className={`relative w-full aspect-[1.586] rounded-[2rem] p-6 md:p-8 text-white flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02] ${selectedTheme.background} ${selectedTheme.shadow}`}
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-black opacity-15 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex justify-between items-center relative z-10">
                          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                            <Wallet className="w-5 h-5 text-white" />
                            <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                              Thẻ Canteen
                            </span>
                          </div>
                          <div className="text-[11px] font-black bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-md tracking-widest opacity-80 uppercase">
                            Thẻ ảo
                          </div>
                        </div>

                        <div className="relative z-10 mt-4">
                          <p className="font-mono text-lg md:text-xl tracking-[0.15em] font-black uppercase opacity-90 drop-shadow-md bg-white/10 backdrop-blur-xs py-1.5 px-4 rounded-xl inline-block border border-white/10 shadow-inner">
                            {profile.studentId && profile.studentId.trim() !== ""
                              ? profile.studentId.toUpperCase()
                              : "STUDENT PASS"}
                          </p>

                          <div className="flex justify-between items-end mt-4">
                            <div>
                              <p className="text-[9px] uppercase tracking-widest opacity-60 font-bold mb-0.5">
                                Chủ thẻ
                              </p>
                              <p className="font-bold tracking-widest uppercase truncate max-w-[220px] drop-shadow-md text-sm md:text-base">
                                {profile.name}
                              </p>
                            </div>
                            <div className="relative w-9 h-9 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 p-1.5 flex items-center justify-center">
                              <div className="relative w-full h-full opacity-95">
                                <Image
                                  src="/logo_point.png"
                                  alt="Watermark Logo"
                                  fill
                                  sizes="60px"
                                  className="object-contain filter brightness-110"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Card Theme Picker Dropdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition-all duration-300">
                      <button
                        type="button"
                        onClick={() => setIsThemePickerOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#D35400] flex items-center justify-center shrink-0">
                            <Paintbrush className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">
                              Tùy chỉnh giao diện thẻ ({cardThemes.length} mẫu)
                            </h4>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                              Đang dùng:{" "}
                              <strong className="text-[#D35400] font-bold">
                                {selectedTheme.name}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-lg ${selectedTheme.background} shadow-xs border border-white/50 shrink-0`}
                            title={selectedTheme.name}
                          />
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            {isThemePickerOpen ? (
                              <ChevronUp className="w-4 h-4 text-gray-700" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-700" />
                            )}
                          </div>
                        </div>
                      </button>

                      {isThemePickerOpen && (
                        <div className="p-5 pt-3 border-t border-gray-100 bg-gray-50/50">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {cardThemes.map((theme) => {
                              const isSelected = selectedTheme.id === theme.id;
                              return (
                                <button
                                  key={theme.id}
                                  onClick={() => handleSelectTheme(theme)}
                                  className={`group relative flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 border cursor-pointer ${
                                    isSelected
                                      ? "bg-white border-[#D35400] ring-2 ring-[#D35400]/20 shadow-md scale-[1.03] z-10"
                                      : "bg-white/60 border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-sm"
                                  }`}
                                >
                                  <div
                                    className={`relative w-full h-11 rounded-xl ${theme.background} shadow-inner overflow-hidden flex items-center justify-center`}
                                  >
                                    {isSelected && (
                                      <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold text-center leading-tight truncate w-full ${
                                      isSelected
                                        ? "text-[#D35400]"
                                        : "text-gray-600 group-hover:text-gray-900"
                                    }`}
                                  >
                                    {theme.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Giao dịch gần đây
                        </h4>
                        <Link
                          href={ROUTES.WALLET_TRANSACTIONS}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#D35400] hover:text-[#B34700] transition-colors"
                        >
                          <History className="w-3 h-3" /> Xem tất cả giao dịch
                        </Link>
                      </div>
                      {isLoadingTx ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#D35400]" />
                        </div>
                      ) : walletTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-gray-500">Chưa có giao dịch nào</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                          {walletTransactions.map((tx) => {
                            const isTopUp =
                              tx.transactionType === 1 || tx.transactionTypeName === "TopUp";
                            const isRefund =
                              tx.transactionType === 3 || tx.transactionTypeName === "Refund";
                            const isOrder =
                              tx.transactionType === 2 || tx.transactionTypeName === "OrderPayment";
                            const isInflow = isTopUp || isRefund || tx.amount > 0;

                            let title = tx.transactionTypeName || "Giao dịch ví";
                            if (isTopUp) title = "Nạp tiền vào ví";
                            else if (isRefund) title = "Hoàn tiền đơn hàng";
                            else if (isOrder) title = "Thanh toán đơn hàng";

                            return (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100/80"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                      isTopUp
                                        ? "bg-green-100 text-green-600"
                                        : isRefund
                                          ? "bg-emerald-100 text-emerald-600"
                                          : "bg-red-100 text-red-500"
                                    }`}
                                  >
                                    {isInflow ? (
                                      <ArrowDownLeft className="w-4 h-4" />
                                    ) : (
                                      <ArrowUpRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-800">{title}</p>
                                    <p className="text-[10px] text-gray-400">
                                      {new Date(tx.createdAtUtc).toLocaleDateString("vi-VN", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      {tx.balanceAfter !== undefined && (
                                        <span>
                                          {" "}
                                          · Số dư:{" "}
                                          {new Intl.NumberFormat("vi-VN").format(tx.balanceAfter)}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`text-sm font-black flex items-center justify-end gap-1 ${
                                      isInflow ? "text-emerald-600" : "text-red-500"
                                    }`}
                                  >
                                    <span>
                                      {isInflow ? "+" : "-"}
                                      {new Intl.NumberFormat("vi-VN").format(Math.abs(tx.amount))}
                                    </span>
                                    <Image
                                      src="/logo_point.png"
                                      alt="pts"
                                      width={14}
                                      height={14}
                                      className="object-contain inline-block"
                                    />
                                  </p>
                                  <span
                                    className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${
                                      isTopUp
                                        ? "text-green-700 bg-green-50"
                                        : isRefund
                                          ? "text-emerald-700 bg-emerald-50"
                                          : "text-red-700 bg-red-50"
                                    }`}
                                  >
                                    {isTopUp ? "Nạp tiền" : isRefund ? "Hoàn tiền" : "Thanh toán"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {walletTab === "topup" && (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2">Top Up Wallet</h3>
                    <p className="text-sm text-gray-400 mb-8">
                      Add points to your wallet to pay for meals.
                    </p>

                    {topUpResult ? (
                      <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center shadow-xs">
                          <CheckCircle2 className="w-12 h-12 text-[#D35400] mx-auto mb-3" />
                          <p className="text-lg font-bold text-[#B34700]">
                            Tạo nạp tiền thành công!
                          </p>
                          {topUpResult.gatewayOrderId && (
                            <p className="text-[10px] text-gray-400 mt-1 font-mono">
                              Mã GD: {topUpResult.gatewayOrderId}
                            </p>
                          )}
                          <p className="text-xl text-orange-500 font-bold flex items-center justify-center gap-1.5 flex-wrap">
                            <span>
                              {new Intl.NumberFormat("vi-VN").format(topUpResult.amountVnd)} VND
                            </span>
                            <span className="text-gray-400 mx-0.5">→</span>
                            <span>
                              {new Intl.NumberFormat("vi-VN").format(topUpResult.convertedPoints)}
                            </span>
                            <Image
                              src="/logo_point.png"
                              alt="pts"
                              width={16}
                              height={16}
                              className="object-contain inline-block align-middle"
                            />
                          </p>
                          <p className="text-xs text-gray-400 mt-2 font-medium">
                            Trạng thái: {topUpResult.status}
                          </p>
                        </div>

                        {topUpResult.payUrl && (
                          <div className="mt-4 p-6 bg-white border border-gray-100 rounded-[1.5rem] flex flex-col items-center gap-4 shadow-sm">
                            <p className="text-lg font-black text-gray-400 uppercase tracking-wider">
                              Quét mã QR để thanh toán
                            </p>
                            <div className="relative w-[360px] h-[360px] border border-gray-100 rounded-2xl overflow-hidden p-3 bg-white shadow-xs transition-transform duration-300 hover:scale-102">
                              <Image
                                src={topUpResult.payUrl}
                                alt="Payment QR Code"
                                fill
                                unoptimized
                                sizes="360px"
                                className="object-contain p-1"
                              />
                            </div>
                          </div>
                        )}

                        {topUpResult.paymentContent && (
                          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                              Nội dung chuyển khoản
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(topUpResult.paymentContent || "");
                                toast.success("Đã copy nội dung chuyển khoản!");
                              }}
                              className="text-sm font-black text-[#D35400] font-mono tracking-wider bg-white px-4 py-3 rounded-lg border border-gray-100 hover:bg-orange-50 transition-colors w-full break-all select-all flex items-center justify-center gap-2 group"
                              title="Bấm để sao chép"
                            >
                              <span>{topUpResult.paymentContent}</span>
                              <Copy className="w-4 h-4 shrink-0 text-[#D35400] group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setTopUpResult(null);
                            setTopUpAmountStr("50000");
                          }}
                          className="w-full py-4 bg-white text-gray-500 font-extrabold text-base rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors mt-2"
                        >
                          Nạp thêm
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Số tiền (VND)
                          </label>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                              <button
                                key={amt}
                                onClick={() => setTopUpAmountStr(String(amt))}
                                className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                  topUpAmount === amt
                                    ? "bg-orange-50 border-orange-300 text-[#D35400]"
                                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                                }`}
                              >
                                {new Intl.NumberFormat("vi-VN").format(amt)}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={topUpAmountStr}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9]/g, "");
                              if (val.length > 1 && val.startsWith("0")) {
                                val = val.replace(/^0+/, "") || "0";
                              }
                              setTopUpAmountStr(val);
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            Bạn sẽ nhận được khoảng{" "}
                            {new Intl.NumberFormat("vi-VN").format(convertVndToPoints(topUpAmount))}{" "}
                            {pointName} (1 {pointName} ={" "}
                            {new Intl.NumberFormat("vi-VN").format(vndPerPoint)} {currency})
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                            Phương thức thanh toán
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {PAYMENT_METHODS.map((pm) => (
                              <button
                                key={pm.id}
                                onClick={() => setTopUpMethod(pm.id)}
                                className={`p-4 rounded-xl text-sm font-bold transition-all border ${
                                  topUpMethod === pm.id
                                    ? "bg-orange-50 border-orange-300 text-[#D35400]"
                                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                                }`}
                              >
                                {pm.name}
                              </button>
                            ))}
                            {COMING_SOON_METHODS.map((name) => (
                              <button
                                key={name}
                                disabled
                                className="p-4 rounded-xl text-sm font-bold border border-dashed border-gray-200 bg-gray-50/70 text-gray-400 cursor-not-allowed relative overflow-hidden flex items-center justify-between"
                              >
                                <span>{name}</span>
                                <span className="bg-amber-100/80 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-amber-200/60 shadow-2xs">
                                  Sắp ra mắt
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleTopUp}
                          disabled={
                            isTopUpping ||
                            topUpAmount < minTopUpAmount ||
                            topUpAmount > maxTopUpAmount
                          }
                          className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isTopUpping ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Nạp tiền{" "}
                              {new Intl.NumberFormat("vi-VN").format(topUpAmount)} VND
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-extrabold text-gray-800 mb-8">Cài đặt bảo mật</h3>
                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Mật khẩu hiện tại
                    </label>
                    <PasswordInput
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      inputClassName="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Mật khẩu mới
                    </label>
                    <PasswordInput
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      inputClassName="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Xác nhận mật khẩu
                    </label>
                    <PasswordInput
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      inputClassName="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-[#D35400] hover:bg-[#B34700] shadow-[0_4px_14px_0_rgba(211,84,0,0.39)] transition-all disabled:opacity-70 flex items-center justify-center min-w-[160px]"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Cập nhật mật khẩu"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `,
        }}
      />
    </>
  );
}
