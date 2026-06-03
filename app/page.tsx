"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/config/routes";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }

    authService.getProfile().then((profile) => {
      if (!profile?.role) {
        router.push(ROUTES.LOGIN);
        return;
      }

      switch (profile.role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "MANAGER":
          router.push("/manager");
          break;
        case "STAFF":
          router.push("/staff");
          break;
        case "USER":
          router.push("/home");
          break;
        default:
          router.push(ROUTES.LOGIN);
          break;
      }
    });
  }, [router]);

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
