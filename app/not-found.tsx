import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 text-center">
      <h1 className="text-9xl font-extrabold text-orange-500 drop-shadow-lg">404</h1>

      <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-3">Không tìm thấy trang</h2>

      <p className="text-gray-500 mb-8 max-w-md">
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại, đã bị xóa, đổi tên hoặc tạm thời không khả
        dụng.
      </p>

      <Button
        asChild
        className="bg-orange-500 hover:bg-orange-600 rounded-full px-8 py-6 shadow-md transition-transform hover:scale-105"
      >
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
