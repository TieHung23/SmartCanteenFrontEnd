"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { categoryService } from "@/services/category.service";

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImgUrl, setExistingImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const category = await categoryService.getById(id);
        setName(category.name);
        setDescription(category.description);
        setExistingImgUrl(category.imgUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load category");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Tên danh mục là bắt buộc.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await categoryService.update(id, {
        name: name.trim(),
        description: description.trim(),
        image: image || undefined,
      });
      router.push("/manager/categories");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải danh mục cần chỉnh sửa...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in pb-12">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-bold text-gray-500 hover:text-[#D35400] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Categories
        </button>

        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">Edit Category</h1>
          <p className="text-lg text-gray-500 mt-1.5">Chỉnh sửa chi tiết thông tin danh mục món ăn.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-3xl border border-gray-200/60 p-8 space-y-6 shadow-sm">
        <div>
          <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">Tên danh mục *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full px-4 py-3.5 text-base bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Category description"
            rows={4}
            className="w-full px-4 py-3.5 text-base bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">Hình ảnh đại diện</label>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-4">
            {existingImgUrl && !preview && (
              <div className="p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Ảnh hiện tại:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={existingImgUrl}
                  alt="Current"
                  className="w-36 h-36 rounded-2xl object-cover"
                />
              </div>
            )}
            
            {preview && (
              <div className="p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Ảnh mới sẽ thay thế:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="w-36 h-36 rounded-2xl object-cover"
                />
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="w-full text-base text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-sm file:font-black file:uppercase file:bg-orange-50 file:text-[#D35400] hover:file:bg-orange-100/80 transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => router.push("/manager/categories")}
          className="px-6 py-3.5 border border-gray-200/80 text-gray-600 rounded-2xl text-base font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3.5 bg-[#D35400] text-white rounded-2xl text-base font-black hover:bg-[#b84900] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Đang lưu..." : "Cập nhật danh mục"}
        </button>
      </div>
    </div>
  );
}
