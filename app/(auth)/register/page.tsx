import { Suspense } from "react";
import { RegisterForm } from "@/components/features/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Cột hình ảnh nghệ thuật bên trái */}
      <div className="hidden lg:block w-1/2 relative bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.pinimg.com/736x/ca/80/39/ca80392fbe91a922f5ce8ee87edde953.jpg"
          alt="Smart Canteen Interior"
          className="absolute inset-0 w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000 opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-12 left-12 right-12 text-white space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-orange-300">
            <span>✨ Trải nghiệm đặt món thế hệ mới</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            FPT Smart Canteen System
          </h2>
          <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
            Đặt món nhanh chóng, thanh toán thông minh và trải nghiệm dịch vụ tiện lợi dành cho Sinh
            viên & Giảng viên.
          </p>
        </div>
      </div>

      {/* Cột Form bên phải */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center overflow-y-auto max-h-screen bg-white px-6 sm:px-10 lg:px-14 py-8">
        <div className="w-full max-w-2xl flex flex-col items-center my-auto">
          <div className="mb-2 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mascot Logo"
              className="w-24 h-24 lg:w-28 lg:h-28 object-contain drop-shadow-xl"
            />
          </div>

          <div className="w-full text-center mb-4 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Vui lòng điền thông tin bên dưới để sử dụng dịch vụ Canteen.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="w-full py-12 text-center text-xs text-slate-400 animate-pulse font-medium">
                Đang tải biểu mẫu đăng ký...
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
