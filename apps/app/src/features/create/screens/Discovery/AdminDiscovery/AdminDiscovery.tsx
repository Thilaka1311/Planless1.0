import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash, Upload, Check, X, ArrowLeft, Pencil, AlertTriangle } from "lucide-react";
import {
  ContentConfig,
  adminFetchItems,
  adminCreateItem,
  adminUpdateItem,
  adminDeleteItem,
  adminUploadImage,
} from "../../../../admin/adminContentService";
import { useToast } from "../../../../../shared/contexts/ToastContext";

// ─── AdminContextSheet ────────────────────────────────────────────────────────
// Native-feeling action sheet that appears after a long-press on a discovery card.
// Only rendered for admin users.

export interface AdminContextSheetProps {
  item: any;
  config: ContentConfig;
  token?: string;
  onClose: () => void;
  onEdit: (item: any) => void;
  onAdd: () => void;
  onDeleted: () => void;
}

export const AdminContextSheet: React.FC<AdminContextSheetProps> = ({
  item,
  config,
  token,
  onClose,
  onEdit,
  onAdd,
  onDeleted,
}) => {
  const { showToast } = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    console.log("[AdminContextSheet] handleDelete called. Target Item ID:", item.id);
    console.log("[AdminContextSheet] Auth token exists:", !!token, "Length:", token?.length || 0);
    try {
      await adminDeleteItem(item.id, token);
      console.log("[AdminContextSheet] Deletion request completed successfully");
      showToast("Card removed.");
      onDeleted();
    } catch (e: any) {
      console.error("[AdminContextSheet] Deletion request failed:", e);
      showToast(e.message || "Failed to remove card.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full flex flex-col" style={{ animation: "slideUp 0.26s cubic-bezier(0.32,0.72,0,1) both" }}>

        {/* Card preview strip */}
        <div className="mx-4 mb-2 rounded-2xl bg-[#111111] border border-white/[0.08] px-4 py-3 flex items-center gap-3">
          {item.cover_image_url ? (
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/[0.06]"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] shrink-0 flex items-center justify-center text-[#3F3F46] text-xs">
              ?
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white truncate">{item.title}</p>
            <p className="text-[12px] text-[#71717A] truncate mt-0.5">{item.location || config.title}</p>
          </div>
        </div>

        {/* Action rows */}
        <div className="mx-4 mb-2 rounded-2xl bg-[#111111] border border-white/[0.08] overflow-hidden">
          {!confirmingDelete ? (
            <>
              {/* Edit */}
              <button
                type="button"
                onClick={() => { onEdit(item); }}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors cursor-pointer border-b border-white/[0.06]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                  <Pencil className="w-3.5 h-3.5 text-[#A1A1AA]" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-white leading-tight">Edit Card</p>
                  <p className="text-[12px] text-[#71717A] mt-0.5">Modify all card properties</p>
                </div>
              </button>

              {/* Remove */}
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors cursor-pointer border-b border-white/[0.06]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                  <Trash className="w-3.5 h-3.5 text-[#EF4444]" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-[#EF4444] leading-tight">Remove Card</p>
                  <p className="text-[12px] text-[#71717A] mt-0.5">Permanently delete this card</p>
                </div>
              </button>

              {/* Add */}
              <button
                type="button"
                onClick={onAdd}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-[#A1A1AA]" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-white leading-tight">Add Card</p>
                  <p className="text-[12px] text-[#71717A] mt-0.5">Create a new {config.title.slice(0, -1).toLowerCase()}</p>
                </div>
              </button>
            </>
          ) : (
            /* Inline delete confirmation */
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white leading-tight">Remove this card?</p>
                  <p className="text-[13px] text-[#71717A] mt-1 leading-relaxed">
                    This action can't be undone. The card will be removed for all users immediately.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl bg-transparent border border-white/[0.12] text-[#A1A1AA] text-[14px] font-medium active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl bg-[#EF4444] text-white text-[14px] font-semibold active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {deleting ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cancel */}
        <div className="mx-4 mb-8">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-13 rounded-2xl bg-[#111111] border border-white/[0.06] text-[#A1A1AA] text-[15px] font-medium active:scale-98 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── AdminDrawer ──────────────────────────────────────────────────────────────
// Slide-up sheet for creating a new discovery card. Used by "Add Card" action.

export interface AdminDrawerProps {
  config: ContentConfig;
  token?: string;
  onClose: () => void;
  onMutated: () => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({ config, token, onClose, onMutated }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    config.fields.forEach((f) => { init[f.name] = f.defaultValue ?? ""; });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const set = (name: string, value: any) =>
    setFormData((p) => ({ ...p, [name]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      set(fieldName, await adminUploadImage(file));
      showToast("Image uploaded.");
    } catch (e: any) {
      showToast(e.message || "Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminCreateItem(formData, config, token);
      showToast("Card created.");
      onMutated();
    } catch (e: any) {
      showToast(e.message || "Failed to create card.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full bg-[#09090C] rounded-t-3xl border-t border-white/[0.06] flex flex-col max-h-[92vh] overflow-hidden"
        style={{ animation: "slideUp 0.26s cubic-bezier(0.32,0.72,0,1) both" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#3F3F46]" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[16px] font-semibold text-white leading-tight">
              New {config.title.slice(0, -1)}
            </h3>
            <p className="text-[10px] font-medium text-[#71717A] uppercase tracking-widest mt-0.5">Admin CMS</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#111111] border border-white/[0.08] flex items-center justify-center text-[#71717A] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-6">
          {config.fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-[#71717A] uppercase tracking-[0.12em]">
                {field.label} {field.required && <span className="text-[#EF4444]">*</span>}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111111] border border-white/[0.08] text-white text-[14px] placeholder-[#3F3F46] focus:outline-none focus:border-white/20 transition-colors"
                />
              )}

              {field.type === "textarea" && (
                <textarea
                  rows={3}
                  value={formData[field.name] || ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-white/[0.08] text-white text-[14px] placeholder-[#3F3F46] focus:outline-none focus:border-white/20 transition-colors resize-none"
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  required={field.required}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => set(field.name, Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111111] border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-colors"
                />
              )}

              {field.type === "select" && (
                <select
                  value={formData[field.name] || ""}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#111111] border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#111111]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "boolean" && (
                <label className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData[field.name]}
                    onChange={(e) => set(field.name, e.target.checked)}
                    className="w-4 h-4 rounded border-[#3F3F46] bg-[#111111] focus:ring-0 cursor-pointer accent-white"
                  />
                  <span className="text-[14px] text-[#A1A1AA] font-normal">{field.label}</span>
                </label>
              )}

              {field.type === "image" && (
                <div className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#111111] border border-white/[0.08] flex items-center justify-center shrink-0">
                    {formData[field.name] ? (
                      <img src={formData[field.name]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#3F3F46] text-[10px]">None</span>
                    )}
                  </div>
                  <label className="flex-1 h-9 px-4 rounded-xl bg-[#111111] border border-white/[0.08] text-[12px] font-medium text-[#A1A1AA] flex items-center justify-center gap-2 hover:text-white transition-colors active:scale-95 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImage ? "Uploading…" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploadingImage}
                      onChange={(e) => handleImageUpload(e, field.name)}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full h-12 rounded-2xl bg-white text-black text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {loading ? "Creating…" : "Create Card"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
