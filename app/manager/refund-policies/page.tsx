"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  RotateCcw,
  Trash2,
  Edit3,
  Search,
  X,
  Sparkles,
  Shield,
  AlertCircle,
} from "lucide-react";
import { refundPolicyService } from "@/services/refund-policy.service";
import type {
  RefundPolicy,
  CreateRefundPolicyPayload,
  UpdateRefundPolicyPayload,
} from "@/types/refund-policy.types";
import Modal from "../_components/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Swal from "sweetalert2";

export function extractApiErrorMessage(err: unknown): {
  message: string;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  let message = "Đã có lỗi xảy ra. Vui lòng kiểm tra lại.";

  if (typeof err === "object" && err !== null && "response" in err) {
    const responseData = (
      err as {
        response?: {
          data?: {
            errors?: Record<string, string[] | string>;
            message?: string;
            detail?: string;
            reason?: string;
            title?: string;
          };
        };
      }
    ).response?.data;
    if (responseData) {
      if (responseData.errors && typeof responseData.errors === "object") {
        const errorList: string[] = [];
        Object.entries(responseData.errors).forEach(([field, msgs]) => {
          const fieldMsgs = Array.isArray(msgs) ? msgs : [String(msgs)];
          fieldMsgs.forEach((msg: string) => {
            let translated = msg;
            const fieldLower = field.toLowerCase();

            if (msg.includes("not in the correct format") || msg.includes("format")) {
              if (fieldLower === "code") {
                translated =
                  "Mã chính sách (Code) không đúng định dạng. Chỉ được sử dụng chữ cái tiếng Anh viết hoa không dấu, số và dấu gạch dưới (VD: SPOILED, KHONG_CON_NHU_CAU).";
              } else {
                translated = `Trường '${field}' không đúng định dạng.`;
              }
            } else if (msg.includes("must not be empty") || msg.includes("required")) {
              translated = `Trường '${field}' không được để trống.`;
            } else if (msg.includes("between") || msg.includes("range")) {
              translated = `Trường '${field}' có giá trị vượt quá phạm vi cho phép (1-100%).`;
            }

            fieldErrors[fieldLower] = translated;
            errorList.push(translated);
          });
        });

        if (errorList.length > 0) {
          message = errorList.join("\n");
          return { message, fieldErrors };
        }
      }

      if (responseData.message) {
        message = responseData.message;
      } else if (responseData.detail) {
        message = responseData.detail;
      } else if (responseData.reason) {
        message = responseData.reason;
      } else if (
        responseData.title &&
        responseData.title !== "One or more validation errors occurred."
      ) {
        message = responseData.title;
      }
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (
    message.includes("Code is not in the correct format") ||
    message.includes("'Code' is not in the correct format")
  ) {
    message =
      "Mã chính sách (Code) không đúng định dạng. Chỉ được sử dụng chữ cái tiếng Anh viết hoa không dấu, số và dấu gạch dưới (VD: SPOILED, KHONG_CON_NHU_CAU).";
    fieldErrors["code"] = message;
  } else if (message.includes("already exists") || message.includes("Duplicate")) {
    message = "Mã chính sách này đã tồn tại trong hệ thống. Vui lòng dùng mã khác.";
    fieldErrors["code"] = message;
  }

  return { message, fieldErrors };
}

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
        "relative overflow-hidden group px-7 py-4 rounded-2xl font-black text-base tracking-wider uppercase",
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

export default function ManagerRefundPoliciesPage() {
  const [policies, setPolicies] = useState<RefundPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRefundPolicyPayload>({
    code: "",
    name: "",
    description: "",
    percent: 0,
    requiresImage: false,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateRefundPolicyPayload>({
    code: "",
    name: "",
    description: "",
    percent: 0,
    requiresImage: false,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchPolicies = async () => {
    try {
      const res = await refundPolicyService.list();
      setPolicies(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initial = async () => {
      setLoading(true);
      try {
        await fetchPolicies();
      } finally {
        setLoading(false);
      }
    };
    initial();
  }, []);

  const openCreateModal = () => {
    setCreateForm({ code: "", name: "", description: "", percent: 0, requiresImage: false });
    setFieldErrors({});
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    setFieldErrors({});

    const code = createForm.code.trim();
    const name = createForm.name.trim();
    const percent = createForm.percent;

    const errors: Record<string, string> = {};

    if (!code) {
      errors.code = "Vui lòng nhập Mã chính sách (Code).";
    } else if (!/^[A-Za-z0-9_]+$/.test(code)) {
      errors.code = "Mã chính sách (Code) không đúng định dạng.";
    }

    if (!name) {
      errors.name = "Vui lòng nhập Tên chính sách (Name).";
    }

    if (!percent || percent <= 0 || percent > 100) {
      errors.percent = "Phần trăm hoàn tiền (Percent) phải từ 1% đến 100%.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstMsg = Object.values(errors)[0];
      toast.error(firstMsg);
      return;
    }

    setFormSubmitting(true);
    try {
      await refundPolicyService.create({
        ...createForm,
        code,
        name,
      });
      setIsCreateOpen(false);
      toast.success("Tạo chính sách hoàn tiền thành công!");
      fetchPolicies();
    } catch (err: unknown) {
      const { message, fieldErrors: serverFieldErrors } = extractApiErrorMessage(err);
      setFieldErrors(serverFieldErrors);
      toast.error(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (p: RefundPolicy) => {
    setEditCode(p.code);
    setEditForm({
      code: p.code,
      name: p.name,
      description: p.description,
      percent: p.percent,
      requiresImage: p.requiresImage,
    });
    setFieldErrors({});
    setFormSubmitting(false);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editCode) return;
    setFieldErrors({});

    const name = editForm.name.trim();
    const percent = editForm.percent;

    const errors: Record<string, string> = {};

    if (!name) {
      errors.name = "Vui lòng nhập Tên chính sách (Name).";
    }

    if (!percent || percent <= 0 || percent > 100) {
      errors.percent = "Phần trăm hoàn tiền (Percent) phải từ 1% đến 100%.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstMsg = Object.values(errors)[0];
      toast.error(firstMsg);
      return;
    }

    setFormSubmitting(true);
    try {
      await refundPolicyService.update(editCode, {
        ...editForm,
        name,
      });
      setIsEditOpen(false);
      toast.success("Cập nhật chính sách hoàn tiền thành công!");
      fetchPolicies();
    } catch (err: unknown) {
      const { message, fieldErrors: serverFieldErrors } = extractApiErrorMessage(err);
      setFieldErrors(serverFieldErrors);
      toast.error(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = (code: string, name: string) => {
    Swal.fire({
      title: "Xoá chính sách hoàn tiền này?",
      text: `Bạn có chắc muốn xoá "${name}"? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await refundPolicyService.delete(code);
        setPolicies((prev) => prev.filter((p) => p.code !== code));
        toast.success(`Đã xoá "${name}"`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Xoá thất bại");
      }
    });
  };

  const filtered = policies.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <RotateCcw className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Refund Policies</h1>
            <p className="text-base text-gray-500 mt-0.5">
              Manage refund policy rules and percentages
            </p>
          </div>
        </div>
        <ShimmerButton onClick={openCreateModal}>
          <Plus className="w-5 h-5" /> Thêm Chính Sách Mới
        </ShimmerButton>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            placeholder="Search by code, name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-12 py-4 text-base bg-gray-50/80 border border-gray-200/80 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <RotateCcw className="w-6 h-6 text-violet-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-base font-bold text-gray-500">Loading refund policies...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-16 text-center shadow-xs">
          <RotateCcw className="w-16 h-16 text-gray-200 mx-auto" />
          <p className="text-gray-400 font-bold text-lg">
            {search ? "No policies match your search." : "No refund policies yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-gray-100 bg-gray-50/70">
                <tr>
                  <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400">
                    Code
                  </th>
                  <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400">
                    Name
                  </th>
                  <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400">
                    Description
                  </th>
                  <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400 w-32">
                    Percent
                  </th>
                  <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400 w-32">
                    Requires Image
                  </th>
                  <th className="px-8 py-5 text-right text-sm font-black uppercase tracking-wider text-gray-400 w-36">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {filtered.map((policy, idx) => (
                  <tr
                    key={policy.code}
                    className="transition-all duration-200 hover:bg-orange-50/30 animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` } as React.CSSProperties}
                  >
                    <td className="px-8 py-5">
                      <code className="text-base font-mono font-bold text-violet-600 uppercase tracking-wider">
                        {policy.code}
                      </code>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-base font-black text-gray-900">{policy.name}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-base text-gray-500 line-clamp-1">
                        {policy.description || "—"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-xl text-sm font-bold">
                        <Shield className="w-4 h-4" />
                        {policy.percent}%
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {policy.requiresImage ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-50 text-sky-700 border border-sky-200/50 rounded-xl text-sm font-bold">
                          Requires Image
                        </span>
                      ) : (
                        <span className="text-base text-gray-400 font-semibold">—</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(policy)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm"
                          title="Edit"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.code, policy.name)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-red-50 hover:text-red-500 hover:shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo mới chính sách hoàn tiền"
        size="lg"
      >
        <RefundPolicyForm
          form={createForm}
          onChange={(f) => setCreateForm({ ...createForm, ...f })}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          submitting={formSubmitting}
          mode="create"
          fieldErrors={fieldErrors}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Chỉnh sửa chính sách hoàn tiền"
        size="lg"
      >
        {editCode && (
          <RefundPolicyForm
            form={editForm}
            onChange={(f) => setEditForm({ ...editForm, ...f })}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            submitting={formSubmitting}
            mode="edit"
            fieldErrors={fieldErrors}
          />
        )}
      </Modal>
    </div>
  );
}

function RefundPolicyForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  mode,
  fieldErrors,
}: {
  form: CreateRefundPolicyPayload | UpdateRefundPolicyPayload;
  onChange: (fields: Record<string, string | number | boolean>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  mode: "create" | "edit";
  fieldErrors?: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      {mode === "create" && (
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Mã chính sách (Code) <span className="text-red-400">*</span>
          </label>
          <input
            value={form.code || ""}
            onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
            placeholder="VD: SPOILED hoặc KHONG_CON_NHU_CAU"
            className={cn(
              "w-full px-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 font-mono font-bold uppercase tracking-wider transition-all shadow-xs",
              fieldErrors?.code
                ? "border-red-400 bg-red-50/20 ring-2 ring-red-500/20"
                : "border-gray-200/50",
            )}
          />
          {fieldErrors?.code ? (
            <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{fieldErrors.code}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Chỉ được sử dụng chữ cái tiếng Anh viết hoa không dấu, số và dấu gạch dưới (VD:
              SPOILED, KHONG_CON_NHU_CAU).
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">
          Tên hiển thị (Name) <span className="text-red-400">*</span>
        </label>
        <input
          value={form.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="VD: Không còn nhu cầu sử dụng"
          className={cn(
            "w-full px-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs",
            fieldErrors?.name
              ? "border-red-400 bg-red-50/20 ring-2 ring-red-500/20"
              : "border-gray-200/50",
          )}
        />
        {fieldErrors?.name && (
          <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{fieldErrors.name}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">Mô tả (Description)</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Mô tả chi tiết lý do/điều kiện áp dụng..."
          rows={3}
          className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Phần trăm hoàn tiền (%) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={form.percent || ""}
            onChange={(e) => onChange({ percent: parseInt(e.target.value) || 0 })}
            placeholder="VD: 100"
            className={cn(
              "w-full px-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs",
              fieldErrors?.percent
                ? "border-red-400 bg-red-50/20 ring-2 ring-red-500/20"
                : "border-gray-200/50",
            )}
          />
          {fieldErrors?.percent ? (
            <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{fieldErrors.percent}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Tỷ lệ % hoàn tiền theo giá trị đơn hàng (1 - 100%)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Yêu cầu hình ảnh minh họa
          </label>
          <div className="flex items-center gap-4 h-full pt-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.requiresImage}
                onChange={(e) => onChange({ requiresImage: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#D35400] peer-focus:ring-2 peer-focus:ring-[#D35400]/20 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-semibold text-gray-700">
              {form.requiresImage ? "Có (Bắt buộc tải ảnh)" : "Không bắt buộc"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-200/60 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs"
        >
          Hủy
        </button>
        <ShimmerButton onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
              Đang lưu...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />{" "}
              {mode === "create" ? "Tạo chính sách" : "Lưu thay đổi"}
            </>
          )}
        </ShimmerButton>
      </div>
    </div>
  );
}
