"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { sessionService } from "@/services/session.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import type { CreateSessionRequest, CreateSessionTemplate } from "@/types/session.types";
import { cn } from "@/lib/utils";

export default function NewSessionPage() {
  const router = useRouter();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [availableForOrder, setAvailableForOrder] = useState("");

  const [dishSearch, setDishSearch] = useState("");
  const [selectedDishes, setSelectedDishes] = useState<Record<string, number>>({});
  const [templates, setTemplates] = useState<CreateSessionTemplate[]>([
    {
      name: "Suất chuẩn",
      settings: [],
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dishResult, catResult] = await Promise.all([
          dishService.getDishes({ isActive: true, pageSize: 100 }),
          categoryService.getAll(),
        ]);
        setDishes(dishResult.items);
        setCategories(catResult.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDishes = useMemo(
    () =>
      dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
          d.categoryName?.toLowerCase().includes(dishSearch.toLowerCase()),
      ),
    [dishes, dishSearch],
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );

  const toggleDish = (dishId: string) => {
    setSelectedDishes((prev) => {
      const next = { ...prev };
      if (next[dishId]) {
        delete next[dishId];
      } else {
        next[dishId] = 1;
      }
      return next;
    });
  };

  const updateDishQty = (dishId: string, qty: number) => {
    setSelectedDishes((prev) => ({
      ...prev,
      [dishId]: Math.max(1, qty),
    }));
  };

  const addTemplate = () => {
    setTemplates((prev) => [
      ...prev,
      {
        name: "",
        settings: [],
      },
    ]);
  };

  const removeTemplate = (idx: number) => {
    setTemplates((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTemplateName = (idx: number, val: string) => {
    setTemplates((prev) => prev.map((t, i) => (i === idx ? { ...t, name: val } : t)));
  };

  const updateTemplateSetting = (
    tIdx: number,
    sIdx: number,
    field: "minQuantity" | "maxQuantity" | "isRequired",
    value: number | boolean,
  ) => {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx
          ? {
              ...t,
              settings: t.settings.map((s, j) => (j === sIdx ? { ...s, [field]: value } : s)),
            }
          : t,
      ),
    );
  };

  const addTemplateSetting = (tIdx: number, categoryId: string) => {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx
          ? {
              ...t,
              settings: [
                ...t.settings,
                { categoryId, minQuantity: 0, maxQuantity: 1, isRequired: false },
              ],
            }
          : t,
      ),
    );
  };

  const removeTemplateSetting = (tIdx: number, sIdx: number) => {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx ? { ...t, settings: t.settings.filter((_, j) => j !== sIdx) } : t,
      ),
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Session name is required.";
    if (!description.trim()) return "Description is required.";
    if (!availableFrom) return "Start time is required.";
    if (!availableTo) return "End time is required.";
    if (!availableForOrder) return "Order open time is required.";
    if (new Date(availableFrom) >= new Date(availableTo))
      return "Start time must be before end time.";
    if (new Date(availableForOrder) >= new Date(availableFrom))
      return "Order open time must be before session start.";
    if (Object.keys(selectedDishes).length === 0) return "Select at least one dish.";
    if (templates.some((t) => !t.name.trim())) return "All meal templates need a name.";
    for (const t of templates) {
      for (const s of t.settings) {
        if (s.maxQuantity < s.minQuantity) return "Max quantity must be >= min quantity.";
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: CreateSessionRequest = {
      name: name.trim(),
      description: description.trim(),
      availableFrom: new Date(availableFrom).toISOString(),
      availableTo: new Date(availableTo).toISOString(),
      availableForOrder: new Date(availableForOrder).toISOString(),
      dishes: Object.entries(selectedDishes).map(([dishId, quantity]) => ({
        dishId,
        quantity,
      })),
      mealTemplates: templates
        .filter((t) => t.name.trim())
        .map((t) => ({
          name: t.name.trim(),
          settings: t.settings,
        })),
    };

    try {
      const result = await sessionService.createSession(payload);
      setSuccess({ id: result.value.id, name: result.value.name });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create session";
      setError(msg);
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

  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Session Created!</h2>
        <p className="text-gray-500">
          <span className="font-semibold text-gray-700">{success.name}</span> has been created
          successfully.
        </p>
        <p className="text-xs text-gray-400 font-mono">ID: {success.id}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => router.push(`/manager/sessions/${success.id}`)}
            className="px-5 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold hover:bg-[#b84900] transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => router.push("/manager/sessions")}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Session</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new meal serving session</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Buổi trưa thứ 2"'
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of the session"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input
              type="datetime-local"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
            <input
              type="datetime-local"
              value={availableTo}
              onChange={(e) => setAvailableTo(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Open Time *
            </label>
            <input
              type="datetime-local"
              value={availableForOrder}
              onChange={(e) => setAvailableForOrder(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
            />
            <p className="text-xs text-gray-400 mt-1">
              When users can start ordering (must be before start time)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Select Dishes</h2>
        <input
          placeholder="🔍 Search dishes..."
          value={dishSearch}
          onChange={(e) => setDishSearch(e.target.value)}
          className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
        />
        <div className="max-h-72 overflow-y-auto space-y-1 border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filteredDishes.map((dish) => {
            const isSelected = dish.id in selectedDishes;
            return (
              <div
                key={dish.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  isSelected ? "bg-orange-50/50" : "hover:bg-gray-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleDish(dish.id)}
                  className="accent-[#D35400] w-4 h-4 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{dish.name}</p>
                  <p className="text-xs text-gray-400">{dish.categoryName || "—"}</p>
                </div>
                <span className="text-xs font-semibold text-gray-500 w-20 text-right">
                  {dish.price} Point
                </span>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Qty:</label>
                    <input
                      type="number"
                      min={1}
                      value={selectedDishes[dish.id]}
                      onChange={(e) => updateDishQty(dish.id, Number(e.target.value))}
                      className="w-20 h-8 px-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {filteredDishes.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No dishes found.</div>
          )}
        </div>
        {Object.keys(selectedDishes).length > 0 && (
          <p className="text-xs text-gray-500">
            {Object.keys(selectedDishes).length} dish(es) selected —{" "}
            {Object.values(selectedDishes).reduce((a, b) => a + b, 0)} total quantity
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Meal Templates</h2>
          <button
            onClick={addTemplate}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            + Add Template
          </button>
        </div>
        {templates.length === 0 && <p className="text-sm text-gray-400">No templates added yet.</p>}
        {templates.map((template, tIdx) => (
          <div key={tIdx} className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <input
                placeholder="Template name..."
                value={template.name}
                onChange={(e) => updateTemplateName(tIdx, e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
              />
              <button
                onClick={() => removeTemplate(tIdx)}
                className="ml-3 text-red-400 hover:text-red-500 text-sm font-medium"
              >
                Remove
              </button>
            </div>
            <div className="space-y-2">
              {template.settings.map((setting, sIdx) => {
                const cat = categoryMap[setting.categoryId];
                return (
                  <div
                    key={sIdx}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-gray-700 min-w-[100px]">
                      {cat?.name || "—"}
                    </span>
                    <label className="text-xs text-gray-500">Min:</label>
                    <input
                      type="number"
                      min={0}
                      value={setting.minQuantity}
                      onChange={(e) =>
                        updateTemplateSetting(tIdx, sIdx, "minQuantity", Number(e.target.value))
                      }
                      className="w-16 h-7 px-2 rounded border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                    />
                    <label className="text-xs text-gray-500">Max:</label>
                    <input
                      type="number"
                      min={0}
                      value={setting.maxQuantity}
                      onChange={(e) =>
                        updateTemplateSetting(tIdx, sIdx, "maxQuantity", Number(e.target.value))
                      }
                      className="w-16 h-7 px-2 rounded border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        checked={setting.isRequired}
                        onChange={(e) =>
                          updateTemplateSetting(tIdx, sIdx, "isRequired", e.target.checked)
                        }
                        className="accent-[#D35400] w-3.5 h-3.5"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => removeTemplateSetting(tIdx, sIdx)}
                      className="ml-auto text-red-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories
                .filter((c) => !template.settings.some((s) => s.categoryId === c.id))
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => addTemplateSetting(tIdx, cat.id)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                  >
                    + {cat.name}
                  </button>
                ))}
            </div>
            {categories.filter((c) => !template.settings.some((s) => s.categoryId === c.id))
              .length === 0 && <p className="text-xs text-gray-400">All categories added.</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push("/manager/sessions")}
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
          {submitting ? "Creating..." : "Create Session"}
        </button>
      </div>
    </div>
  );
}
