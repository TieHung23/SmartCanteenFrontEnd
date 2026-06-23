"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types/category.types";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function EditDishPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImg, setExistingImg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dish, catResult] = await Promise.all([
          dishService.getDish(id),
          categoryService.getAll(),
        ]);
        setName(dish.name);
        setDescription(dish.description);
        setPrice(String(dish.price));
        setCategoryId(dish.categoryId);
        setIsActive(dish.isActive);
        setExistingImg(dish.imgUrl);
        setCategories(catResult.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dish");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Tên món ăn là bắt buộc.");
      return;
    }
    if (!description.trim()) {
      setError("Mô tả món ăn là bắt buộc.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Đơn giá phải lớn hơn 0.");
      return;
    }
    if (!categoryId) {
      setError("Danh mục là bắt buộc.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await dishService.updateDish(id, {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        categoryId,
        isActive,
        image: image || undefined,
      });
      router.push("/manager/menu");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update dish");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải thông tin món ăn cần sửa...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12 px-4 md:px-0">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-bold text-gray-500 hover:text-[#D35400] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Menu Settings
        </button>

        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">Edit Dish</h1>
          <p className="text-lg text-gray-500 mt-1.5">Chỉnh sửa chi tiết thông tin và trạng thái món ăn.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-3xl border border-gray-200/60 p-10 space-y-8 shadow-sm">
        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Tên món ăn *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cơm gà chiên"
            className="w-full px-5 py-4 text-lg bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Mô tả món ăn *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description of the dish..."
            rows={5}
            className="w-full px-5 py-4 text-lg bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-2xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="block text-base font-bold text-gray-800 mb-2">Giá tiền (Points) *</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-5 py-4 text-lg bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-gray-800 mb-2">Danh mục món ăn *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-gray-200/60 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all cursor-pointer shadow-2xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle active state */}
        <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-150/60 shadow-2xs">
          <label className="text-base font-bold text-gray-800">Trạng thái bán hàng</label>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "relative w-12 h-7 rounded-full transition-colors flex items-center shrink-0",
              isActive ? "bg-green-500" : "bg-gray-300",
            )}
          >
            <span
              className={cn(
                "absolute w-5 h-5 bg-white rounded-full shadow-sm transition-all",
                isActive ? "left-6" : "left-1",
              )}
            />
          </button>
          <span className="text-sm font-semibold text-gray-600">
            {isActive ? "Đang hoạt động (Hiển thị thực đơn)" : "Ngừng bán (Ẩn khỏi thực đơn)"}
          </span>
        </div>

        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Hình ảnh món ăn</label>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-4">
            {existingImg && !preview && (
              <div className="p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Ảnh hiện tại:</p>
                <Image
                  src={existingImg}
                  alt="Current"
                  width={224}
                  height={224}
                  className="w-56 h-56 rounded-2xl object-cover"
                />
              </div>
            )}
            
            {preview && (
              <div className="p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Ảnh mới sẽ thay thế:</p>
                <Image
                  src={preview}
                  alt="Preview"
                  width={224}
                  height={224}
                  className="w-56 h-56 rounded-2xl object-cover"
                />
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-base text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-black file:uppercase file:bg-orange-50 file:text-[#D35400] hover:file:bg-orange-100/80 transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => router.push("/manager/menu")}
          className="px-7 py-4 border border-gray-200/80 text-gray-600 rounded-2xl text-lg font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-10 py-4 bg-[#D35400] text-white rounded-2xl text-lg font-bold hover:bg-[#b84900] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Đang lưu..." : "Cập nhật món ăn"}
        </button>
      </div>
    </div>
  );
}
