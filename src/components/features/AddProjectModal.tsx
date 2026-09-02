import { useState, useEffect } from "react";
import { X, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Project, ProductionStatus, ProjectCategory, Expense } from "@/types";
import { PREDEFINED_PRODUCTION_TYPES, YEAR_OPTIONS, CATEGORY_LABELS } from "@/constants";
import { formatCurrency, getRemainingDays, generateId, cn } from "@/lib/utils";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Project, "id" | "createdAt">) => void;
  editProject?: Project | null;
  defaultCategory: ProjectCategory;
  defaultYear: number;
}

const CUSTOM_TYPE = "أخرى / مخصص";

const emptyForm = {
  name: "",
  client: "",
  productionTypeSelect: "أغنية",
  productionTypeCustom: "",
  contractValue: "",
  advancePayment: "",
  finalPayment: "",
  status: "in_production" as ProductionStatus,
  startDate: "",
  deliveryDate: "",
  notes: "",
  category: "personal" as ProjectCategory,
  year: 2026,
};

type FormData = typeof emptyForm;

const STATUS_OPTIONS = [
  {
    value: "under_negotiation",
    label: "قيد التفاوض",
    desc: "مرحلة نقاش تفاصيل المشروع والاتفاق المبدئي",
    color: "#A8904A",
  },
  {
    value: "in_production",
    label: "قيد الإنتاج",
    desc: "مرحلة التسجيل أو الميكساج",
    color: "#89999A",
  },
  {
    value: "technically_completed",
    label: "مكتمل فنيّاً",
    desc: "الماستر جاهز وتم التسليم الفني",
    color: "#B88A62",
  },
  {
    value: "pending_payment",
    label: "معلّق ماليّاً",
    desc: "بانتظار تحويل المستحقات",
    color: "#C4604A",
  },
  {
    value: "fully_settled",
    label: "مكتمل ومسدد",
    desc: "انتهى فنياً واستُلم المبلغ كاملاً",
    color: "#5A9A57",
  },
] as const;

const CATEGORY_OPTIONS: { value: ProjectCategory; label: string; emoji: string }[] = [
  { value: "corporate", label: "الإنتاج التجاري", emoji: "🏢" },
  { value: "major", label: "الإنتاجات الكبرى", emoji: "💼" },
  { value: "personal", label: "الإنتاج المستقل", emoji: "🎵" },
];

