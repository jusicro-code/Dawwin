import { Calendar, Clock, MoreVertical, Edit2, Trash2, User } from "lucide-react";
import { Project } from "@/types";
import { formatCurrency, formatDate, getRemainingDays, cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, PRODUCTION_TYPE_COLORS, DEFAULT_TYPE_COLOR, CATEGORY_LABELS, CATEGORY_ICONS } from "@/constants";
import { useState, useRef, useEffect } from "react";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  showCategory?: boolean;
}

// Category-based card accent colors (matching StatsCards gradients)
const CATEGORY_CARD_STYLES: Record<string, {
  border: string;
  headerBg: string;
  dot: string;
  badge: string;
}> = {
  personal: {
    border: "border-[#B88A62]/50",
    headerBg: "bg-gradient-to-r from-[#B88A62]/12 to-[#8F6840]/6",
    dot: "bg-[#B88A62]",
    badge: "bg-[#B88A62]/12 text-[#6B4A20] border-[#B88A62]/35",
  },
  corporate: {
    border: "border-[#486A6C]/50",
    headerBg: "bg-gradient-to-r from-[#486A6C]/12 to-[#2E4F51]/6",
    dot: "bg-[#486A6C]",
    badge: "bg-[#486A6C]/12 text-[#1E3E40] border-[#486A6C]/35",
  },
  major: {
    border: "border-[#7A5E8A]/50",
    headerBg: "bg-gradient-to-r from-[#7A5E8A]/12 to-[#5A3E6A]/6",
    dot: "bg-[#7A5E8A]",
    badge: "bg-[#7A5E8A]/12 text-[#4A2E5A] border-[#7A5E8A]/35",
  },
};

