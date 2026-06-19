"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Search, Trash2 } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage dishes and categories</p>
        </div>
        <button
          onClick={() => router.push("/manager/menu/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold hover:bg-[#b84900] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Dish
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all bg-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">No dishes found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((dish) => (
            <div
              key={dish.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-orange-200 transition-all"
            >
              <div className="flex items-center gap-4">
                {dish.imgUrl ? (
                  <Image
                    src={dish.imgUrl}
                    alt={dish.name}
                    width={52}
                    height={52}
                    className="w-13 h-13 rounded-xl object-cover bg-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{dish.name}</h3>
                    <button
                      onClick={() => handleToggleActive(dish)}
                      className={cn(
                        "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors",
                        dish.isActive
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                      )}
                    >
                      {dish.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{categoryMap[dish.categoryId] || "—"}</span>
                    <span className="font-semibold text-gray-700">
                      {dish.price} <span className="font-normal text-gray-400">Point</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/manager/menu/${dish.id}/edit`)}
                    className="px-4 py-2 bg-[#D35400]/10 text-[#D35400] rounded-xl text-sm font-semibold hover:bg-[#D35400]/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id, dish.name)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
