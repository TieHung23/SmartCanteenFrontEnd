"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { User, Lock, LogOut, CheckCircle2, Wallet, Paintbrush, Wifi } from "lucide-react";
import { userService, UserProfileResponse } from "@/services/user.service";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "wallet">("personal");
  const [selectedTheme, setSelectedTheme] = useState(cardThemes[0]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = normalizeProfile(await userService.getProfile());
        setProfile(data);
        setOriginalProfile(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!profile) return;
    if (name === "gender") {
      setProfile({ ...profile, gender: Number(value) || 1 });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = normalizeProfile(
        await userService.updateProfile({
          name: profile.name,
          phoneNumber: profile.phoneNumber,
          dateOfBirth: profile.dateOfBirth,
          address: profile.address,
          gender: profile.gender,
          studentId: profile.studentId,
          majorOrClass: profile.majorOrClass,
          imgUrl: profile.imgUrl,
        }),
      );
      setProfile(updated);
      setOriginalProfile(updated);
      alert("Cập nhật thông tin thành công! 🎉");
    } catch {
      alert("Có lỗi xảy ra khi lưu thông tin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Đảm bảo value input không bao giờ undefined
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
        Vui lòng đăng nhập để xem thông tin.
      </div>
    );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-12 px-4 sm:px-6 font-sans">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── CỘT TRÁI ─── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center">
              {/* Avatar tĩnh — upload sau */}
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

              {/* Tabs */}
              <div className="w-full mt-8 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all
                    ${activeTab === "personal" ? "bg-orange-50 text-[#D35400]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                >
                  <User className="w-5 h-5" /> Personal Information
                </button>

                <button
                  onClick={() => setActiveTab("wallet")}
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

          {/* ─── CỘT PHẢI ─── */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 min-h-[600px]">
            {/* TAB 1: PERSONAL */}
            {activeTab === "personal" && (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-extrabold text-gray-800 mb-8">Personal Information</h3>

                {/* Gender */}
                <div className="flex items-center gap-8 mb-8">
                  {[
                    { val: 1, label: "Male" },
                    { val: 2, label: "Female" },
                    { val: 3, label: "Other" },
                  ].map(({ val, label }) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="gender"
                        value={val}
                        checked={profile.gender === val}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#D35400] focus:ring-[#D35400] cursor-pointer"
                      />
                      <span className="text-sm font-bold text-gray-600 group-hover:text-[#D35400] transition-colors">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

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
                      onChange={handleInputChange}
                      placeholder="e.g. SE123456"
                      className="w-full bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white px-5 py-3.5 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
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

                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-10 border-t border-gray-100 pt-8">
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
              </div>
            )}

            {/* TAB 2: WALLET */}
            {activeTab === "wallet" && (
              <div className="animate-fadeIn flex flex-col h-full">
                <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
                  <h3 className="text-2xl font-extrabold text-gray-800">Digital Wallet</h3>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Available Balance
                    </p>
                    <p className="text-3xl font-black text-[#D35400]">
                      {new Intl.NumberFormat("vi-VN").format(profile.balanceAmount)}{" "}
                      <span className="text-lg text-orange-400">pts</span>
                    </p>
                  </div>
                </div>

                {/* Virtual Card */}
                <div className="w-full max-w-md mx-auto mb-12">
                  <div
                    className={`relative w-full aspect-[1.586] rounded-[1.5rem] p-6 md:p-8 text-white flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02] ${selectedTheme.background} ${selectedTheme.shadow}`}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-xl pointer-events-none" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="w-12 h-9 rounded bg-gradient-to-br from-yellow-100 to-yellow-500 opacity-90 shadow-inner flex flex-col justify-around py-1 px-1">
                        <div className="w-full h-[1px] bg-yellow-700/40" />
                        <div className="w-full h-[1px] bg-yellow-700/40" />
                        <div className="w-full h-[1px] bg-yellow-700/40" />
                      </div>
                      <Wifi className="w-8 h-8 opacity-70 rotate-90 drop-shadow-md" />
                    </div>

                    <div className="relative z-10 mt-6 md:mt-8">
                      <p className="font-mono text-xl md:text-2xl tracking-[0.2em] font-medium opacity-90 drop-shadow-md">
                        **** **** ****{" "}
                        {s(profile.studentId || profile.id?.substring(0, 4) || "0000")
                          .toUpperCase()
                          .slice(-4)}
                      </p>
                      <div className="flex justify-between items-end mt-4 md:mt-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">
                            Card Holder
                          </p>
                          <p className="font-bold tracking-widest uppercase truncate max-w-[200px] drop-shadow-md">
                            {profile.name}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-red-500 opacity-80 mix-blend-screen" />
                          <div className="w-8 h-8 rounded-full bg-yellow-400 opacity-80 mix-blend-screen -ml-4" />
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
                      Customize Card Theme
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
      `,
        }}
      />
    </>
  );
}
