"use client";

import { useEffect, useRef } from "react";
import { Bell, Search, Menu, X } from "lucide-react";
import { useGlobalSearch } from "@/lib/stores/use-search";
import { useUser } from "@/lib/stores/use-user";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function StaffHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { query, setQuery } = useGlobalSearch();
  const { profile, fetchProfile } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Global shortcut key listener (Ctrl+K or Cmd+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (
        e.key === "/" &&
        document.activeElement !== inputRef.current &&
        !(
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayName = profile?.name || "Nhân Viên";
  const avatarUrl = profile?.imgUrl || null;

  return (
    <header className="h-20 border-b border-gray-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 shrink-0 gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-3xl">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:text-gray-900 focus:outline-none shrink-0 rounded-xl hover:bg-gray-100 transition"
            aria-label="Mở sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FF4C24] transition-colors pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm dữ liệu đơn hàng, món ăn, sinh viên..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "w-full h-12 md:h-13 pl-12 pr-24 text-base font-medium",
              "bg-gray-100/90 hover:bg-gray-100/100 border border-gray-200/80 rounded-2xl outline-none",
              "focus:ring-4 focus:ring-[#FF4C24]/15 focus:border-[#FF4C24] focus:bg-white text-gray-900 placeholder:text-gray-400",
              "transition-all duration-200 shadow-2xs",
            )}
          />
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-bold text-gray-400 bg-white border border-gray-200/80 rounded-lg shadow-2xs pointer-events-none select-none">
              <span className="text-[10px]">⌘</span>K
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button
          className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 shadow-2xs"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF4C24] rounded-full ring-2 ring-white animate-pulse" />
        </button>
        <div className="h-8 w-px bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FF4C24]/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-xs shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={44}
                height={44}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[#FF4C24] font-extrabold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-tight">{displayName}</p>
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Đang trực
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
