"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, ShoppingCart } from "lucide-react";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Meal Session", href: "/session" },
    { name: "Menu", href: "/menu" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const user = {
    userId: "12345",
    fullName: "Mimi",
    avatar: "",
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full px-6 py-4 bg-[#ffefe7]">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white border border-gray-100 rounded-full shadow-sm px-6 h-16 gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Meal Session Logo"
            width={55}
            height={55}
            className="w-auto h-55 object-contain rounded-full pb-2"
            priority
          />
          <span className="text-base font-semibold text-gray-800 tracking-tight hidden sm:block">
            Smart <span className="text-[#E86A33]">Canteen</span>
          </span>
        </Link>

        {/* Divider */}
        <div className="h-7 w-px bg-gray-200 shrink-0" />

        {/* Nav */}
        <nav className="flex flex-1 items-center justify-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-500 hover:text-[#E86A33] hover:bg-orange-50 px-4 py-2 rounded-full transition-all whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-7 w-px bg-gray-200 shrink-0" />

        {/* Icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#E86A33] hover:bg-orange-50 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#E86A33] hover:bg-orange-50 transition-all">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>

        {/* User */}
        <div
          className="flex items-center gap-3 pl-4 border-l border-gray-200 relative"
          ref={dropdownRef}
        >
          {user ? (
            <>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Hi, {user.fullName}
              </span>
              <Image
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                src={
                  user.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.userId}`
                }
                alt={user.fullName || "User avatar"}
                width={40}
                height={40}
                unoptimized
                className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-[#E86A33] cursor-pointer transition-all bg-white shadow-sm"
              />

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <Link
                    href="/profile"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-5 py-4 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#E86A33] transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    My Orders
                  </Link>
                  <div className="border-t border-gray-100" />
                  <button
                    className="w-full text-left px-5 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-[#E86A33] border-2 border-[#E86A33] hover:bg-[#E86A33] hover:text-white px-5 py-2 rounded-full transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
