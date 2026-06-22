"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import { cn } from "@/lib/utils";

export default function ManagerMenuPage() {
  const router = useRouter();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([dishService.getDishes({ pageSize: 100 }), categoryService.getAll()])
      .then(([dishResult, catResult]) => {
        if (cancelled) return;
        setDishes(dishResult.items);
        setCategories(catResult.items);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete dish "${name}"?`)) return;
    try {
      await dishService.deleteDish(id);
      setDishes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (dish: Dish) => {
    try {
      const updated = await dishService.updateDish(dish.id, {
        name: dish.name,
        description: dish.description,
        price: dish.price,
        categoryId: dish.categoryId,
        isActive: !dish.isActive,
      });
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (err) {
      console.error(err);
    }
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const filtered = dishes.filter((d) => {
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || d.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Menu Settings</h1>
          <p className="text-lg text-gray-500 mt-1.5">Quản lý thực đơn và điều chỉnh trạng thái các món ăn.</p>
        </div>
        <button
          onClick={() => router.push("/manager/menu/new")}
          className="shrink-0 flex items-center justify-center gap-3 px-6 py-4 bg-[#D35400] text-white rounded-2xl font-black text-base hover:bg-[#b84900] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Dish
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm kiếm tên món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-60 px-4 py-3.5 bg-white border border-gray-200 rounded-3xl text-base font-medium outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-2xs cursor-pointer"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">Đang tải danh sách món ăn...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-xs">
          <p className="text-gray-400 font-bold text-lg">Không tìm thấy món ăn nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((dish) => (
            <div
              key={dish.id}
              className="bg-white rounded-3xl border border-gray-100 p-4 hover:shadow-md hover:border-orange-200/60 transition-all duration-300 flex flex-col shadow-2xs card-3d"
            >
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-3">
                {dish.imgUrl ? (
                  <Image
                    src={dish.imgUrl}
                    alt={dish.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-white">
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-lg font-black text-gray-900 truncate uppercase tracking-wide">
                  {dish.name}
                </h3>
                <button
                  onClick={() => handleToggleActive(dish)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-xs font-black transition-all",
                    dish.isActive
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {dish.isActive ? "Active" : "Inactive"}
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-5">
                <span className="font-bold text-gray-500">{categoryMap[dish.categoryId] || "—"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className=" inline-flex items-center gap-1 font-black text-[#D35400]">
                  {dish.price}
                  <div className="relative w-5 h-5 opacity-95"> 
                  <Image
                    src="/logo_point.png"
                    alt="Watermark Logo"
                    fill
                    sizes="24px"
                    className="object-contain filter brightness-110"
                  />
                </div>
                </span>
              </div>
              <div className="mt-auto flex items-center gap-3">
                <button
                  onClick={() => router.push(`/manager/menu/${dish.id}/edit`)}
                  className="flex-1 py-3 bg-[#D35400]/10 text-[#D35400] rounded-2xl text-sm font-black hover:bg-[#D35400]/25 transition-all uppercase tracking-wider text-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dish.id, dish.name)}
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

