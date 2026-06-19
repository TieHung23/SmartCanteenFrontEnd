"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import Image from "next/image";
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
          className="px-5 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold hover:bg-[#b84900] transition-colors shadow-sm"
        >
          + New Dish
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          placeholder="Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all w-72"
        />
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Dish
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Category
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Price
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
                    No dishes found.
                  </td>
                </tr>
              )}
              {filtered.map((dish) => (
                <tr key={dish.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {dish.imgUrl && (
                        <Image
                          src={dish.imgUrl}
                          alt={dish.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{dish.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{dish.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">
                    {categoryMap[dish.categoryId] || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">
                    {dish.price} <span className="text-xs text-gray-400 font-normal">Point</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleToggleActive(dish)}
                      className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors",
                        dish.isActive
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                      )}
                    >
                      {dish.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => router.push(`/manager/menu/${dish.id}/edit`)}
                      className="text-sm text-[#D35400] hover:text-[#b84900] font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id, dish.name)}
                      className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
