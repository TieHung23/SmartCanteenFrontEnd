"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  LayoutGrid,
  LayoutList,
  Pencil,
} from "lucide-react";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import { cn } from "@/lib/utils";
import Modal from "../_components/modal";

export default function ManagerMenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal & Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const [formExistingImgUrl, setFormExistingImgUrl] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDishes = async () => {
    try {
      const res = await dishService.getDishes({ pageSize: 100 });
      setDishes(res.items);
    } catch (err) {
      console.error(err);
    }
  };

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
    if (!confirm(`Xóa món ăn "${name}"?`)) return;
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

  // Form helpers
  const openCreateModal = () => {
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategoryId(categories.length > 0 ? categories[0].id : "");
    setFormIsActive(true);
    setFormImage(null);
    setFormPreview(null);
    setFormExistingImgUrl(null);
    setFormError(null);
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const openEditModal = (dish: Dish) => {
    setEditId(dish.id);
    setFormName(dish.name);
    setFormDescription(dish.description || "");
    setFormPrice(String(dish.price));
    setFormCategoryId(dish.categoryId);
    setFormIsActive(dish.isActive);
    setFormImage(null);
    setFormPreview(null);
    setFormExistingImgUrl(dish.imgUrl || null);
    setFormError(null);
    setFormSubmitting(false);
    setIsEditOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      setFormPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async () => {
    if (!formName.trim()) {
      setFormError("Tên món ăn là bắt buộc.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("Mô tả món ăn là bắt buộc.");
      return;
    }
    if (!formPrice || Number(formPrice) <= 0) {
      setFormError("Đơn giá phải lớn hơn 0.");
      return;
    }
    if (!formCategoryId) {
      setFormError("Danh mục là bắt buộc.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      await dishService.createDish({
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        categoryId: formCategoryId,
        image: formImage || undefined,
      });
      setIsCreateOpen(false);
      fetchDishes();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Tạo món ăn thất bại");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    if (!formName.trim()) {
      setFormError("Tên món ăn là bắt buộc.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("Mô tả món ăn là bắt buộc.");
      return;
    }
    if (!formPrice || Number(formPrice) <= 0) {
      setFormError("Đơn giá phải lớn hơn 0.");
      return;
    }
    if (!formCategoryId) {
      setFormError("Danh mục là bắt buộc.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      await dishService.updateDish(editId, {
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        categoryId: formCategoryId,
        isActive: formIsActive,
        image: formImage || undefined,
      });
      setIsEditOpen(false);
      fetchDishes();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Cập nhật món ăn thất bại");
    } finally {
      setFormSubmitting(false);
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
          <h1 className="text-4xl font-extrabold text-gray-900">Thiết lập thực đơn</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Quản lý thực đơn và điều chỉnh trạng thái các món ăn.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="shrink-0 flex items-center justify-center gap-3 px-6 py-4 bg-[#D35400] text-white rounded-2xl font-black text-base hover:bg-[#b84900] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Món ăn mới
        </button>
      </div>

      {/* Filter and Search Bar & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto flex-1">
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

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl border border-gray-200/60 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              viewMode === "grid"
                ? "bg-white text-[#D35400] shadow-xs"
                : "text-gray-500 hover:text-gray-800",
            )}
            title="Xem dạng Thẻ Grid"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Thẻ</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              viewMode === "table"
                ? "bg-white text-[#D35400] shadow-xs"
                : "text-gray-500 hover:text-gray-800",
            )}
            title="Xem dạng Bảng"
          >
            <LayoutList className="w-4 h-4" />
            <span>Bảng</span>
          </button>
        </div>
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
      ) : viewMode === "grid" ? (
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
                  {dish.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-5">
                <span className="font-bold text-gray-500">
                  {categoryMap[dish.categoryId] || "—"}
                </span>
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
                  onClick={() => openEditModal(dish)}
                  className="flex-1 py-3 bg-[#D35400]/10 text-[#D35400] rounded-2xl text-sm font-black hover:bg-[#D35400]/25 transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dish.id, dish.name)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-100 transition-all shrink-0"
                  title="Xóa món ăn"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Dạng Bảng (Table Layout) */
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Món Ăn
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Danh Mục
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Đơn Giá
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng Thái
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400 w-36">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((dish) => (
                  <tr key={dish.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                          {dish.imgUrl ? (
                            <Image
                              src={dish.imgUrl}
                              alt={dish.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 uppercase tracking-wide">
                            {dish.name}
                          </p>
                          {dish.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs mt-0.5">
                              {dish.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                        {categoryMap[dish.categoryId] || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-black text-[#D35400]">
                        {dish.price}
                        <div className="relative w-4 h-4 opacity-95">
                          <Image
                            src="/logo_point.png"
                            alt="Watermark Logo"
                            fill
                            sizes="16px"
                            className="object-contain filter brightness-110"
                          />
                        </div>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(dish)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer",
                          dish.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                        )}
                      >
                        {dish.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(dish)}
                          className="p-2 text-gray-500 hover:text-[#D35400] hover:bg-orange-50 rounded-xl transition-all"
                          title="Sửa món ăn"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dish.id, dish.name)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa món ăn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE DISH MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Món ăn mới"
        size="md"
      >
        <div className="space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-sm font-bold shadow-xs">
              ⚠️ {formError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Tên món ăn *</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Cơm tấm sườn bì chả"
                className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Mô tả món ăn *</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mô tả chi tiết món ăn..."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-3xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Giá tiền (Points) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-3xs"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Danh mục món *</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl text-base outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-3xs cursor-pointer"
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
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Hình ảnh đại diện
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-orange-50 file:text-[#D35400] hover:file:bg-orange-100/80 transition-colors cursor-pointer"
              />
              {formPreview && (
                <div className="mt-4 p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formPreview}
                    alt="Preview"
                    className="w-40 h-40 rounded-2xl object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-5">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-6 py-3 border border-gray-200/50 hover:border-gray-300 text-gray-600 rounded-2xl text-base font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-3xs"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleCreateSubmit}
              disabled={formSubmitting}
              className="px-8 py-3 bg-[#D35400] text-white rounded-2xl text-base font-black hover:bg-[#b84900] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formSubmitting ? "Đang tạo..." : "Tạo món ăn"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT DISH MODAL ── */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Sửa món ăn" size="md">
        <div className="space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-sm font-bold shadow-xs">
              ⚠️ {formError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Tên món ăn *</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Tên món ăn"
                className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Mô tả món ăn *</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mô tả chi tiết món ăn..."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-3xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Giá tiền (Points) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-3xs"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Danh mục món *</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl text-base outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-3xs cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/30 rounded-2xl p-4">
              <input
                type="checkbox"
                id="isActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-5 h-5 accent-[#D35400] rounded-sm cursor-pointer"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-bold text-gray-700 select-none cursor-pointer"
              >
                Món ăn này đang được mở phục vụ (Active)
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Hình ảnh đại diện
              </label>
              <div className="flex flex-col sm:flex-row gap-6 mb-4">
                {formExistingImgUrl && !formPreview && (
                  <div className="p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">
                      Ảnh hiện tại:
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formExistingImgUrl}
                      alt="Current"
                      className="w-36 h-36 rounded-2xl object-cover"
                    />
                  </div>
                )}
                {formPreview && (
                  <div className="p-2 bg-gray-50 border border-gray-100 rounded-3xl w-fit shadow-2xs">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">
                      Ảnh mới:
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formPreview}
                      alt="Preview"
                      className="w-36 h-36 rounded-2xl object-cover"
                    />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-orange-50 file:text-[#D35400] hover:file:bg-orange-100/80 transition-colors cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-5">
            <button
              onClick={() => setIsEditOpen(false)}
              className="px-6 py-3 border border-gray-200/50 hover:border-gray-300 text-gray-600 rounded-2xl text-base font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-3xs"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={formSubmitting}
              className="px-8 py-3 bg-[#D35400] text-white rounded-2xl text-base font-black hover:bg-[#b84900] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formSubmitting ? "Đang lưu..." : "Cập nhật món ăn"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
