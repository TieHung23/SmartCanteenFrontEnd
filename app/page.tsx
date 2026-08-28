"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { ROUTES } from "@/config/routes";
import Navbar from "@/components/layout/Navbar";
import { getAccessToken, setBlockedAccountInfo } from "@/lib/auth-token-storage";
import HeroSection from "@/components/features/landing/hero-section";
import SliderMenuSection from "@/components/features/landing/slider-menu-section";
import PromoCategoriesSection from "@/components/features/landing/promo-categories-section";
import CtaSection from "@/components/features/landing/cta-section";
import AppDownloadSection from "@/components/features/landing/app-download-section";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/features/landing/scroll-reveal";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }

    authService
      .getProfile()
      .then(async (profile) => {
        if (!profile?.role) {
          setIsLoading(false);
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
            setIsLoading(false);
            return;
        }

        const fullProfile = await userService.getProfile().catch(() => null);
        if (fullProfile && (fullProfile.status === 4 || fullProfile.status === 5)) {
          setBlockedAccountInfo({
            status: fullProfile.status,
            message:
              fullProfile.status === 5
                ? "This account has been banned."
                : "This account has been suspended.",
          });
          router.push(ROUTES.SUSPENDED);
          return;
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <h1 className="text-sm font-medium text-gray-500 animate-pulse">Đang tải dữ liệu...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff4ea] via-white to-white flex flex-col">
      <div className="relative flex-1 flex flex-col">
        <Navbar isTransparent={true} />
        <HeroSection />
        <div id="landing-next-section" className="scroll-mt-24">
          <ScrollReveal>
            <SliderMenuSection />
          </ScrollReveal>
        </div>
        <ScrollReveal delay={80}>
          <PromoCategoriesSection />
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <CtaSection />
        </ScrollReveal>
        <ScrollReveal delay={160}>
          <AppDownloadSection />
        </ScrollReveal>
      </div>
      <Footer />
    </div>
  );
}
