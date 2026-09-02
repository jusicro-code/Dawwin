export const PREDEFINED_PRODUCTION_TYPES = [
  "أغنية",
  "موسيقى تصويرية",
  "هوية موسيقية",
] as const;

// Legacy alias kept for backwards compat
export const PRODUCTION_TYPES = [...PREDEFINED_PRODUCTION_TYPES, "أخرى / مخصص"] as const;

export const YEAR_OPTIONS: number[] = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const CATEGORY_LABELS: Record<string, string> = {
  personal: "الإنتاج المستقل",
  corporate: "الإنتاج التجاري",
  major: "الإنتاجات الكبرى",
};

export const CATEGORY_ICONS: Record<string, string> = {
  personal: "🎵",
  corporate: "🏢",
  major: "💼",
};

export const STATUS_LABELS = {
  under_negotiation: "قيد التفاوض",
  in_production: "قيد الإنتاج",
  technically_completed: "مكتمل فنيّاً",
  pending_payment: "معلّق ماليّاً",
  fully_settled: "مكتمل ومسدد",
};

export const STATUS_COLORS = {
  under_negotiation: {
    bg: "bg-[#6B5E3A]/12",
    text: "text-[#4A3E20]",
    dot: "bg-[#A8904A]",
    border: "border-[#A8904A]/40",
  },
  in_production: {
    bg: "bg-[#4A6869]/15",
    text: "text-[#2D4F51]",
    dot: "bg-[#5A8081]",
    border: "border-[#5A8081]/40",
  },
  technically_completed: {
    bg: "bg-[#8A6A3A]/15",
    text: "text-[#5A4020]",
    dot: "bg-[#B88A62]",
    border: "border-[#B88A62]/40",
  },
  pending_payment: {
    bg: "bg-[#9E4A2A]/12",
    text: "text-[#7A3020]",
    dot: "bg-[#C4604A]",
    border: "border-[#C4604A]/40",
  },
  fully_settled: {
    bg: "bg-[#3D7A3A]/15",
    text: "text-[#2D5E2A]",
    dot: "bg-[#5A9A57]",
    border: "border-[#5A9A57]/40",
  },
};

export const PRODUCTION_TYPE_COLORS: Record<string, string> = {
  "أغنية": "bg-rose-100 text-[#7A3028] border-[#C47A74]/50",
  "موسيقى تصويرية": "bg-[#4A6869]/15 text-[#2D4F51] border-[#4A6869]/40",
  "هوية موسيقية": "bg-[#8A6A3A]/15 text-[#5A4020] border-[#8A6A3A]/40",
};

// Default color for custom production types
export const DEFAULT_TYPE_COLOR = "bg-[#9FAC9D]/15 text-[#3D5E3B] border-[#9FAC9D]/40";
