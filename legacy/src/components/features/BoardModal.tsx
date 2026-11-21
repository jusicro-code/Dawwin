import { useState } from "react";
import { X, Palette, Check } from "lucide-react";
import { Board, BOARD_COLORS, BOARD_ICONS } from "@/types/boards";
import { cn } from "@/lib/utils";

// ── Shared inline dialog styles ───────────────────────────────────────────────
const INPUT_CLS =
  "w-full bg-[#ECE4D7] border border-[#DDC8B7] rounded-xl px-4 py-3 text-sm text-[#2C2A27] placeholder-[#A09880] focus:outline-none focus:ring-2 focus:ring-[#9FAC9D]/40 focus:border-[#9FAC9D] hover:border-[#9FAC9D]/60 transition-all duration-200";

// ── Board Modal (Create / Edit) ───────────────────────────────────────────────

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, icon: string) => void;
  initial?: Pick<Board, "name" | "color" | "icon"> | null;
  title?: string;
}

export function BoardModal({
  isOpen,
  onClose,
  onSave,
  initial,
  title = "مساحة عمل جديدة",
}: BoardModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? BOARD_COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? BOARD_ICONS[0]);
  const [err, setErr] = useState("");

  if (!isOpen) return null;

  function handleSave() {
    if (!name.trim()) {
      setErr("يرجى كتابة اسم المساحة");
      return;
    }
    onSave(name.trim(), color, icon);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-[#DFD8C5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDC8B7]/60">
          <h2 className="text-base font-bold text-[#2C2A27]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9FAC9D] hover:bg-[#ECE4D7] hover:text-[#5A7358] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#5A5447] mb-2 tracking-wide">
              اسم المساحة *
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="مثال: مشاريع 2026"
              className={cn(INPUT_CLS, err && "border-red-300")}
            />
            {err && (
              <p className="text-xs text-red-500 mt-1.5">{err}</p>
            )}
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-[#5A5447] mb-2 tracking-wide">
              الأيقونة
            </label>
            <div className="flex flex-wrap gap-2">
              {BOARD_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all duration-150",
                    icon === ic
                      ? "border-[#9FAC9D] bg-[#9FAC9D]/15 scale-110"
                      : "border-[#DDC8B7] bg-[#ECE4D7] hover:border-[#9FAC9D]/50"
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#5A5447] mb-2 tracking-wide">
              <Palette className="w-3.5 h-3.5" />
              اللون المميّز
            </label>
            <div className="flex flex-wrap gap-2.5">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#2C2A27" : "transparent",
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {color === c && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ borderColor: color + "60", backgroundColor: color + "15" }}
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-bold" style={{ color }}>
              {name || "اسم المساحة"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDC8B7]/60">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#5A5447] bg-[#ECE4D7] hover:bg-[#DFD8C5] border border-[#DDC8B7] transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#9FAC9D] hover:bg-[#8A9A88] transition-all shadow-sm"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Dialog (replaces window.confirm) ──────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "تأكيد",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-[#DFD8C5] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5">
          <h3 className="text-base font-bold text-[#2C2A27] mb-2">{title}</h3>
          <p className="text-sm text-[#7A7060] leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDC8B7]/60">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#5A5447] bg-[#ECE4D7] hover:bg-[#DFD8C5] border border-[#DDC8B7] transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm",
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#9FAC9D] hover:bg-[#8A9A88]"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rename Dialog (single input, replaces window.prompt) ─────────────────────

interface RenameDialogProps {
  isOpen: boolean;
  title: string;
  initial: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function RenameDialog({
  isOpen,
  title,
  initial,
  onSave,
  onClose,
}: RenameDialogProps) {
  const [value, setValue] = useState(initial);
  const [err, setErr] = useState("");

  if (!isOpen) return null;

  function handleSave() {
    if (!value.trim()) {
      setErr("الاسم لا يمكن أن يكون فارغاً");
      return;
    }
    onSave(value.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-[#DFD8C5] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDC8B7]/60">
          <h3 className="text-sm font-bold text-[#2C2A27]">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9FAC9D] hover:bg-[#ECE4D7] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={cn(INPUT_CLS, err && "border-red-300")}
          />
          {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDC8B7]/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5A5447] bg-[#ECE4D7] hover:bg-[#DFD8C5] border border-[#DDC8B7] transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#9FAC9D] hover:bg-[#8A9A88] transition-all shadow-sm"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}
