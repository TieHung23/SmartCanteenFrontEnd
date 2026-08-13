"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

export default function Footer() {
  const [activeModal, setActiveModal] = useState<"terms" | "refund" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="relative bg-[#5C5752] text-gray-200 pt-6 md:pt-8 pb-6 w-full -mt-24 z-20">
      {/* Top Wave */}
      <svg
        className="absolute top-0 left-0 w-full h-[60px] md:h-[100px] -translate-y-[98%]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="#5C5752"
          fillOpacity="1"
          d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,165.3C960,139,1056,117,1152,117.3C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-start gap-12 md:gap-16 lg:gap-20 mb-8">
          {/* Column 1: Brand Info */}
          <div className="flex flex-col gap-6 flex-1 max-w-sm">
            <h3 className="text-2xl font-black text-white tracking-tight">Smart Canteen</h3>
            <div className="w-12 h-1 bg-orange-500 rounded-full"></div>
            <ul className="flex flex-col gap-3 text-sm font-medium text-gray-300">
              <li className="flex gap-2">
                <span className="font-bold text-orange-400">•</span>
                <span>Khu Phố 6, P. Linh Trung, Tp. Thủ Đức, Tp. Hồ Chí Minh</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-orange-400">•</span>
                <span>contact@smartcanteen.vn</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-orange-400">•</span>
                <span>0123 456 789</span>
              </li>
            </ul>
          </div>
          {/* Right Columns Group */}
          <div className="flex flex-row gap-12 md:gap-16 lg:gap-24">
            {/* Column 2: Khám Phá */}
            <div className="flex flex-col gap-6">
              <h4 className="text-lg font-bold text-white">Khám Phá</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Trang Chủ
                  </Link>
                </li>
                <li>
                  <Link href="/session" className="hover:text-white transition-colors">
                    Thực Đơn
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    Về Chúng Tôi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Hỗ Trợ */}
            <div className="flex flex-col gap-6">
              <h4 className="text-lg font-bold text-white">Hỗ Trợ</h4>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => setActiveModal("terms")}
                    className="hover:text-white transition-colors text-left"
                  >
                    Điều Khoản Sử Dụng
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("refund")}
                    className="hover:text-white transition-colors text-left"
                  >
                    Quy Định Đổi Trả
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {mounted &&
        activeModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="bg-white text-gray-800 p-6 md:p-8 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative shadow-2xl animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>

              {activeModal === "terms" && (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-[#D35400]">Điều Khoản Sử Dụng</h2>
                  <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                    <p>
                      Chào mừng bạn đến với ứng dụng Smart Canteen. Bằng việc sử dụng dịch vụ của
                      chúng tôi, bạn đồng ý với các điều khoản sau đây:
                    </p>

                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        1. Đăng ký tài khoản
                      </h3>
                      <p>
                        Người dùng cam kết cung cấp thông tin chính xác khi tạo tài khoản. Mọi hành
                        vi gian lận thông tin sẽ dẫn đến việc khóa tài khoản vĩnh viễn.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        2. Quy định đặt món
                      </h3>
                      <p>
                        Việc đặt món phải được thực hiện trong đúng khung giờ quy định của từng{" "}
                        <strong>Phiên ăn</strong>. Đơn hàng đã chuyển sang trạng thái{" "}
                        <em>"Đã chốt"</em> sẽ không thể bị hủy hoặc thay đổi món dưới mọi hình thức.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        3. Nghĩa vụ thanh toán
                      </h3>
                      <p>
                        Người dùng cam kết thanh toán đầy đủ cho các đơn hàng đã đặt thành công qua
                        ví điện tử tích hợp trên Smart Canteen hoặc các hình thức được hỗ trợ khác.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        4. Miễn trừ trách nhiệm
                      </h3>
                      <p>
                        Smart Canteen không chịu trách nhiệm đối với các sự cố phát sinh từ kết nối
                        mạng của người dùng hoặc do cung cấp sai thông tin nhận món.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeModal === "refund" && (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-[#D35400]">
                    Quy Định Đổi Trả & Hoàn Tiền
                  </h2>
                  <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                    <p>
                      Smart Canteen luôn nỗ lực cam kết mang đến những suất ăn chất lượng nhất. Tuy
                      nhiên, trong một số trường hợp sự cố, bạn có thể áp dụng chính sách đổi
                      trả/hoàn tiền:
                    </p>

                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        1. Các trường hợp được hoàn tiền
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>
                          Món ăn bị hư hỏng, ôi thiu, có dị vật hoặc không đảm bảo vệ sinh an toàn
                          thực phẩm.
                        </li>
                        <li>
                          Smart Canteen giao sai hoặc thiếu món ăn so với đơn đặt hàng đã chốt.
                        </li>
                        <li>
                          Hệ thống đã trừ tiền trong ví nhưng đơn hàng không được ghi nhận thành
                          công trên hệ thống.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">2. Quy trình xử lý</h3>
                      <p>Trong trường hợp gặp sự cố, vui lòng thực hiện ngay các bước sau:</p>
                      <ul className="list-decimal pl-5 space-y-2 mt-2">
                        <li>
                          Báo cáo sự cố trực tiếp tại quầy hoặc thông qua tính năng{" "}
                          <strong>Khiếu nại</strong> trên ứng dụng trong vòng 24 giờ.
                        </li>
                        <li>
                          Cung cấp hình ảnh bằng chứng (nếu món ăn có vấn đề) hoặc mã đơn hàng.
                        </li>
                        <li>
                          Sau khi xác nhận khiếu nại là hợp lệ, số tiền tương ứng sẽ được hoàn lại
                          trực tiếp vào ví Smart Canteen của bạn trong{" "}
                          <strong>1-2 ngày làm việc</strong>.
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </footer>
  );
}