export default function AddProjectModal({
  isOpen,
  onClose,
  onSave,
  editProject,
  defaultCategory,
  defaultYear,
}: AddProjectModalProps) {
  const [form, setForm] = useState<FormData>({
    ...emptyForm,
    category: defaultCategory,
    year: defaultYear,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (editProject) {
      const isPredefined = PREDEFINED_PRODUCTION_TYPES.includes(
        editProject.productionType as (typeof PREDEFINED_PRODUCTION_TYPES)[number]
      );
      setForm({
        name: editProject.name,
        client: editProject.client,
        productionTypeSelect: isPredefined ? editProject.productionType : CUSTOM_TYPE,
        productionTypeCustom: isPredefined ? "" : editProject.productionType,
        contractValue: String(editProject.contractValue),
        advancePayment: String(editProject.advancePayment),
        finalPayment: String(editProject.finalPayment),
        status: editProject.status,
        startDate: editProject.startDate || "",
        deliveryDate: editProject.deliveryDate,
        notes: editProject.notes,
        category: editProject.category,
        year: editProject.year,
      });
      setExpenses(editProject.expenses ?? []);
    } else {
      setForm({ ...emptyForm, category: defaultCategory, year: defaultYear });
      setExpenses([]);
    }
    setErrors({});
  }, [editProject, isOpen, defaultCategory, defaultYear]);

  /* ── Calculated values ── */
  const contractVal = Number(form.contractValue) || 0;
  const advanceVal = Number(form.advancePayment) || 0;
  const finalVal = Number(form.finalPayment) || 0;
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  // Net remaining = contract - (advance + final + expenses)
  const remaining = contractVal - (advanceVal + finalVal + totalExpenses);
  const isFullyPaid = remaining <= 0 && contractVal > 0;

  // Remaining days (only future dates shown)
  const remainingDays = form.deliveryDate ? getRemainingDays(form.deliveryDate) : null;
  const showRemainingDays = remainingDays !== null && remainingDays >= 0;

  const isCustomType = form.productionTypeSelect === CUSTOM_TYPE;

  function resolveProductionType(): string {
    if (isCustomType) return form.productionTypeCustom.trim() || CUSTOM_TYPE;
    return form.productionTypeSelect;
  }

  /* ── Expenses helpers ── */
  function addExpense() {
    setExpenses((prev) => [...prev, { id: generateId(), name: "", amount: 0 }]);
  }

  function updateExpense(id: string, field: keyof Expense, value: string | number) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  /* ── Validation ── */
  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "اسم المشروع مطلوب";
    if (!form.client.trim()) newErrors.client = "اسم العميل مطلوب";
    if (isCustomType && !form.productionTypeCustom.trim())
      newErrors.productionTypeCustom = "يرجى كتابة نوع الإنتاج المخصص";
    if (!form.contractValue || isNaN(Number(form.contractValue)) || Number(form.contractValue) <= 0)
      newErrors.contractValue = "يرجى إدخال قيمة العقد الإجمالية";
    // deliveryDate is optional — no validation required
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      client: form.client.trim(),
      productionType: resolveProductionType(),
      contractValue: Number(form.contractValue),
      advancePayment: Number(form.advancePayment) || 0,
      finalPayment: Number(form.finalPayment) || 0,
      status: form.status,
      startDate: form.startDate,
      deliveryDate: form.deliveryDate,
      notes: form.notes.trim(),
      expenses: expenses.filter((e) => e.name.trim()),
      category: form.category,
      year: form.year,
    });
    onClose();
  }

  if (!isOpen) return null;

  const inputClass = (field: keyof FormData) =>
    cn(
      "w-full bg-[#ECE4D7] border rounded-xl px-4 py-3 text-sm text-[#2C2A27] placeholder-[#A09880] focus:outline-none focus:ring-2 transition-all duration-200",
      errors[field]
        ? "border-red-300 focus:ring-red-200"
        : "border-[#DDC8B7] focus:ring-[#9FAC9D]/40 focus:border-[#9FAC9D] hover:border-[#9FAC9D]/60"
    );

  const labelClass = "block text-xs font-semibold text-[#5A5447] mb-2 tracking-wide";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-[#DFD8C5] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DDC8B7]/60">
          <div>
            <h2 className="text-lg font-bold text-[#2C2A27]">
              {editProject ? "تعديل المشروع" : "إضافة مشروع جديد"}
            </h2>
            <p className="text-xs text-[#89999A] mt-0.5">
              أدخل بيانات المشروع الموسيقي
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9FAC9D] hover:bg-[#ECE4D7] hover:text-[#5A7358] transition-all duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Project Name */}
            <div className="sm:col-span-2">
              <label className={labelClass}>اسم المشروع *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="أدخل اسم المشروع الموسيقي"
                className={inputClass("name")}
              />
              {errors.name && <ErrorMsg msg={errors.name} />}
            </div>

            {/* Client */}
            <div>
              <label className={labelClass}>العميل / صاحب المشروع *</label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="اسم العميل أو الجهة"
                className={inputClass("client")}
              />
              {errors.client && <ErrorMsg msg={errors.client} />}
            </div>

            {/* Production Type */}
            <div>
              <label className={labelClass}>نوع الإنتاج الموسيقي</label>
              <select
                value={form.productionTypeSelect}
                onChange={(e) =>
                  setForm({ ...form, productionTypeSelect: e.target.value, productionTypeCustom: "" })
                }
                className={inputClass("productionTypeSelect")}
              >
                {PREDEFINED_PRODUCTION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
                <option value={CUSTOM_TYPE}>أخرى / مخصص</option>
              </select>
              {isCustomType && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={form.productionTypeCustom}
                    onChange={(e) =>
                      setForm({ ...form, productionTypeCustom: e.target.value })
                    }
                    placeholder="اكتب نوع الإنتاج (مثال: زفة، شيلة...)"
                    autoFocus
                    className={cn(inputClass("productionTypeCustom"), "mt-0 border-[#9FAC9D] focus:ring-[#9FAC9D]/40")}
                  />
                  {errors.productionTypeCustom && (
                    <ErrorMsg msg={errors.productionTypeCustom} />
                  )}
                </div>
              )}
            </div>

            {/* ── Year + Category side by side ── */}
            <div>
              <label className={labelClass}>السنة المالية</label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className={inputClass("year")}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>قسم المشروع</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as ProjectCategory })
                }
                className={inputClass("category")}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Financial Section ── */}
            <div className="sm:col-span-2">
              <div className="bg-[#ECE4D7] rounded-2xl p-4 border border-[#DDC8B7]/60 space-y-4">
                <p className="text-xs font-bold text-[#5A5447] uppercase tracking-wider">
                  نظام الدفعات المالية
                </p>

                {/* Contract Value */}
                <div>
                  <label className={labelClass}>
                    إجمالي قيمة العقد (Total Contract Value) *
                  </label>
                  <input
                    type="number"
                    value={form.contractValue}
                    onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
                    placeholder="0"
                    min="0"
                    className={inputClass("contractValue")}
                  />
                  {errors.contractValue && <ErrorMsg msg={errors.contractValue} />}
                </div>

                {/* Advance + Final */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>الدفعة الأولى / المقدم</label>
                    <input
                      type="number"
                      value={form.advancePayment}
                      onChange={(e) => setForm({ ...form, advancePayment: e.target.value })}
                      placeholder="0"
                      min="0"
                      className={inputClass("advancePayment")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>الدفعة الثانية / النهائية</label>
                    <input
                      type="number"
                      value={form.finalPayment}
                      onChange={(e) => setForm({ ...form, finalPayment: e.target.value })}
                      placeholder="0"
                      min="0"
                      className={inputClass("finalPayment")}
                    />
                  </div>
                </div>

                {/* ── Expenses Checklist ── */}
                <div className="border-t border-[#DDC8B7]/50 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-[#5A5447] uppercase tracking-wider">
                        مصاريف المشروع
                      </p>
                      {totalExpenses > 0 && (
                        <p className="text-[11px] text-[#9A8E80] mt-0.5">
                          الإجمالي:{" "}
                          <span className="font-bold text-[#C4604A]">
                            {formatCurrency(totalExpenses)}
                          </span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addExpense}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#DFD8C5] border border-[#9FAC9D]/60 text-[#3D6838] hover:bg-[#9FAC9D]/15 transition-all duration-150"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة بند
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="flex items-center justify-center py-4 rounded-xl border border-dashed border-[#DDC8B7] bg-[#DFD8C5]/40">
                      <p className="text-xs text-[#A09880]">
                        لا توجد مصاريف — اضغط "إضافة بند" لإضافة مصروف
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expenses.map((exp, idx) => (
                        <div
                          key={exp.id}
                          className="flex items-center gap-2 bg-[#DFD8C5] rounded-xl px-3 py-2.5 border border-[#DDC8B7]/60 group"
                        >
                          <span className="text-[11px] font-bold text-[#A09880] w-5 text-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={exp.name}
                            onChange={(e) => updateExpense(exp.id, "name", e.target.value)}
                            placeholder="اسم المصروف (مثال: كورال)"
                            className="flex-1 bg-transparent text-sm text-[#2C2A27] placeholder-[#B0A494] focus:outline-none min-w-0"
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input
                              type="number"
                              value={exp.amount || ""}
                              onChange={(e) =>
                                updateExpense(exp.id, "amount", Number(e.target.value))
                              }
                              placeholder="0"
                              min="0"
                              className="w-28 bg-[#ECE4D7] border border-[#DDC8B7] rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#2C2A27] text-left focus:outline-none focus:ring-2 focus:ring-[#9FAC9D]/30 focus:border-[#9FAC9D]"
                            />
                            <span className="text-[11px] text-[#9A8E80] font-medium">ر.س</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExpense(exp.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C4B8A8] hover:text-red-500 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Expenses total row */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#C4604A]/08 border border-[#C4604A]/25 mt-1">
                        <span className="text-[11px] font-semibold text-[#5A5447]">
                          إجمالي المصاريف
                        </span>
                        <span className="text-sm font-extrabold text-[#C4604A]">
                          {formatCurrency(totalExpenses)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Remaining Balance */}
                {contractVal > 0 && (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-300",
                      isFullyPaid
                        ? "bg-[#3D7A3A]/12 border-[#5A9A57]/50"
                        : "bg-[#C4604A]/08 border-[#C4604A]/35"
                    )}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-[#5A5447] mb-0.5">
                        صافي الربح المتبقي
                      </p>
                      <p className="text-[10px] text-[#9A8E80]">
                        {isFullyPaid
                          ? "تم استلام وتسوية كامل المبلغ ✓"
                          : totalExpenses > 0
                          ? "العقد − (الدفعات + المصاريف)"
                          : "لم يُسدَّد بعد"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "text-xl font-extrabold",
                        isFullyPaid ? "text-[#2D5E2A]" : "text-[#C4604A]"
                      )}
                    >
                      {isFullyPaid ? (
                        <span className="flex items-center gap-1">
                          <span className="text-base">✓</span> {formatCurrency(0)}
                        </span>
                      ) : (
                        formatCurrency(Math.max(0, remaining))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Dates Section ── */}
            <div className="sm:col-span-2">
              <div className="bg-[#ECE4D7] rounded-2xl p-4 border border-[#DDC8B7]/60 space-y-4">
                <p className="text-xs font-bold text-[#5A5447] uppercase tracking-wider">
                  التواريخ الزمنية
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>تاريخ البدء (Start Date)</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className={inputClass("startDate")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>تاريخ التسليم النهائي *</label>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                      className={inputClass("deliveryDate")}
                    />
                    {errors.deliveryDate && <ErrorMsg msg={errors.deliveryDate} />}
                  </div>
                </div>

                {form.deliveryDate &&
                  (showRemainingDays ? (
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 border",
                        remainingDays! <= 7
                          ? "bg-orange-50/60 border-orange-300/50"
                          : "bg-[#ECE4D7] border-[#DDC8B7]"
                      )}
                    >
                      <div>
                        <p className="text-[11px] font-semibold text-[#5A5447] mb-0.5">
                          الأيام المتبقية للتسليم
                        </p>
                        <p className="text-[10px] text-[#9A8E80]">
                          محسوب تلقائياً من تاريخ اليوم
                        </p>
                      </div>
                      <div
                        className={cn(
                          "text-2xl font-extrabold flex items-baseline gap-1",
                          remainingDays! <= 7 ? "text-orange-500" : "text-[#3D6838]"
                        )}
                      >
                        <span>{remainingDays}</span>
                        <span className="text-sm font-semibold text-[#5A5447]">يوماً</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-3 border bg-[#F5F0EA] border-[#DDC8B7]/60">
                      <span className="text-[11px] text-[#9A8E80]">
                        تاريخ التسليم مضى — العمل تجاوز موعده الزمني
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* ── Status Cards ── */}
            <div className="sm:col-span-2">
              <label className={labelClass}>حالة الإنتاج</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-stretch">
                {STATUS_OPTIONS.map(({ value, label, desc, color }, idx) => {
                  const isActive = form.status === value;
                  const spanClass = idx === 4 ? "col-span-2 md:col-span-1" : "";
                  return (
                    <label
                      key={value}
                      className={cn(
                        "relative flex flex-col gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none",
                        spanClass
                      )}
                      style={
                        isActive
                          ? { borderColor: color, backgroundColor: color + "18" }
                          : { borderColor: "#DDC8B7", backgroundColor: "#ECE4D7" }
                      }
                    >
                      <input
                        type="radio"
                        name="status"
                        value={value}
                        checked={isActive}
                        onChange={() =>
                          setForm({ ...form, status: value as ProductionStatus })
                        }
                        className="sr-only"
                      />
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        style={isActive ? { borderColor: color } : { borderColor: "#C4B8A8" }}
                      >
                        {isActive && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-[12px] font-bold text-[#2C2A27] leading-snug">
                          {label}
                        </span>
                        <span className="text-[10.5px] text-[#7A7060] leading-relaxed">
                          {desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className={labelClass}>المتطلبات الخاصة والملاحظات</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أدخل طلبات العميل الخاصة، والملاحظات، والتفاصيل الإضافية للمشروع..."
                rows={3}
                className={cn(inputClass("notes"), "resize-none leading-relaxed")}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDC8B7]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#5A5447] bg-[#ECE4D7] hover:bg-[#DFD8C5] border border-[#DDC8B7] transition-all duration-150"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#9FAC9D] hover:bg-[#8A9A88] transition-all duration-150 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {editProject ? "حفظ التعديلات" : "إضافة المشروع"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
      <AlertCircle className="w-3.5 h-3.5" />
      {msg}
    </p>
  );
}

// suppress unused import warning
const _unused = { CATEGORY_LABELS };
