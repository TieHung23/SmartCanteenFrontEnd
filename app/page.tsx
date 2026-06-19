"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { ROUTES } from "@/config/routes";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }
    authService.getProfile().then(async (profile) => {
      if (!profile?.role) {
        router.push(ROUTES.LOGIN);
        return;
      }
      switch (profile.role) {
        case "ADMIN":
          router.push("/admin");
          return;
        case "MANAGER":
          router.push("/manager");
          return;
        case "STAFF":
          router.push("/staff");
          return;
        case "USER":
          break;
        default:
          router.push(ROUTES.LOGIN);
          return;
      }
      const fullProfile = await userService.getProfile().catch(() => null);
      if (fullProfile && (fullProfile.status === 4 || fullProfile.status === 5)) {
        router.push(ROUTES.LOGIN);
        return;
      }
      setIsLoading(false);
    });
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <h1 className="text-sm font-medium text-gray-500 animate-pulse">
            Verifying account role, please wait...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <h1 className="text-2xl font-bold text-center mt-10">Welcome to the Home Page!</h1>
      <p className="text-center mt-4 text-gray-600">
        This is the landing page for students after login.
      </p>
    </div>
  );
}
