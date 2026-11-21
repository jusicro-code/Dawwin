import { FinancialSummary, ProjectCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/constants";

interface StatsCardsProps {
  summary: FinancialSummary;
  activeCategory: ProjectCategory | null;
}

export default function StatsCards({ summary, activeCategory }: StatsCardsProps) {
  const completionRate =
    summary.totalProjects > 0
      ? Math.round((summary.completedCount / summary.totalProjects) * 100)
      : 0;

  const filterLabel = activeCategory ? CATEGORY_LABELS[activeCategory] : null;

  return (
    <div className="mb-8">
      {filterLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-[#9FAC9D] uppercase tracking-wider">
            المؤشرات المالية:
          </span>
          <span className="text-xs font-bold text-[#5A7358] bg-[#9FAC9D]/15 px-2.5 py-1 rounded-lg border border-[#9FAC9D]/30">
            {filterLabel}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total — spans 2 on xl */}
        <div
          className="xl:col-span-2 rounded-2xl p-5 bg-gradient-to-br from-[#5A7A58] to-[#3D5E3B] shadow-lg cursor-default
          transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(90,122,88,0.45)]"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            {filterLabel ? (
              <span className="text-xs font-semibold bg-white/15 text-white/90 px-2.5 py-1 rounded-lg truncate max-w-[120px]">
                {filterLabel}
              </span>
            ) : (
              <span className="text-xs font-semibold bg-white/15 text-white/90 px-2.5 py-1 rounded-lg">
                جميع الأقسام
              </span>
            )}
          </div>
          <div className="text-[26px] font-extrabold text-white leading-none mb-1.5 tracking-tight">
            {formatCurrency(summary.totalCompleted)}
          </div>
          <div className="text-sm font-semibold text-white mb-0.5">
            المجموع الكلي للأعمال المنجزة
          </div>
          <div className="text-xs text-white/60">
            إجمالي الإيرادات المسددة
          </div>
        </div>

        {/* Independent (personal) */}
        <div
          className="rounded-2xl p-5 bg-gradient-to-br from-[#B88A62] to-[#8F6840] shadow-lg cursor-default
          transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(184,138,98,0.45)]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="text-xl font-extrabold text-white leading-none mb-1.5">
            {formatCurrency(summary.personalCompleted)}
          </div>
          <div className="text-xs font-semibold text-white mb-0.5">
            العوائد المنجزة – المستقل
          </div>
          <div className="text-xs text-white/55">الإنتاج المستقل المسدد</div>
        </div>

        {/* Commercial (corporate) */}
        <div
          className="rounded-2xl p-5 bg-gradient-to-br from-[#486A6C] to-[#2E4F51] shadow-lg cursor-default
          transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(72,106,108,0.45)]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <div className="text-xl font-extrabold text-white leading-none mb-1.5">
            {formatCurrency(summary.corporateCompleted)}
          </div>
          <div className="text-xs font-semibold text-white mb-0.5">
            العوائد المنجزة – التجاري
          </div>
          <div className="text-xs text-white/55">الإنتاج التجاري المسدد</div>
        </div>

        {/* Major */}
        <div
          className="rounded-2xl p-5 bg-gradient-to-br from-[#7A5E8A] to-[#5A3E6A] shadow-lg cursor-default
          transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(122,94,138,0.45)]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
              <path d="M7 8l3 3 2-2 3 4" />
            </svg>
          </div>
          <div className="text-xl font-extrabold text-white leading-none mb-1.5">
            {formatCurrency(summary.majorCompleted)}
          </div>
          <div className="text-xs font-semibold text-white mb-0.5">
            العوائد المنجزة – الكبرى
          </div>
          <div className="text-xs text-white/55">الإنتاجات الكبرى المسددة</div>
        </div>

        {/* Progress */}
        <div
          className="rounded-2xl p-5 bg-gradient-to-br from-[#9E706A] to-[#7A4E48] shadow-lg cursor-default
          transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(158,112,106,0.45)]"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-lg">
              {completionRate}%
            </span>
          </div>
          <div className="text-xl font-extrabold text-white leading-none mb-0.5">
            {summary.completedCount}{" "}
            <span className="text-sm font-semibold text-white/70">
              من أصل {summary.totalProjects}
            </span>
          </div>
          <div className="text-xs font-semibold text-white mb-2.5">
            مشاريع منجزة
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-white/50">منجز</span>
            <span className="text-[10px] text-white/50">
              {summary.inProgressCount} نشط
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
