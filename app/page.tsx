"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/config/routes";
import Navbar from "@/components/layout/Navbar";

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
          router.push("/");
          break;
        default:
          router.push(ROUTES.LOGIN);
          break;
      }
    });
  }, [router]);

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
