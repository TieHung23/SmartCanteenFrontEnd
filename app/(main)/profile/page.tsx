"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
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
  Loader2,
} from "lucide-react";
import { userService, UserProfileResponse } from "@/services/user.service";
import { orderService } from "@/services/order.service";
import type { OrderListItem } from "@/types/order.types";
import { paymentService, type TopUpResponse } from "@/services/payment.service";
import { toast } from "sonner";

const getRoleName = (roleId: number) => {
  switch (roleId) {
    case 1:
      return "Admin";
    case 2:
      return "Manager";
    case 3:
      return "User";
    case 4:
      return "Staff";
    default:
      return "Unknown Role";
  }
};

const getSafeImageUrl = (
  url: string | null | undefined,
  fallback = "/placeholder-user.png",
): string => {
  if (!url || url.trim() === "") return fallback;
  if (url.startsWith("/")) return url;
  try {
    new URL(url);
    return url;
  } catch {
    return fallback;
  }
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

const cardThemes = [
  {
    id: "orange",
    name: "Canteen Signature",
    background: "bg-gradient-to-br from-[#D35400] to-orange-400",
    shadow: "shadow-orange-500/40",
  },
  {
    id: "dark",
    name: "Midnight Premium",
    background: "bg-gradient-to-br from-gray-900 to-gray-700",
    shadow: "shadow-gray-900/40",
  },
  {
    id: "emerald",
    name: "Emerald Wealth",
    background: "bg-gradient-to-br from-emerald-600 to-teal-400",
    shadow: "shadow-emerald-500/40",
  },
  {
    id: "purple",
    name: "Cyberpunk Neon",
    background: "bg-gradient-to-br from-purple-600 to-pink-500",
    shadow: "shadow-purple-500/40",
  },
  {
    id: "blue",
    name: "Ocean Trust",
    background: "bg-gradient-to-br from-blue-700 to-cyan-500",
    shadow: "shadow-blue-500/40",
  },
];

const PAYMENT_METHODS = [{ id: 4, name: "Bank Transfer" }];
const COMING_SOON_METHODS = ["MoMo", "ZaloPay", "VNPay"];

type WalletTab = "overview" | "topup";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "wallet">("personal");
  const [selectedTheme, setSelectedTheme] = useState(cardThemes[0]);

  const [walletTab, setWalletTab] = useState<WalletTab>("overview");
  const [topUpAmount, setTopUpAmount] = useState(50000);
  const [topUpMethod, setTopUpMethod] = useState(4);
  const [isTopUpping, setIsTopUpping] = useState(false);
  const [topUpResult, setTopUpResult] = useState<TopUpResponse | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
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
    };
    fetchProfile();
  }, []);

  const fetchOrders = async () => {
    setIsLoadingTx(true);
    try {
      const result = await orderService.getMyOrders({ pageSize: 50 });
      setOrders(result.items || []);
    } catch (err) {
      console.error("fetchOrders error:", err);
      setOrders([]);
    } finally {
      setIsLoadingTx(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!profile) return;
    if (name === "gender") {
      setProfile({ ...profile, gender: Number(value) || 1 });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!profile || !originalProfile) return;
    setIsSaving(true);
    try {
      const response = (await userService.updateProfile({
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        gender: profile.gender,
        studentId: profile.studentId,
        majorOrClass: profile.majorOrClass,
        imgUrl: profile.imgUrl,
      })) as unknown as UserProfileResponse & { value?: UserProfileResponse };

      const updatedData = response?.value || response;
      const updated = normalizeProfile(updatedData);
      const changedFields: string[] = [];
      if (profile.name !== originalProfile.name) changedFields.push("Full Name");
      if (profile.phoneNumber !== originalProfile.phoneNumber) changedFields.push("Phone Number");
      if (profile.address !== originalProfile.address) changedFields.push("Address");
      if (profile.majorOrClass !== originalProfile.majorOrClass) changedFields.push("Major/Class");
      if (profile.gender !== originalProfile.gender) changedFields.push("Gender");
      if (profile.studentId !== originalProfile.studentId) changedFields.push("Student ID");

      const currentBirth = profile.dateOfBirth?.split("T")[0];
      const originalBirth = originalProfile.dateOfBirth?.split("T")[0];
      if (currentBirth !== originalBirth) changedFields.push("Date of Birth");

      if (changedFields.length > 0) {
        if (changedFields.length <= 2) {
          changedFields.forEach((field) => {
            toast.success(`Updated ${field} successfully!`);
          });
        } else {
          toast.success(`Profile updated: ${changedFields.join(", ")}`);
        }
      } else {
        toast.info("No changes detected.");
      }

      setProfile(updated);
      setOriginalProfile(updated);
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred while saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleTopUp = async () => {
    if (topUpAmount < 10000) {
      toast.error("Minimum top-up is 10,000 VND");
      return;
    }
    setIsTopUpping(true);
    try {
      const result = await paymentService.topUpWallet({
        amountVnd: topUpAmount,
        method: topUpMethod,
      });
      setTopUpResult(result);
      toast.success("Top-up request created! 🎉");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Top-up failed");
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
        Please log in to view your profile.
      </div>
    );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-12 px-4 sm:px-6 font-sans">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center">
              <div className="relative w-28 h-28 mb-4">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                  <Image
                    src={getSafeImageUrl(profile.imgUrl)}
                    alt="Profile Avatar"
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-gray-800 text-center">{profile.name}</h2>
              <p className="text-sm font-semibold text-gray-400 mt-1">
                {getRoleName(profile.role)}
              </p>

              <div className="w-full mt-8 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all
                    ${activeTab === "personal" ? "bg-orange-50 text-[#D35400]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                >
                  <User className="w-5 h-5" /> Personal Information
                </button>

                <button
                  onClick={() => {
                    setActiveTab("wallet");
                    fetchOrders();
                  }}
                  className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all
                    ${activeTab === "wallet" ? "bg-orange-50 text-[#D35400]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                >
                  <Wallet className="w-5 h-5" /> My Wallet &amp; Card
                </button>

                <div className="h-px w-full bg-gray-100 my-2" />

                <button className="flex items-center gap-4 w-full text-gray-500 hover:bg-gray-50 hover:text-gray-800 px-5 py-3.5 rounded-2xl font-bold text-sm transition-colors">
                  <Lock className="w-5 h-5" /> Change Password
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full text-gray-500 hover:bg-red-50 hover:text-red-500 px-5 py-3.5 rounded-2xl font-bold text-sm transition-colors mt-2"
                >
                  <LogOut className="w-5 h-5" /> Log Out
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 min-h-[600px]">
            {activeTab === "personal" && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-extrabold text-gray-800 mb-8">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Full Name
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
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={s(profile.email)}
                      readOnly
                      className="w-full bg-gray-100 border border-transparent px-5 py-3.5 rounded-xl text-sm font-bold text-gray-500 outline-none pr-28 cursor-not-allowed"
                    />
                    {profile.emailVerified && (
                      <span className="absolute bottom-3.5 right-4 flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Student ID
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
                      Major / Class
                    </label>
                    <input
                      type="text"
                      name="majorOrClass"
                      value={s(profile.majorOrClass)}
                      onChange={handleInputChange}
                      placeholder="e.g. Software Engineering"
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Phone Number
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
                      Date of Birth
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
                      Gender
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
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={s(profile.address)}
                      onChange={handleInputChange}
                      placeholder="Your current address"
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-6 border-t border-gray-100 pt-8">
                  <button
                    onClick={() => setProfile(originalProfile)}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-[#D35400] hover:bg-[#B34700] shadow-[0_4px_14px_0_rgba(211,84,0,0.39)] hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[160px] disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>

                {/* Verification Status Section */}
                <div className="mt-10 border-t border-gray-100 pt-8">
                  <h3 className="text-lg font-extrabold text-gray-800 mb-4">Trạng thái xác thực</h3>
                  <div className="space-y-4">
                    {/* Email verified */}
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

                    {/* Identity verification */}
                    <Link
                      href={ROUTES.VERIFICATION}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Định danh tài khoản</p>
                          <p className="text-xs font-medium text-amber-600">Chưa định danh</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#D35400] group-hover:underline">
                          Nộp giấy tờ
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#D35400]" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WALLET */}
            {activeTab === "wallet" && (
              <div className="animate-fadeIn">
                {/* Wallet Sub-tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-100 pb-4">
                  <button
                    onClick={() => {
                      setWalletTab("overview");
                      fetchOrders();
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      walletTab === "overview"
                        ? "bg-orange-50 text-[#D35400]"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setWalletTab("topup")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      walletTab === "topup"
                        ? "bg-orange-50 text-[#D35400]"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Top Up
                  </button>
                </div>

                {walletTab === "overview" && (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-extrabold text-gray-800">Digital Wallet</h3>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                          Available Balance
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
                              src="/logo_point.png" //
                              alt="F-Point Coin"
                              fill
                              sizes="28px"
                              className="object-contain drop-shadow-[0_2px_4px_rgba(211,84,0,0.2)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Virtual Digital Pass */}
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
                              Canteen Pass
                            </span>
                          </div>
                          <div className="text-[11px] font-black bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-md tracking-widest opacity-80 uppercase">
                            Virtual Only
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
                                Pass Holder
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

                    {/* Theme Picker */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <div className="flex items-center gap-2 mb-5">
                        <Paintbrush className="w-5 h-5 text-gray-500" />
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Customize Pass Theme
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {cardThemes.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme)}
                            className={`flex flex-col items-center gap-3 p-3 rounded-xl transition-all duration-300
                              ${
                                selectedTheme.id === theme.id
                                  ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-2 ring-[#D35400] scale-105 z-10"
                                  : "hover:bg-white hover:shadow-sm"
                              }`}
                          >
                            <div
                              className={`w-full h-10 rounded-lg ${theme.background} shadow-inner`}
                            />
                            <span className="text-[10px] font-bold text-gray-500 text-center uppercase leading-tight">
                              {theme.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transaction History */}
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Transaction History
                        </h4>
                        <button
                          onClick={fetchOrders}
                          className="text-[10px] font-bold text-[#D35400] hover:text-[#B34700] transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                      {isLoadingTx ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#D35400]" />
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-gray-500">No orders yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                          {orders.map((order) => {
                            const orderStatusLabels: Record<number, string> = {
                              0: "Pending",
                              1: "Ready for Pickup",
                              2: "Completed",
                              3: "Cancelled",
                            };
                            const orderStatusColors: Record<number, string> = {
                              0: "text-amber-600 bg-amber-50",
                              1: "text-emerald-600 bg-emerald-50",
                              2: "text-indigo-600 bg-indigo-50",
                              3: "text-red-600 bg-red-50",
                            };
                            return (
                              <div
                                key={order.id}
                                className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-800">Order Payment</p>
                                    <p className="text-[10px] text-gray-400">
                                      {new Date(order.createdAtUtc).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      · {order.itemCount} item{order.itemCount > 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-red-500">
                                    -{new Intl.NumberFormat("vi-VN").format(order.totalPrice)} pts
                                  </p>
                                  <span
                                    className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${
                                      orderStatusColors[order.status] || "text-gray-500 bg-gray-100"
                                    }`}
                                  >
                                    {orderStatusLabels[order.status] || "Unknown"}
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
                        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 text-center shadow-xs">
                          <CheckCircle2 className="w-12 h-12 text-[#D35400] mx-auto mb-3" />
                          <p className="text-lg font-bold text-[#B34700]">Top-up Created!</p>
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
                            Status: {topUpResult.status}
                          </p>
                        </div>

                        {/* ─── QR CODE ─── */}
                        {topUpResult.payUrl && (
                          <div className="mt-4 p-6 bg-white border border-gray-100 rounded-[1.5rem] flex flex-col items-center gap-4 shadow-sm">
                            <p className="text-lg font-black text-gray-400 uppercase tracking-wider">
                              Scan QR Code to Pay
                            </p>
                            <div className="relative w-90 h-90 border border-gray-100 rounded-2xl overflow-hidden p-3 bg-white shadow-xs transition-transform duration-300 hover:scale-102">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={topUpResult.payUrl}
                                alt="Payment QR Code"
                                className="w-full h-full object-contain p-1"
                              />
                            </div>
                          </div>
                        )}

                        {topUpResult.paymentContent && (
                          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                              Noi dung chuyen khoan
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(topUpResult.paymentContent);
                                toast.success("Da copy noi dung chuyen khoan!");
                              }}
                              className="text-sm font-black text-[#D35400] tracking-wider bg-white px-4 py-3 rounded-lg border border-gray-100 hover:bg-orange-50 transition-colors w-full"
                            >
                              {topUpResult.paymentContent}
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setTopUpResult(null);
                            setTopUpAmount(50000);
                          }}
                          className="w-full py-4 bg-white text-gray-500 font-extrabold text-base rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors mt-2"
                        >
                          Make Another Top-up
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Amount (VND)
                          </label>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                              <button
                                key={amt}
                                onClick={() => setTopUpAmount(amt)}
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
                            type="number"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(Number(e.target.value) || 0)}
                            min={10000}
                            step={10000}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            You will receive approximately{" "}
                            {new Intl.NumberFormat("vi-VN").format(Math.floor(topUpAmount / 1000))}{" "}
                            points
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                            Payment Method
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
                                className="p-4 rounded-xl text-sm font-bold border border-dashed border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed relative overflow-hidden"
                              >
                                {name}
                                <span className="absolute -top-1 -right-3 bg-gray-200 text-gray-400 text-[7px] font-black uppercase px-2 py-0.5 -rotate-[16deg]">
                                  Soon
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleTopUp}
                          disabled={isTopUpping || topUpAmount < 10000}
                          className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isTopUpping ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Top Up{" "}
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
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .hover\:scale-102:hover { transform: scale(1.02); }
      `,
        }}
      />
    </>
  );
}
