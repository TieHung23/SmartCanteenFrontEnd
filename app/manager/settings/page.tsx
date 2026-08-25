"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Edit3,
  Settings2,
  GripVertical,
  ChevronDown,
  Filter,
  X,
  Sparkles,
  Layers,
  DollarSign,
  RotateCcw,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { settingService } from "@/services/setting.service";
import type { Setting, CreateSettingPayload, UpdateSettingPayload } from "@/types/setting.types";
import Modal from "../_components/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Group theme config ───

interface GroupTheme {
  label: string;
  icon: LucideIcon;
  gradient: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
}

const GROUP_THEMES: Record<string, GroupTheme> = {
  PAYMENT: {
    label: "Thanh toán",
    icon: DollarSign,
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.25)",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
  },
  REFUND_POLICY: {
    label: "Chính sách hoàn tiền",
    icon: RotateCcw,
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.25)",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
  },
};

const DEFAULT_THEME: GroupTheme = {
  label: "Chung",
  icon: Layers,
  gradient: "from-slate-500 to-slate-600",
  glow: "rgba(100,116,139,0.2)",
  badgeBg: "bg-slate-50",
  badgeText: "text-slate-700",
};

function getGroupTheme(group: string): GroupTheme {
  return GROUP_THEMES[group] || DEFAULT_THEME;
}

// ─── Type color map ───

const TYPE_COLORS: Record<string, string> = {
  decimal: "bg-amber-50 text-amber-700 border-amber-200/50",
  string: "bg-sky-50 text-sky-700 border-sky-200/50",
  bool: "bg-rose-50 text-rose-700 border-rose-200/50",
  int: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
  json: "bg-purple-50 text-purple-700 border-purple-200/50",
  datetime: "bg-cyan-50 text-cyan-700 border-cyan-200/50",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || "bg-gray-50 text-gray-600 border-gray-200/50";
}

// ─── Scope label map ───

const SCOPE_LABELS: Record<string, string> = {
  TOP_UP: "Nạp tiền",
  MISSING_ITEM: "Thiếu món",
  NOT_RECEIVED: "Chưa nhận",
};

// ─── Shimmer Button ───

function ShimmerButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden group px-6 py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase",
        "bg-gradient-to-r from-[#D35400] to-[#E86A33] text-white shadow-lg shadow-orange-500/25",
        "hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]",
        "transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        className,
      )}
    >
      <span className="relative z-10 flex items-center gap-2.5 justify-center">{children}</span>
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
    </button>
  );
}

// ─── Main Page ───

