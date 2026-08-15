import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Cột hình ảnh nghệ thuật bên trái */}
      <div className="hidden lg:block w-1/2 relative bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.pinimg.com/736x/57/83/12/578312b1e86e55a6636db4ead225065e.jpg"
          alt="Canteen Interior"
          className="absolute inset-0 w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000 opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-12 left-12 right-12 text-white space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-orange-300">
            <span>✨ Khôi phục quyền truy cập</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Quên mật khẩu tài khoản?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
            Đừng lo lắng! Chúng tôi sẽ gửi một liên kết bảo mật đến email của bạn để tiến hành thiết
            lập lại mật khẩu.
          </p>
        </div>
      </div>

      {/* Cột Form bên phải */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white px-6 sm:px-10 lg:px-14 py-8">
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mascot Logo"
              className="w-28 h-28 lg:w-32 lg:h-32 object-contain drop-shadow-xl"
            />
          </div>

          <div className="w-full text-center mb-6 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quên mật khẩu
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Nhập địa chỉ Email của bạn để nhận liên kết đặt lại mật khẩu.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="w-full py-8 text-center text-xs text-slate-400 animate-pulse font-medium">
                Đang tải biểu mẫu...
              </div>
            }
          >
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
