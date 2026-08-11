import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="hidden lg:block w-1/2 relative bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.pinimg.com/736x/57/83/12/578312b1e86e55a6636db4ead225065e.jpg"
          alt="Canteen interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/18 to-black/6" />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-xl flex flex-col items-center -mt-12 sm:-mt-16">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mascot"
              className="w-40 h-40 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="w-full mb-4">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Quên mật khẩu</h1>
            <p className="text-sm text-gray-400">
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="w-full py-8 text-center text-sm text-gray-500">Đang tải...</div>
            }
          >
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
