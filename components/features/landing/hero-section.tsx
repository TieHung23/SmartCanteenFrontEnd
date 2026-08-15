"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

export default function HeroSection() {
  const words = ["Sinh Viên Bận Rộn.", "Giảng Viên.", "Thế Hệ Hiện Đại."];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState("/plate.png");

  useEffect(() => {
    const word = words[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      timeout = setTimeout(() => {
        setCurrentText(word.substring(0, currentText.length - 1));
        if (currentText.length === 0) {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }, 50);
    } else {
      timeout = setTimeout(() => {
        setCurrentText(word.substring(0, currentText.length + 1));
        if (currentText.length === word.length) {
          timeout = setTimeout(() => setIsDeleting(true), 2500);
        }
      }, 100);
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex]);

  const scrollToNextSection = () => {
    document.getElementById("landing-next-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="relative w-full min-h-screen pt-24 pb-20 px-4 md:px-8 overflow-hidden z-10 flex flex-col justify-center">
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 z-0 h-[92%] w-[52%] bg-gradient-to-br from-[#ffb11b] via-[#ff9514] to-[#f47a16] rounded-bl-[52%] shadow-[inset_18px_-18px_40px_rgba(160,62,0,0.13)]"
      />
      <div className="max-w-7xl mx-auto w-full relative grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-4 items-center">
        <div className="flex flex-col items-start gap-5 z-20 w-full max-w-2xl">
          <h1 className="text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.5rem] text-gray-900 leading-[1.2] tracking-tight font-black">
            Giải Pháp <span className="text-[#c2410c] italic font-medium">Ăn Uống</span>
            <br />
            Thông Minh Cho <br />
            <span className="text-[#f97316] italic font-medium">{currentText}</span>
            <span className="animate-pulse text-[#f97316] font-light">|</span>
          </h1>

          <p className="text-gray-500 font-medium text-sm md:text-base max-w-sm mt-2 leading-relaxed">
            Chủ động đặt suất ăn, không lo xếp hàng.
            <br />
            Tiết kiệm tối đa thời gian nghỉ trưa của bạn!
          </p>

          <div className="flex items-center gap-4 md:gap-6 mt-4">
            <Link
              href="/session"
              className="bg-[#e04f33] text-white hover:bg-[#c84025] transition-colors px-6 md:px-8 py-2.5 md:py-3 rounded-full font-bold shadow-[0_8px_20px_rgba(224,79,51,0.3)]"
            >
              Xem Phiên Ăn
            </Link>
            <button
              type="button"
              onClick={scrollToNextSection}
              aria-label="Xem phần tiếp theo"
              className="w-12 h-12 md:w-14 md:h-14 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Play className="w-4 h-4 md:w-5 md:h-5 ml-1" fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Food-focused visual inspired by the reference design. */}
        <div className="relative min-h-[440px] md:min-h-[580px] flex items-center justify-center lg:justify-end overflow-visible">
          <div className="absolute right-[8%] top-[13%] w-4 h-4 rounded-full bg-white/70 shadow-[0_0_0_8px_rgba(255,255,255,0.12)] animate-pulse" />
          <div className="absolute right-[8%] bottom-[15%] w-3 h-3 rounded-full bg-[#ffdf67] animate-float" />

          <div className="relative z-10 -translate-x-4 md:-translate-x-8 w-[280px] h-[280px] md:w-[410px] md:h-[410px] rounded-full shadow-[0_28px_60px_rgba(111,49,5,0.28)] animate-float-slow overflow-hidden">
            <Image
              key={selectedPlate}
              src={selectedPlate}
              alt="Món ăn đang được chọn"
              fill
              priority
              className="object-cover rounded-full animate-fade-in-scale"
            />
          </div>

          <button
            type="button"
            onClick={() => setSelectedPlate("/plate1.png")}
            aria-label="Chọn món thịt viên"
            className={`absolute z-20 right-[-15%] top-[12%] w-16 h-16 md:w-24 md:h-24 rounded-full shadow-xl -rotate-12 animate-float overflow-hidden transition-all duration-300 ${selectedPlate === "/plate1.png" ? "ring-4 ring-white scale-110" : "hover:scale-110"}`}
          >
            <Image
              src="/plate1.png"
              alt="Món thịt viên"
              fill
              className="object-cover rounded-full"
            />
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlate("/plate2.png")}
            aria-label="Chọn món rau xanh"
            className={`absolute z-20 right-[-18%] top-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full shadow-xl rotate-6 animate-float-slow overflow-hidden transition-all duration-300 ${selectedPlate === "/plate2.png" ? "ring-4 ring-white scale-110" : "hover:scale-110"}`}
          >
            <Image
              src="/plate2.png"
              alt="Món rau xanh"
              fill
              className="object-cover rounded-full"
            />
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlate("/plate3.png")}
            aria-label="Chọn món tôm chiên"
            className={`absolute z-20 right-[-15%] bottom-[12%] w-16 h-16 md:w-24 md:h-24 rounded-full shadow-xl rotate-12 animate-float overflow-hidden transition-all duration-300 ${selectedPlate === "/plate3.png" ? "ring-4 ring-white scale-110" : "hover:scale-110"}`}
          >
            <Image
              src="/plate3.png"
              alt="Món tôm chiên"
              fill
              className="object-cover rounded-full"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
