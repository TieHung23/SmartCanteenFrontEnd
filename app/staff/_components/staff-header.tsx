"use client";

import { Bell, Search } from "lucide-react";

export function StaffHeader() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-[#FF4C24]/20 text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF4C24] rounded-full" />
        </button>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF4C24]/20 flex items-center justify-center">
            <span className="text-[#FF4C24] font-bold text-xs">S</span>
          </div>
          <span className="text-sm font-medium text-gray-900 hidden sm:block">Staff</span>
        </div>
      </div>
    </header>
  );
}
