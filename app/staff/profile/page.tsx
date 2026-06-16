"use client";

import { useEffect, useState, useRef } from "react";
import { User, Mail, ShieldCheck, Loader2, Save, Camera } from "lucide-react";
import { userService } from "@/services/user.service";
import { toast } from "sonner";
import Image from "next/image";

export default function StaffProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ref để trigger input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State lưu file thực tế để gửi lên API
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // State lưu URL tạm để hiển thị cho người dùng xem trước khi bấm Lưu
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
          let roleName = "Staff";
          if (data.role === 1) roleName = "Admin";
          else if (data.role === 2) roleName = "Manager";
          else if (data.role === 3) roleName = "Customer";

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

          // Nạp ảnh đại diện hiện tại từ Backend vào Preview
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

  // Xử lý khi người dùng chọn ảnh mới
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file); // Lưu file để tý gửi FormData
      setPreviewUrl(URL.createObjectURL(file)); // Hiển thị ảnh xem trước lập tức
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("Name", profile.name);
      formData.append("PhoneNumber", profile.phoneNumber);
      formData.append("Gender", profile.gender.toString());
      formData.append("Address", profile.address);
      formData.append("MajorOrClass", profile.majorOrClass);
      formData.append("StudentId", profile.studentId);

      if (profile.dateOfBirth && profile.dateOfBirth.trim() !== "") {
        formData.append("DateOfBirth", profile.dateOfBirth.split("T")[0]);
      }

      if (avatarFile) {
        formData.append("Avatar", avatarFile);
      }

      await userService.updateProfile(formData);

      toast.success("Cập nhật thành công", {
        description: "Thông tin cá nhân & Ảnh đại diện đã được lưu lại.",
      });

      // Reset trạng thái file sau khi update xong
      setAvatarFile(null);
    } catch (error) {
      console.error("Lỗi Update Profile:", error);
      toast.error("Lỗi cập nhật", {
        description: "Không thể lưu thông tin. Vui lòng kiểm tra lại.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-14 w-14 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-16">
      <div className="border-b border-gray-200 pb-8">
        <h1 className="text-5xl font-extrabold text-gray-900">Thông Tin Tài Khoản</h1>
        <p className="text-xl text-gray-500 mt-2">
          Quản lý thông tin cá nhân và bảo mật của nhân viên
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-gray-50/80 border-b border-gray-100 p-10 flex flex-col sm:flex-row items-center sm:items-start gap-10">
          <div className="relative group shrink-0">
            <div className="w-40 h-40 rounded-full bg-[#FF4C24]/10 border-4 border-white shadow-md flex items-center justify-center text-[#FF4C24] overflow-hidden relative">
              {previewUrl ? (
                <Image src={previewUrl} alt="Avatar" fill sizes="160px" className="object-cover" />
              ) : (
                <User className="w-16 h-16" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            >
              <Camera className="w-10 h-10 text-white" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left pt-4">
            <h2 className="text-3xl font-bold text-gray-900">
              {profile.name || "Nhân viên Canteen"}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
              <span className="inline-flex items-center gap-2 text-base font-semibold px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                <ShieldCheck className="w-5 h-5" />
                {profile.role}
              </span>
              {avatarFile && (
                <span className="inline-flex items-center gap-1.5 text-base text-amber-700 font-medium bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
                  Ảnh chưa lưu
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-base text-gray-500 hover:text-[#FF4C24] font-medium mt-4 transition underline-offset-4 hover:underline"
            >
              Nhấn để thay đổi ảnh đại diện
            </button>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-700">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full pl-14 pr-5 py-4 text-lg bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-sm text-gray-400">Email dùng để đăng nhập, không thể thay đổi.</p>
            </div>

            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-700">Họ và Tên</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full px-6 py-4 text-lg bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4C24]/20 focus:border-[#FF4C24] transition-colors"
              />
            </div>

            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-700">Số điện thoại</label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                placeholder="Nhập số điện thoại liên hệ..."
                className="w-full px-6 py-4 text-lg bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4C24]/20 focus:border-[#FF4C24] transition-colors"
              />
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold text-lg px-10 py-4 rounded-xl transition-all w-full sm:w-auto shadow-sm"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {saving ? "Đang lưu thay đổi..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
