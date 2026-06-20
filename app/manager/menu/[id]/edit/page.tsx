"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
      setError("Dish name is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Price must be > 0.");
      return;
    }
    if (!categoryId) {
      setError("Category is required.");
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Dish</h1>
        <p className="text-sm text-gray-500 mt-1">Update dish information</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (Point) *</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Active</label>
          <button
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              isActive ? "bg-green-500" : "bg-gray-300",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                isActive && "translate-x-5",
              )}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#D35400]/10 file:text-[#D35400] hover:file:bg-[#D35400]/20"
          />
          {(preview || existingImg) && (
            <Image
              src={preview || existingImg || ""}
              alt="Preview"
              width={128}
              height={128}
              className="mt-3 w-32 h-32 object-cover rounded-xl border border-gray-200"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push("/manager/menu")}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            "px-6 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm",
            submitting ? "opacity-60 cursor-not-allowed" : "hover:bg-[#b84900]",
          )}
        >
          {submitting ? "Updating..." : "Update Dish"}
        </button>
      </div>
    </div>
  );
}
