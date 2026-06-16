"use client";

import { useEffect, useRef } from "react";
import { Bell, Search } from "lucide-react";
import { useGlobalSearch } from "@/lib/stores/use-search";
import { useUser } from "@/lib/stores/use-user";
import Image from "next/image";

export function StaffHeader() {
  const { query, setQuery } = useGlobalSearch();
  const { profile, fetchProfile } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayName = profile?.name || "Staff";
  const avatarUrl = profile?.imgUrl || null;

  return (
    <header className="h-18 border-b border-gray-200 bg-white flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm toàn bộ dữ liệu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 text-base bg-gray-100 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4C24]/20 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF4C24] rounded-full ring-2 ring-white" />
        </button>
        <div className="h-9 w-px bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#FF4C24]/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
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
            <p className="text-sm font-bold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-400 font-medium">Đang trực</p>
          </div>
        </div>
      </div>
    </header>
  );
}
