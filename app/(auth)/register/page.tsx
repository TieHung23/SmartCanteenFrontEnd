import { Suspense } from "react";
import { RegisterForm } from "@/components/features/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="hidden lg:block w-1/2 relative bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.pinimg.com/736x/ca/80/39/ca80392fbe91a922f5ce8ee87edde953.jpg"
          alt="Canteen interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/18 to-black/6" />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center overflow-hidden bg-white px-8 sm:px-10 py-4">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="mb-2 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mascot"
              className="w-40 h-40 lg:w-44 lg:h-44 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="w-full mb-4">
            <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Tạo tài khoản</h1>
            <p className="text-sm text-gray-500">
              Điền thông tin của bạn để tạo tài khoản canteen.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="w-full py-8 text-center text-sm text-gray-500">
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
