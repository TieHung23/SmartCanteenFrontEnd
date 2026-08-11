"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { User, Mail, ShieldCheck, Loader2, Save, Camera, Lock, KeyRound } from "lucide-react";
import { userService, type UpdateProfilePayload } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { cn, getSafeUserAvatar } from "@/lib/utils";

export default function StaffProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [profile, setProfile] = useState({
    id: "",
    email: "",
    name: "",
    role: "Staff",
    phoneNumber: "",
    gender: 1,
    address: "",
    dateOfBirth: "",
    majorOrClass: "",
    studentId: "",
  });

  useEffect(() => {
    userService
      .getProfile()
      .then((data) => {
        if (data) {
          let roleName = "Nhân Viên";
          if (data.role === 1) roleName = "Quản Trị Viên";
          else if (data.role === 2) roleName = "Quản Lý";
          else if (data.role === 3) roleName = "Khách Hàng";

          setProfile({
            id: data.id || "",
            email: data.email || "",
            name: data.name || "",
            role: roleName,
            phoneNumber: data.phoneNumber || "",
            gender: data.gender || 1,
            address: data.address || "",
            dateOfBirth: data.dateOfBirth || "",
            majorOrClass: data.majorOrClass || "",
            studentId: data.studentId || "",
          });

          if (data.imgUrl) {
            setPreviewUrl(data.imgUrl);
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy profile:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB.");
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: UpdateProfilePayload = {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        gender: profile.gender,
        address: profile.address,
        majorOrClass: profile.majorOrClass,
        studentId: profile.studentId,
        dateOfBirth: profile.dateOfBirth || undefined,
        imageFile: avatarFile,
      };

      await userService.updateProfile(payload);
      toast.success("Cập nhật thông tin thành công!");
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error) {
      toast.error("Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.");
      console.error("Lỗi Update Profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success("Đổi mật khẩu thành công!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string } };
      };
      const serverErrors = axiosErr.response?.data?.errors;
      if (serverErrors?.NewPassword) {
        serverErrors.NewPassword.forEach((msg: string) => toast.error(msg));
      } else {
        toast.error(axiosErr.response?.data?.message || "Đổi mật khẩu thất bại.");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#D35400]" />
        <p className="text-base font-bold text-gray-500">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* ── HEADER BLOCK ── */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Hồ Sơ Cá Nhân</h1>
        <p className="text-base text-gray-500 mt-1">
          Quản lý thông tin tài khoản và bảo mật mật khẩu hệ thống
        </p>
      </div>

      {/* ── USER BANNER CARD ── */}
      {(() => {
        const avatarSrc = getSafeUserAvatar(previewUrl, profile?.id || profile?.name);
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-xs flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow-xs relative">
                <Image src={avatarSrc} alt="Avatar" fill className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0 space-y-1">
              <h2 className="text-2xl font-black text-gray-900 truncate">
                {profile?.name || "Nhân viên Canteen"}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  <ShieldCheck className="w-4 h-4" />
                  {profile?.role || "Staff"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  <Mail className="w-3.5 h-3.5" />
                  {profile?.email || "Chưa cập nhật email"}
                </span>
                {avatarFile && (
                  <span className="inline-flex items-center text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full">
                    Ảnh đại diện chưa lưu
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TAB SWITCHER BAR ── */}
      <div className="flex bg-gray-100/80 border border-gray-200/80 p-1.5 rounded-3xl">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={cn(
            "flex-1 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5",
            activeTab === "info"
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/80"
              : "text-gray-500 hover:text-gray-800",
          )}
        >
          <User
            className={cn("w-4.5 h-4.5", activeTab === "info" ? "text-[#D35400]" : "text-gray-400")}
          />
          <span>Thông tin cá nhân</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={cn(
            "flex-1 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5",
            activeTab === "password"
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/80"
              : "text-gray-500 hover:text-gray-800",
          )}
        >
          <Lock
            className={cn(
              "w-4.5 h-4.5",
              activeTab === "password" ? "text-[#D35400]" : "text-gray-400",
            )}
          />
          <span>Đổi mật khẩu</span>
        </button>
      </div>

      {/* ── TAB 1: THÔNG TIN CÁ NHÂN ── */}
      {activeTab === "info" && (
        <form
          onSubmit={handleUpdateProfile}
          className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8 shadow-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="h-14 w-full pl-14 pr-5 text-base font-semibold bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                Họ và Tên
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                placeholder="Nhập số điện thoại liên hệ..."
                className="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                Ngày sinh
              </label>
              <input
                type="date"
                value={profile.dateOfBirth?.split("T")[0] || ""}
                onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                className="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                Giới tính
              </label>
              <select
                value={profile.gender ?? 1}
                onChange={(e) => setProfile({ ...profile, gender: Number(e.target.value) || 1 })}
                className="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
              >
                <option value={1}>♂ Nam</option>
                <option value={2}>♀ Nữ</option>
                <option value={3}>Khác</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                Địa chỉ liên hệ
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Nhập địa chỉ..."
                className="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-3 bg-[#D35400] hover:bg-[#b84900] disabled:bg-gray-300 text-white font-black text-base px-8 h-14 rounded-2xl transition-all shadow-md active:scale-95"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{saving ? "Đang lưu thay đổi..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: ĐỔI MẬT KHẨU ── */}
      {activeTab === "password" && (
        <form
          onSubmit={handleUpdatePassword}
          className="bg-white rounded-3xl border border-gray-100 p-8 space-y-6 shadow-xs max-w-2xl"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Thiết Lập Mật Khẩu Mới</h3>
              <p className="text-sm text-gray-500">
                Mật khẩu mới cần tối thiểu 6 ký tự để đảm bảo an toàn.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
              Mật khẩu hiện tại
            </label>
            <PasswordInput
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              inputClassName="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
              Mật khẩu mới
            </label>
            <PasswordInput
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              inputClassName="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">
              Xác nhận mật khẩu mới
            </label>
            <PasswordInput
              required
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              inputClassName="h-14 w-full px-5 text-base font-semibold bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400] transition-all"
            />
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center justify-center gap-3 bg-[#D35400] hover:bg-[#b84900] disabled:bg-gray-300 text-white font-black text-base px-8 h-14 rounded-2xl transition-all shadow-md active:scale-95"
            >
              {passwordSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              <span>{passwordSaving ? "Đang xử lý..." : "Cập nhật Mật Khẩu"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
