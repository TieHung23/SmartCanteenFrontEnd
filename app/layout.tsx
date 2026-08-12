import type { Metadata } from "next";
import { Be_Vietnam_Pro, Comfortaa, Quicksand } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import CartDrawer from "@/components/features/orders/CartDrawer";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const comfortaa = Comfortaa({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--font-comfortaa",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Canteen",
  description: "Smart Canteen - Hệ thống đặt món thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        beVietnamPro.variable,
        beVietnamPro.className,
        comfortaa.variable,
        quicksand.variable,
      )}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <Toaster richColors position="top-right" />
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
