"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Search, Trash2, Tag } from "lucide-react";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types/category.types";

export default function CategoryListPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCategories = async (reset?: boolean) => {
    if (reset) setLoading(true);
    try {
      const result = await categoryService.getAll({ name: search || undefined, pageSize: 100 });
      setCategories(result.items);
    } catch (err) {
      console.error(err);
    } finally {
      if (reset) setLoading(false);
    }
  };

  useEffect(() => {
    const initial = async () => {
      try {
        const result = await categoryService.getAll({ pageSize: 100 });
        setCategories(result.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initial();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await categoryService.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Categories</h1>
          <p className="text-lg text-gray-500 mt-1.5">Quản lý và thiết lập danh mục món ăn.</p>
        </div>
        <button
          onClick={() => router.push("/manager/categories/new")}
          className="shrink-0 flex items-center justify-center gap-3 px-6 py-4 bg-[#D35400] text-white rounded-2xl font-black text-base hover:bg-[#b84900] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchCategories(true);
            }}
            className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
          />
        </div>
        <button
          onClick={() => fetchCategories(true)}
          className="px-6 py-3.5 bg-gray-900 text-white rounded-3xl text-base font-bold hover:bg-gray-800 transition-all shadow-xs active:scale-98"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">Đang tải danh sách danh mục...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-xs">
          <p className="text-gray-400 font-bold text-lg">Chưa có danh mục nào được khởi tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-3xl border border-gray-100 p-4 hover:shadow-md hover:border-orange-200/60 transition-all duration-300 flex flex-col shadow-2xs card-3d"
            >
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-3">
                {category.imgUrl ? (
                  <Image
                    src={category.imgUrl}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-white">
                    <Tag className="w-8 h-8" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1 truncate uppercase tracking-wide">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500 mb-5 line-clamp-2 min-h-[2.5rem]">
                {category.description || "Chưa có mô tả cho danh mục này."}
              </p>
              <div className="mt-auto flex items-center gap-3">
                <button
                  onClick={() => router.push(`/manager/categories/${category.id}/edit`)}
                  className="flex-1 py-3 bg-[#D35400]/10 text-[#D35400] rounded-2xl text-sm font-black hover:bg-[#D35400]/25 transition-all uppercase tracking-wider text-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-100 transition-all shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

