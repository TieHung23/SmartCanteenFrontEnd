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

      <div className="w-full lg:w-1/2 flex flex-col items-center overflow-y-auto bg-white px-8 sm:px-10 lg:px-12 py-6">
        <div className="w-full max-w-2xl flex flex-col items-center -mt-26">
          <div className="mt-6 mb-2 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mascot"
              className="w-60 h-60 lg:w-56 lg:h-56 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="w-full mb-6">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Create Account</h1>
            <p className="text-sm text-gray-500">
              Fill in your details to create your canteen account.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="w-full py-8 text-center text-sm text-gray-500">
                Loading registration form...
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
