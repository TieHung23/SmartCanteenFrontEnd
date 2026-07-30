"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Search, Trash2, Tag, LayoutGrid, LayoutList, Pencil } from "lucide-react";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types/category.types";
import { cn } from "@/lib/utils";
import Modal from "../_components/modal";

export default function CategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal & Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const [formExistingImgUrl, setFormExistingImgUrl] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    if (!confirm(`Xóa danh mục "${name}"?`)) return;
    try {
      await categoryService.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Form handlers
  const openCreateModal = () => {
    setFormName("");
    setFormDescription("");
    setFormImage(null);
    setFormPreview(null);
    setFormExistingImgUrl(null);
    setFormError(null);
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setFormImage(null);
    setFormPreview(null);
    setFormExistingImgUrl(cat.imgUrl || null);
    setFormError(null);
    setFormSubmitting(false);
    setIsEditOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const setPreview = (value: string | null) => {
    setFormPreview(value);
  };

  const handleCreateSubmit = async () => {
    if (!formName.trim()) {
      setFormError("Tên danh mục là bắt buộc.");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      await categoryService.create({
        name: formName.trim(),
        description: formDescription.trim(),
        image: formImage,
      });
      setIsCreateOpen(false);
      fetchCategories(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Tạo danh mục thất bại");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    if (!formName.trim()) {
      setFormError("Tên danh mục là bắt buộc.");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      await categoryService.update(editId, {
        name: formName.trim(),
        description: formDescription.trim(),
        image: formImage || undefined,
      });
      setIsEditOpen(false);
      fetchCategories(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Cập nhật danh mục thất bại");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Danh mục</h1>
          <p className="text-lg text-gray-500 mt-1.5">Quản lý và thiết lập danh mục món ăn.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="shrink-0 flex items-center justify-center gap-3 px-6 py-4 bg-[#D35400] text-white rounded-2xl font-black text-base hover:bg-[#b84900] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Danh mục mới
        </button>
      </div>

      {/* Search Bar & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
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
            className="px-6 py-3.5 bg-gray-900 text-white rounded-3xl text-base font-bold hover:bg-gray-800 transition-all shadow-xs active:scale-98 shrink-0"
          >
            Tìm kiếm
          </button>
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
          <p className="text-base font-bold text-gray-500">Đang tải danh sách danh mục...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-xs">
          <p className="text-gray-400 font-bold text-lg">Chưa có danh mục nào được khởi tạo.</p>
        </div>
      ) : viewMode === "grid" ? (
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
                  onClick={() => openEditModal(category)}
                  className="flex-1 py-3 bg-[#D35400]/10 text-[#D35400] rounded-2xl text-sm font-black hover:bg-[#D35400]/25 transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-100 transition-all shrink-0"
                  title="Xóa danh mục"
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
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400 w-24">
                    Hình ảnh
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tên Danh Mục
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Mô Tả
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400 w-36">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                        {category.imgUrl ? (
                          <Image
                            src={category.imgUrl}
                            alt={category.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <Tag className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-black text-gray-900 uppercase tracking-wide">
                        {category.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-md">
                      <p className="line-clamp-2">
                        {category.description || "Chưa có mô tả cho danh mục này."}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 text-gray-500 hover:text-[#D35400] hover:bg-orange-50 rounded-xl transition-all"
                          title="Sửa danh mục"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa danh mục"
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

      {/* ── CREATE CATEGORY MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Danh mục mới"
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
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                Tên danh mục *
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Đồ ăn chính, Thức uống"
                className="w-full px-4 py-3.5 text-base bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn về danh mục..."
                rows={4}
                className="w-full px-4 py-3.5 text-base bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                Hình ảnh đại diện
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-base text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-sm file:font-black file:uppercase file:bg-orange-50 file:text-[#D35400] hover:file:bg-orange-100/80 transition-colors cursor-pointer"
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
              {formSubmitting ? "Đang tạo..." : "Tạo danh mục"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT CATEGORY MODAL ── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Sửa danh mục"
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
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                Tên danh mục *
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Tên danh mục"
                className="w-full px-4 py-3.5 text-base bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mô tả danh mục"
                rows={4}
                className="w-full px-4 py-3.5 text-base bg-white border border-gray-200/35 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-3xs"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider mb-2">
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
                className="w-full text-base text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-sm file:font-black file:uppercase file:bg-orange-50 file:text-[#D35400] hover:file:bg-orange-100/80 transition-colors cursor-pointer"
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
              {formSubmitting ? "Đang lưu..." : "Cập nhật danh mục"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
