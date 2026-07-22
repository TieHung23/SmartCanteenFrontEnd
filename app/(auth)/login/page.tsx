import { Suspense } from "react";
import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
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

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="mb-2 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mascot"
              className="w-48 h-48 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="w-full mb-2">
            <h1 className="text-2xl font-extrabold text-gray-800">Đăng nhập</h1>
          </div>

          <Suspense
            fallback={
              <div className="w-full py-8 text-center text-sm text-gray-500">
                Đang tải biểu mẫu đăng nhập...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