export default function ManagerSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSettingPayload>({
    code: "",
    name: "",
    description: "",
    group: "",
    scope: "",
    value: "",
    type: "string",
  });

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateSettingPayload>({
    name: "",
    description: "",
    group: "",
    scope: "",
    value: "",
    type: "string",
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setLoading(true);
    });

    settingService
      .getSettings({ pageSize: 200 })
      .then((res) => {
        setSettings(res.items);
        const uniqueGroups = [...new Set(res.items.map((s) => s.group))];
        const uniqueScopes = [...new Set(res.items.map((s) => s.scope))];
        setGroups(uniqueGroups);
        setScopes(uniqueScopes);
        setExpandedGroups(new Set(uniqueGroups));
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    settingService
      .getSettings({
        pageSize: 200,
        ...(search && { name: search }),
        ...(groupFilter && { group: groupFilter }),
        ...(scopeFilter && { scope: scopeFilter }),
      })
      .then((res) => {
        setSettings(res.items);
        const uniqueGroups = [...new Set(res.items.map((s) => s.group))];
        const uniqueScopes = [...new Set(res.items.map((s) => s.scope))];
        setGroups(uniqueGroups);
        setScopes(uniqueScopes);
        setExpandedGroups(new Set(uniqueGroups));
      })
      .catch((err) => {
        console.error(err);
      });
  }, [search, groupFilter, scopeFilter]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const refreshSettings = useCallback(() => {
    settingService
      .getSettings({
        pageSize: 200,
        ...(search && { name: search }),
        ...(groupFilter && { group: groupFilter }),
        ...(scopeFilter && { scope: scopeFilter }),
      })
      .then((res) => {
        setSettings(res.items);
        const uniqueGroups = [...new Set(res.items.map((s) => s.group))];
        const uniqueScopes = [...new Set(res.items.map((s) => s.scope))];
        setGroups(uniqueGroups);
        setScopes(uniqueScopes);
        setExpandedGroups(new Set(uniqueGroups));
      })
      .catch((err) => {
        console.error(err);
      });
  }, [search, groupFilter, scopeFilter]);

  // ── Create ──

  const openCreateModal = () => {
    setCreateForm({
      code: "",
      name: "",
      description: "",
      group: "",
      scope: "",
      value: "",
      type: "string",
    });
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    setFormSubmitting(true);
    try {
      await settingService.createSetting(createForm);
      setIsCreateOpen(false);
      toast.success("Tạo setting thành công");
      refreshSettings();
    } catch (err: unknown) {
      const apiMsg = err instanceof Error ? err.message : "Tạo setting thất bại";
      toast.error(apiMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Edit ──

  const openEditModal = (s: Setting) => {
    if (s.group === "REFUND_POLICY") {
      toast.info("Chính sách hoàn tiền được quản lý riêng.", {
        action: { label: "Đi đến", onClick: () => router.push("/manager/refund-policies") },
        duration: 5000,
      });
      return;
    }
    setEditId(s.id);
    setEditForm({
      name: s.name,
      description: s.description,
      group: s.group,
      scope: s.scope,
      value: s.value,
      type: s.type,
    });
    setFormSubmitting(false);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    setFormSubmitting(true);
    try {
      await settingService.updateSetting(editId, editForm);
      setIsEditOpen(false);
      toast.success("Cập nhật setting thành công");
      refreshSettings();
    } catch (err: unknown) {
      const apiMsg = err instanceof Error ? err.message : "Cập nhật setting thất bại";
      toast.error(apiMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Group data ──

  const groupedSettings = groups.reduce(
    (acc, group) => {
      const items = settings.filter((s) => s.group === group);
      if (items.length > 0) acc[group] = items;
      return acc;
    },
    {} as Record<string, Setting[]>,
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D35400] to-[#E86A33] flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Settings2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Cài đặt</h1>
            <p className="text-base text-gray-500 mt-0.5">
              Quản lý cấu hình và chính sách hệ thống
            </p>
          </div>
        </div>
        <ShimmerButton onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Cài đặt mới
        </ShimmerButton>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm kiếm theo tên hoặc mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 text-base bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-gray-400 shrink-0 hidden sm:block" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-xs cursor-pointer"
          >
            <option value="">Tất cả nhóm</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-xs cursor-pointer"
          >
            <option value="">Tất cả phạm vi</option>
            {scopes.map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABELS[s] || s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#D35400]/30 border-t-[#D35400] rounded-full animate-spin" />
            <Settings2 className="w-6 h-6 text-[#D35400] absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải cài đặt...</p>
        </div>
      ) : Object.keys(groupedSettings).length === 0 ? (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 p-20 text-center shadow-xs">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,106,51,0.03)_0%,transparent_70%)]" />
          <Settings2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-lg">Không tìm thấy cài đặt nào.</p>
          <p className="text-gray-300 text-sm mt-1">Thử điều chỉnh bộ lọc hoặc tạo cài đặt mới.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([group, items]) => {
            const theme = getGroupTheme(group);
            const Icon = theme.icon;
            const isExpanded = expandedGroups.has(group);
            return (
              <div
                key={group}
                className="relative rounded-[2rem] bg-white border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-6 md:px-8 py-5 md:py-6 group/header"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md shrink-0",
                        theme.gradient,
                      )}
                      style={{ boxShadow: `0 4px 14px ${theme.glow}` }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-extrabold text-gray-900">{theme.label}</h2>
                      <p className="text-sm text-gray-400 font-medium">{items.length} cài đặt</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-6 h-6 text-gray-400 transition-transform duration-300",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>

                {/* Group content */}
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4">
                      {items.map((setting) => (
                        <div
                          key={setting.id}
                          className="relative rounded-2xl border border-gray-100 bg-white p-5 md:p-6 transition-all duration-300 hover:shadow-md hover:border-gray-200"
                          style={{
                            boxShadow: `0 2px 20px -5px ${theme.glow}`,
                          }}
                        >
                          {/* Top row: code + type badge */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                                <GripVertical className="w-4 h-4 text-gray-300" />
                              </div>
                              <div className="min-w-0">
                                <code className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider block truncate">
                                  {setting.code}
                                </code>
                                <h3 className="text-base font-extrabold text-gray-900 truncate">
                                  {setting.name}
                                </h3>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border",
                                getTypeColor(setting.type),
                              )}
                            >
                              {setting.type}
                            </span>
                          </div>

                          {/* Description */}
                          {setting.description && (
                            <p className="text-sm text-gray-500 mb-4 ml-11 leading-relaxed">
                              {setting.description}
                            </p>
                          )}

                          {/* Value + Scope + Actions */}
                          <div className="ml-11 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100/50">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  Giá trị:
                                </span>
                                <span className="text-sm font-black text-gray-900 break-all max-w-[400px]">
                                  {setting.type === "bool"
                                    ? setting.value === "true"
                                      ? "✅ Có"
                                      : "❌ Không"
                                    : setting.value}
                                </span>
                              </div>
                              <span className="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100/50 text-xs font-bold text-gray-500">
                                {SCOPE_LABELS[setting.scope] || setting.scope}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(setting)}
                                className="p-2.5 text-gray-400 hover:text-[#D35400] hover:bg-orange-50 rounded-xl border border-transparent hover:border-orange-100 transition-all"
                                title="Chỉnh sửa cấu hình"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Glow line at bottom */}
                          <div
                            className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-40"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${theme.glow.replace("0.25", "0.5")}, transparent)`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Cài đặt mới"
        size="lg"
      >
        <SettingForm
          form={createForm as unknown as Record<string, string>}
          onChange={(f) => setCreateForm({ ...createForm, ...f } as CreateSettingPayload)}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          submitting={formSubmitting}
          mode="create"
        />
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Sửa cài đặt" size="lg">
        <SettingForm
          form={editForm as unknown as Record<string, string>}
          onChange={(f) => setEditForm({ ...editForm, ...f } as UpdateSettingPayload)}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditOpen(false)}
          submitting={formSubmitting}
          mode="edit"
        />
      </Modal>
    </div>
  );
}

// ─── Setting Form Component ───

const KEY_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const BOOL_VALUES = ["true", "false", "True", "False", "1", "0"];

function validateField(field: string, value: string, form: Record<string, string>): string | null {
  if (field === "code" && value) {
    if (!KEY_PATTERN.test(value)) return "Chỉ chứa chữ, số, _, . hoặc -";
  }
  if (field === "scope" && value) {
    if (!KEY_PATTERN.test(value)) return "Chỉ chứa chữ, số, _, . hoặc -";
  }
  if (field === "value" && value) {
    const type = form.type || "string";
    if (type === "decimal" || type === "int") {
      if (isNaN(Number(value))) return `Phải là số hợp lệ cho kiểu "${type}"`;
    }
    if (type === "bool") {
      if (!BOOL_VALUES.includes(value)) return 'Phải là "true" hoặc "false"';
    }
  }
  return null;
}

function SettingForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  mode,
}: {
  form: Record<string, string>;
  onChange: (fields: Record<string, string>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  mode: "create" | "edit";
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    onChange({ [field]: value });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      const err = validateField(field, value, { ...form, [field]: value });
      if (err) next[field] = err;
      return next;
    });
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (mode === "create" && !form.code?.trim()) errors.code = "Code là bắt buộc";
    if (!form.name?.trim()) errors.name = "Tên là bắt buộc";
    if (!form.group?.trim()) errors.group = "Group là bắt buộc";

    const value = form.value?.trim() || "";
    const type = form.type || "string";
    if (type === "decimal" || type === "int") {
      if (!value || isNaN(Number(value))) errors.value = `Phải là số hợp lệ cho kiểu "${type}"`;
    } else if (type === "bool") {
      if (!BOOL_VALUES.includes(value)) errors.value = 'Phải là "true" hoặc "false"';
    }

    if (form.code && !KEY_PATTERN.test(form.code)) errors.code = "Chỉ chứa chữ, số, _, . hoặc -";
    if (form.scope && !KEY_PATTERN.test(form.scope)) errors.scope = "Chỉ chứa chữ, số, _, . hoặc -";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit();
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all shadow-xs ${
      fieldErrors[field]
        ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400"
        : "border-gray-200/50 focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
    } text-gray-900 placeholder:text-gray-400`;

  return (
    <div className="space-y-6">
      {mode === "create" && (
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Mã *</label>
          <input
            value={form.code || ""}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="VD: MAX_TOPUP_AMOUNT"
            className={inputClass("code")}
          />
          <FieldErrorComponent field="code" fieldErrors={fieldErrors} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Tên *</label>
          <input
            value={form.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Tên hiển thị"
            className={inputClass("name")}
          />
          <FieldErrorComponent field="name" fieldErrors={fieldErrors} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Giá trị *</label>
          <input
            value={form.value || ""}
            onChange={(e) => handleChange("value", e.target.value)}
            placeholder="Giá trị cài đặt"
            className={inputClass("value")}
          />
          <FieldErrorComponent field="value" fieldErrors={fieldErrors} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">Mô tả</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Mô tả ngắn về cài đặt này..."
          rows={3}
          className={inputClass("description")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Nhóm *</label>
          <input
            value={form.group || ""}
            onChange={(e) => handleChange("group", e.target.value)}
            placeholder="VD: PAYMENT"
            className={inputClass("group")}
          />
          <FieldErrorComponent field="group" fieldErrors={fieldErrors} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Phạm vi</label>
          <input
            value={form.scope || ""}
            onChange={(e) => handleChange("scope", e.target.value)}
            placeholder="VD: TOP_UP"
            className={inputClass("scope")}
          />
          <FieldErrorComponent field="scope" fieldErrors={fieldErrors} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Loại</label>
          <select
            value={form.type || "string"}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-xs cursor-pointer font-semibold"
          >
            <option value="string">string</option>
            <option value="decimal">decimal</option>
            <option value="int">int</option>
            <option value="bool">bool</option>
            <option value="json">json</option>
            <option value="datetime">datetime</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-200/60 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs"
        >
          Hủy
        </button>
        <ShimmerButton onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {mode === "create" ? "Tạo cài đặt" : "Lưu thay đổi"}
            </>
          )}
        </ShimmerButton>
      </div>
    </div>
  );
}

function FieldErrorComponent({
  field,
  fieldErrors,
}: {
  field: string;
  fieldErrors: Record<string, string>;
}) {
  return fieldErrors[field] ? (
    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
      <Shield className="w-3 h-3 shrink-0" />
      {fieldErrors[field]}
    </p>
  ) : null;
}
