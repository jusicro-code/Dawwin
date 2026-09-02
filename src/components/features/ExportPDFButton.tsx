import { useState } from "react";
import { FileDown, Loader2, X, ChevronLeft } from "lucide-react";
import { Project, FinancialSummary, ProjectCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/constants";

interface ExportPDFButtonProps {
  projects: Project[];
  summary: FinancialSummary;
  selectedYear?: number;
}

type ExportOption = ProjectCategory | "all";

const EXPORT_OPTIONS: {
  key: ExportOption;
  label: string;
  desc: string;
  emoji: string;
  color: string;
}[] = [
  {
    key: "personal",
    label: "الإنتاج المستقل",
    desc: "تقرير مشاريعك الشخصية والمستقلة",
    emoji: "🎵",
    color: "#B88A62",
  },
  {
    key: "corporate",
    label: "الإنتاج التجاري",
    desc: "تقرير تكليفات ومشاريع الشركة",
    emoji: "🏢",
    color: "#486A6C",
  },
  {
    key: "major",
    label: "الإنتاجات الكبرى",
    desc: "تقرير المشاريع الضخمة طويلة الأجل",
    emoji: "💼",
    color: "#7A5E8A",
  },
  {
    key: "all",
    label: "جميع الأقسام",
    desc: "تقرير شامل لكافة المشاريع النشطة",
    emoji: "📊",
    color: "#5A7A58",
  },
];

export default function ExportPDFButton({
  projects,
  summary,
  selectedYear,
}: ExportPDFButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleExport(option: ExportOption) {
    setShowMenu(false);
    setLoading(true);

    // Filter projects for this report
    const reportProjects =
      option === "all"
        ? projects.filter((p) => p.status !== "fully_settled")
        : projects.filter(
            (p) => p.category === option && p.status !== "fully_settled"
          );

    const personalProjects =
      option === "all" || option === "personal"
        ? projects.filter((p) => p.category === "personal")
        : [];
    const corporateProjects =
      option === "all" || option === "corporate"
        ? projects.filter((p) => p.category === "corporate")
        : [];
    const majorProjects =
      option === "all" || option === "major"
        ? projects.filter((p) => p.category === "major")
        : [];

    const printWindow = window.open("", "_blank", "width=960,height=750");
    if (!printWindow) {
      setLoading(false);
      return;
    }

    const tableRows = (list: Project[]) =>
      list.length === 0
        ? `<tr><td colspan="6" style="text-align:center;color:#888;padding:14px;">لا توجد مشاريع</td></tr>`
        : list
            .map((p, i) => {
              const remaining =
                p.contractValue - (p.advancePayment + p.finalPayment);
              const isFullyPaid = remaining <= 0;
              return `
        <tr style="background:${i % 2 === 0 ? "#FAFAF8" : "#FFFFFF"};">
          <td>${p.name}</td>
          <td>${p.client}</td>
          <td>${p.productionType}</td>
          <td style="text-align:center;">${formatDate(p.deliveryDate)}</td>
          <td style="text-align:left;font-weight:700;color:#3D6838;">${formatCurrency(p.contractValue)}</td>
          <td style="text-align:left;font-weight:700;color:${isFullyPaid ? "#2D5E2A" : "#C4604A"}">
            ${isFullyPaid ? "✓ مسدد" : formatCurrency(remaining)}
          </td>
        </tr>`;
            })
            .join("");

    const sectionBlock = (
      title: string,
      badgeColor: string,
      list: Project[]
    ) => `
  <div class="section">
    <div class="section-header">
      <h3>${title}</h3>
      <span class="badge" style="background:${badgeColor}20;color:${badgeColor};border:1px solid ${badgeColor}60;">${list.length} مشروع</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>اسم المشروع</th><th>العميل</th><th>نوع الإنتاج</th>
          <th>تاريخ التسليم</th><th>قيمة العقد</th><th>المتبقي</th>
        </tr>
      </thead>
      <tbody>${tableRows(list)}</tbody>
    </table>
  </div>`;

    const completionRate =
      summary.totalProjects > 0
        ? Math.round((summary.completedCount / summary.totalProjects) * 100)
        : 0;

    const reportTitle =
      option === "all"
        ? "التقرير الشامل – جميع الأقسام"
        : `تقرير ${CATEGORY_ICONS[option]} ${CATEGORY_LABELS[option]}`;

    const yearLabel = selectedYear ? ` – ${selectedYear}` : "";

    const sections =
      option === "all"
        ? `
      ${sectionBlock("الإنتاج المستقل 🎵", "#9FAC9D", personalProjects)}
      <div class="divider"></div>
      ${sectionBlock("الإنتاج التجاري 🏢", "#89999A", corporateProjects)}
      <div class="divider"></div>
      ${sectionBlock("الإنتاجات الكبرى 💼", "#7A5E8A", majorProjects)}`
        : sectionBlock(
            `${CATEGORY_ICONS[option]} ${CATEGORY_LABELS[option]}`,
            option === "personal"
              ? "#9FAC9D"
              : option === "corporate"
              ? "#89999A"
              : "#7A5E8A",
            reportProjects
          );

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>${reportTitle}${yearLabel}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Cairo',sans-serif;background:#ECE4D7;color:#1A1917;direction:rtl;padding:40px;}
    .page{background:#fff;max-width:900px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12);}
    .header{background:linear-gradient(135deg,#4A6648,#3D5E3B);padding:32px 40px;display:flex;align-items:center;justify-content:space-between;}
    .logo-area{display:flex;align-items:center;gap:14px;}
    .logo-circle{width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:14px;display:flex;align-items:center;justify-content:center;}
    .logo-circle svg{width:26px;height:26px;stroke:white;fill:none;stroke-width:1.5;}
    .brand-name{font-size:26px;font-weight:800;color:#fff;}
    .brand-sub{font-size:11px;color:rgba(255,255,255,.7);margin-top:2px;}
    .report-title{text-align:left;}
    .report-title h2{font-size:15px;font-weight:700;color:#fff;}
    .report-title p{font-size:12px;color:rgba(255,255,255,.65);margin-top:3px;}
    .summary-section{padding:28px 40px 0;}
    .summary-title{font-size:12px;font-weight:700;color:#5A5447;text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;}
    .cards-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
    .card{border-radius:12px;padding:14px 16px;}
    .card.green{background:linear-gradient(135deg,#5A7A58,#3D5E3B);color:#fff;}
    .card.amber{background:linear-gradient(135deg,#B88A62,#8F6840);color:#fff;}
    .card.teal{background:linear-gradient(135deg,#486A6C,#2E4F51);color:#fff;}
    .card.purple{background:linear-gradient(135deg,#7A5E8A,#5A3E6A);color:#fff;}
    .card-val{font-size:17px;font-weight:800;margin-bottom:4px;}
    .card-lbl{font-size:10px;opacity:.85;}
    .divider{height:1px;background:#EEE8DE;margin:0 40px;}
    .section{padding:22px 40px;}
    .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
    .section-header h3{font-size:14px;font-weight:700;color:#2C2A27;}
    .badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    th{background:#F0EBE3;padding:9px 10px;font-weight:700;color:#5A5447;border-bottom:2px solid #DFD8C5;}
    td{padding:8px 10px;border-bottom:1px solid #F0EBE3;color:#3A3730;}
    .footer{background:#2C2A27;padding:14px 40px;display:flex;align-items:center;justify-content:space-between;}
    .footer p{font-size:11px;color:rgba(255,255,255,.5);}
    @media print{body{padding:0;background:#fff;}.page{border-radius:0;box-shadow:none;}}
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-area">
      <div class="logo-circle">
        <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      </div>
      <div>
        <div class="brand-name">دوزان</div>
        <div class="brand-sub">منصة إنتاج وإدارة المشاريع الموسيقية</div>
      </div>
    </div>
    <div class="report-title">
      <h2>${reportTitle}</h2>
      <p>تاريخ الإصدار: ${new Date().toLocaleDateString("ar-SA")}${yearLabel}</p>
    </div>
  </div>
  <div class="summary-section">
    <div class="summary-title">ملخص مالي</div>
    <div class="cards-grid">
      <div class="card green"><div class="card-val">${formatCurrency(summary.totalCompleted)}</div><div class="card-lbl">المجموع الكلي المنجز</div></div>
      <div class="card amber"><div class="card-val">${formatCurrency(summary.personalCompleted)}</div><div class="card-lbl">العوائد – المستقل</div></div>
      <div class="card teal"><div class="card-val">${formatCurrency(summary.corporateCompleted)}</div><div class="card-lbl">العوائد – التجاري</div></div>
      <div class="card purple"><div class="card-val">${formatCurrency(summary.majorCompleted)}</div><div class="card-lbl">العوائد – الكبرى</div></div>
    </div>
    <div style="display:flex;gap:24px;margin-bottom:22px;font-size:12.5px;color:#5A5447;">
      <span>إجمالي المشاريع: <strong style="color:#2C2A27">${summary.totalProjects}</strong></span>
      <span>منجزة ومسددة: <strong style="color:#3D6838">${summary.completedCount}</strong></span>
      <span>نشطة: <strong style="color:#2D4F51">${summary.inProgressCount}</strong></span>
      <span>نسبة الإنجاز: <strong style="color:#7A4E48">${completionRate}%</strong></span>
    </div>
  </div>
  <div class="divider"></div>
  ${sections}
  <div class="footer">
    <p>دوزان – منصة إنتاج وإدارة المشاريع الموسيقية</p>
    <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")}</p>
  </div>
</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},1200);}</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => setLoading(false), 1200);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((v) => !v)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#2C2A27] hover:bg-[#1A1917] text-white font-semibold rounded-xl text-sm transition-all duration-150 shadow-sm disabled:opacity-60 border border-[#3D3A35]"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        تصدير PDF
      </button>

      {/* Popup Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 bg-[#DFD8C5] rounded-2xl shadow-2xl border border-[#DDC8B7] overflow-hidden w-72">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDC8B7]/60">
              <p className="text-sm font-bold text-[#2C2A27]">اختر نوع التقرير</p>
              <button
                onClick={() => setShowMenu(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9FAC9D] hover:bg-[#ECE4D7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              {EXPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleExport(opt.key)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#ECE4D7] transition-all duration-150 text-right group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: opt.color + "20" }}
                  >
                    {opt.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2C2A27] leading-snug">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-[#9A8E80] leading-snug mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#9FAC9D] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
