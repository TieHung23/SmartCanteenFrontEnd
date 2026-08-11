"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import AboutHero3D from "@/components/features/about/about-hero-3d";
import AboutStats from "@/components/features/about/about-stats";
import AboutWorkflow3D from "@/components/features/about/about-workflow-3d";
import AboutVietGap from "@/components/features/about/about-vietgap";
import AboutMissionCards from "@/components/features/about/about-mission-cards";
import AboutCTA from "@/components/features/about/about-cta";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Organic Hero Section with Dual Arch Photo Frames & Robot Arm preview */}
        <AboutHero3D />

        {/* Operational Stats & Accuracy Metrics */}
        <AboutStats />

        {/* Dedicated VietGAP Food Standard & Safety Section */}
        <AboutVietGap />

        {/* Interactive 5-Stage Visual Canteen Workflow featuring Robot Arm */}
        <AboutWorkflow3D />

        {/* Core Commitments & VietGAP Quality */}
        <AboutMissionCards />

        {/* Call to Action Banner */}
        <AboutCTA />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/60 bg-card text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Smart Canteen. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
