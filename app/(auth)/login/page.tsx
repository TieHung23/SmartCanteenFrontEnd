import { Suspense } from "react";
import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen overflow-hidden bg-white">
      <div className="hidden lg:block w-1/2 relative bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.pinimg.com/736x/57/83/12/578312b1e86e55a6636db4ead225065e.jpg"
          alt="Canteen interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/18 to-black/6" />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-sm flex flex-col items-center -mt-30">
          <div className="mb-8 transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mascot"
              className="w-56 h-56 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="w-full mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Sign in</h1>
          </div>

          <Suspense
            fallback={
              <div className="w-full py-8 text-center text-sm text-gray-500">
                Loading login form...
              </div>
            }
          >
            {" "}
            .
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
