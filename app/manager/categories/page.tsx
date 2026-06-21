"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Search, Trash2 } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage dish categories</p>
        </div>
        <button
          onClick={() => router.push("/manager/categories/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold hover:bg-[#b84900] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchCategories(true);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all bg-white"
          />
        </div>
        <button
          onClick={() => fetchCategories(true)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-orange-200 transition-all flex flex-col"
            >
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
                {category.imgUrl ? (
                  <Image
                    src={category.imgUrl}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-bold">
                    —
                  </div>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{category.name}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {category.description || "—"}
              </p>
              <div className="mt-auto flex items-center gap-2">
                <button
                  onClick={() => router.push(`/manager/categories/${category.id}/edit`)}
                  className="flex-1 px-4 py-2 bg-[#D35400]/10 text-[#D35400] rounded-xl text-sm font-semibold hover:bg-[#D35400]/20 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
