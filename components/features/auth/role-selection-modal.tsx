"use client";

import { UserCategory } from "@/types/auth.types";
import { GraduationCap, UserCheck, CheckCircle2, ArrowRight, Sparkles, X } from "lucide-react";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectRole: (role: UserCategory) => void;
  currentRole?: UserCategory;
}

export const RoleSelectionModal = ({
  isOpen,
  onClose,
  onSelectRole,
  currentRole = UserCategory.Student,
}: RoleSelectionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-white/95 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-300">
        {/* Close button if optional */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chào mừng đến với Smart Canteen</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bạn là ai tại nhà trường?
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Hãy chọn nhóm tài khoản phù hợp để chúng tôi tối ưu hóa form và trải nghiệm cho bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Sinh vien */}
          <button
            type="button"
            onClick={() => onSelectRole(UserCategory.Student)}
            className={`group relative flex flex-col justify-between text-left p-6 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer ${
              currentRole === UserCategory.Student
                ? "border-orange-500 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-white shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20"
                : "border-slate-100 bg-slate-50/60 hover:border-orange-300 hover:bg-orange-50/20"
            }`}
          >
            {currentRole === UserCategory.Student && (
              <div className="absolute top-4 right-4 text-orange-500 bg-white rounded-full shadow-sm p-0.5">
                <CheckCircle2 className="w-5 h-5 fill-orange-500 text-white" />
              </div>
            )}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 mb-5 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">
                Sinh viên (Student)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                Dành cho sinh viên đang theo học tại trường FPT.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-200/70 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Yêu cầu Mã số sinh viên (SE...)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Xác thực mã OTP qua Email
              </li>
            </ul>

            <div className="mt-6 pt-2 flex items-center justify-between text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
              <span>Đăng ký Sinh viên</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Card Giang vien */}
          <button
            type="button"
            onClick={() => onSelectRole(UserCategory.Lecturer)}
            className={`group relative flex flex-col justify-between text-left p-6 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer ${
              currentRole === UserCategory.Lecturer
                ? "border-blue-600 bg-gradient-to-b from-blue-600/10 via-indigo-500/5 to-white shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                : "border-slate-100 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/20"
            }`}
          >
            {currentRole === UserCategory.Lecturer && (
              <div className="absolute top-4 right-4 text-blue-600 bg-white rounded-full shadow-sm p-0.5">
                <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
              </div>
            )}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                Giảng viên (Lecturer)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                Dành cho Cán bộ & Giảng viên nhà trường.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-200/70 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Không cần nhập Mã sinh viên
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Đăng nhập nhanh ngay sau tạo
              </li>
            </ul>

            <div className="mt-6 pt-2 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Đăng ký Giảng viên</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
