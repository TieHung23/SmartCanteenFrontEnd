"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[95vw] w-[95vw]",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setVisible(false);
    }
  };

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 select-none">
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        onTransitionEnd={handleAnimationEnd}
        className={cn(
          "relative bg-white rounded-[2.5rem] border border-gray-200/35 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.12),_0_0_0_1px_rgba(0,0,0,0.015)] flex flex-col w-full max-h-[90vh] overflow-hidden z-10 transition-all duration-300 ease-out",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4",
          sizeClasses[size],
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100/60 px-8 py-5 shrink-0">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 select-text">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
