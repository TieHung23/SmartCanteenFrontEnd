"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types/category.types";
import Image from "next/image";

export default function NewDishPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    categoryService
      .getAll()
      .then((res) => {
        setCategories(res.items);
        if (res.items.length > 0) setCategoryId(res.items[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
      await dishService.createDish({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        categoryId,
        image,
      });
      router.push("/manager/menu");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create dish");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải danh mục món ăn...</p>
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
          <h1 className="text-4xl font-extrabold text-gray-900">New Dish</h1>
          <p className="text-lg text-gray-500 mt-1.5">Thêm món ăn mới vào thực đơn canteen.</p>
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
            placeholder="e.g. Cơm tấm sườn bì chả"
            className="w-full px-5 py-4 text-lg bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Mô tả món ăn *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả nguyên liệu, hương vị món ăn..."
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
              placeholder="e.g. 30"
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

        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Hình ảnh minh họa</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-base text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-black file:uppercase file:bg-orange-50 file:text-[#D35400] hover:file:bg-orange-100/80 transition-colors cursor-pointer"
          />
          {preview && (
            <div className="mt-4 p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
              <Image
                src={preview}
                alt="Preview"
                width={224}
                height={224}
                className="w-56 h-56 object-cover rounded-2xl"
              />
            </div>
          )}
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
          {submitting ? "Đang tạo..." : "Tạo món ăn"}
        </button>
      </div>
    </div>
  );
}