// Muted style for projects with no delivery date
const UNDATED_STYLE = {
  border: "border-[#B0A898]/40",
  headerBg: "bg-gradient-to-r from-[#B0A898]/10 to-[#9A9088]/5",
  dot: "bg-[#B0A898]",
  badge: "bg-[#B0A898]/12 text-[#6A6055] border-[#B0A898]/35",
};

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  showCategory = false,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusStyle = STATUS_COLORS[project.status];
  const typeStyle =
    PRODUCTION_TYPE_COLORS[project.productionType] || DEFAULT_TYPE_COLOR;

  const remainingBalance =
    project.contractValue - (project.advancePayment + project.finalPayment);
  const isFullyPaid = remainingBalance <= 0;

  const hasDeliveryDate = Boolean(project.deliveryDate);
  const rawDays = hasDeliveryDate ? getRemainingDays(project.deliveryDate) : null;
  // Only show days if future (>= 0)
  const remainingDays = rawDays !== null && rawDays >= 0 ? rawDays : null;
  const isUrgent = remainingDays !== null && remainingDays <= 7;

  // Decide card style: no delivery date → muted gray, else by category
  const cardStyle = hasDeliveryDate
    ? (CATEGORY_CARD_STYLES[project.category] ?? CATEGORY_CARD_STYLES.personal)
    : UNDATED_STYLE;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border-2 overflow-hidden",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group animate-fade-in",
        cardStyle.border
      )}
    >
      {/* Colored Header Strip */}
      <div className={cn("px-5 pt-4 pb-3", cardStyle.headerBg)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Category + no-date badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border",
                  cardStyle.badge
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    cardStyle.dot
                  )}
                />
                {CATEGORY_ICONS[project.category]}{" "}
                {CATEGORY_LABELS[project.category]}
              </span>
              {!hasDeliveryDate && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#9A9088]/10 text-[#6A6055] border border-[#B0A898]/30">
                  غير مجدول
                </span>
              )}
            </div>

            <h3 className="text-[15px] font-bold text-[#1A1917] leading-tight truncate mb-1">
              {project.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[#5A5447]">
              <User className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="text-xs font-semibold truncate opacity-80">
                {project.client}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#89999A] hover:bg-white/60 hover:text-[#3D6B3A] transition-all duration-150"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-9 bg-white rounded-xl shadow-lg border border-[#DFD8C5] py-1 z-20 min-w-[130px] animate-fade-in">
                <button
                  onClick={() => {
                    onEdit(project);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#4A4540] hover:bg-[#ECE4D7] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#89999A]" />
                  تعديل
                </button>
                <button
                  onClick={() => {
                    onDelete(project.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 pt-3">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={cn(
              "inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg border",
              typeStyle
            )}
          >
            {project.productionType}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border",
              statusStyle.bg,
              statusStyle.text,
              statusStyle.border
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-[#EEE8DE] my-3" />

        {/* Financial Breakdown */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7A7060] font-medium">
              إجمالي العقد
            </span>
            <span className="text-sm font-extrabold text-[#2C2A27]">
              {formatCurrency(project.contractValue)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#9A8E80]">مقدم:</span>
              <span className="text-[11px] font-semibold text-[#5A7358]">
                {formatCurrency(project.advancePayment)}
              </span>
            </div>
            <div className="w-px h-3 bg-[#DDD8CE]" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#9A8E80]">نهائي:</span>
              <span className="text-[11px] font-semibold text-[#5A7358]">
                {formatCurrency(project.finalPayment)}
              </span>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 border",
              isFullyPaid
                ? "bg-[#3D7A3A]/12 border-[#5A9A57]/40"
                : "bg-[#C4604A]/08 border-[#C4604A]/30"
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold",
                isFullyPaid ? "text-[#2D5E2A]" : "text-[#7A3020]"
              )}
            >
              {isFullyPaid ? "✓ مسدد بالكامل" : "المتبقي"}
            </span>
            <span
              className={cn(
                "text-sm font-extrabold",
                isFullyPaid ? "text-[#2D5E2A]" : "text-[#C4604A]"
              )}
            >
              {isFullyPaid ? formatCurrency(0) : formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>

        {/* Dates + Remaining Days */}
        <div className="space-y-1.5">
          {(project.startDate || hasDeliveryDate) && (
            <div className="flex items-center justify-between flex-wrap gap-1">
              {project.startDate && (
                <div className="flex items-center gap-1.5 text-[#5A5447]">
                  <Calendar className="w-3 h-3 text-[#9FAC9D]" />
                  <span className="text-[10px] text-[#9A8E80]">بدء:</span>
                  <span className="text-[10.5px] font-medium">
                    {formatDate(project.startDate)}
                  </span>
                </div>
              )}
              {hasDeliveryDate && (
                <div className="flex items-center gap-1.5 text-[#5A5447]">
                  <Calendar className="w-3.5 h-3.5 text-[#9FAC9D]" />
                  <span className="text-xs font-medium">
                    {formatDate(project.deliveryDate)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* No-date placeholder */}
          {!hasDeliveryDate && project.status !== "fully_settled" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F0EBE3] border border-[#E0D8CE]">
              <Calendar className="w-3 h-3 text-[#B0A898]" />
              <span className="text-[10.5px] text-[#9A8E80] font-medium">
                لم يُحدَّد تاريخ التسليم بعد
              </span>
            </div>
          )}

          {/* Remaining Days counter (only future dates) */}
          {remainingDays !== null && hasDeliveryDate && project.status !== "fully_settled" && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                isUrgent
                  ? "bg-orange-50 border border-orange-200"
                  : "bg-[#F0EBE3] border border-[#E8E0D0]"
              )}
            >
              <Clock
                className={cn(
                  "w-3 h-3 flex-shrink-0",
                  isUrgent ? "text-orange-500" : "text-[#9FAC9D]"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-bold",
                  isUrgent ? "text-orange-600" : "text-[#3D6838]"
                )}
              >
                {remainingDays === 0 ? "التسليم اليوم!" : `باقي ${remainingDays} يوماً`}
              </span>
            </div>
          )}
        </div>

        {/* Notes Preview */}
        {project.notes && (
          <p className="text-xs text-[#6A6055] mt-3 line-clamp-2 leading-relaxed bg-[#F7F3EE] rounded-lg p-2.5">
            {project.notes}
          </p>
        )}
      </div>
    </div>
  );
}
