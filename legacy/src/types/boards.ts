// ─────────────────────────────────────────────────────────────────────────────
// نظام مساحات العمل (Boards / Workspaces)
// طبقة إضافية بالكامل — لا تؤثر على أي نوع أو وظيفة موجودة مسبقاً.
// ─────────────────────────────────────────────────────────────────────────────

/** نوع العنصر داخل البورد */
export type BoardItemType = "folder" | "note" | "page" | "file" | "image";

/** عنصر واحد داخل مساحة عمل (ملف، صورة، ملاحظة، صفحة، أو مجلد) */
export interface BoardItem {
  id: string;
  boardId: string;
  /** المجلد الأب — null يعني الجذر */
  parentId: string | null;
  type: BoardItemType;
  name: string;
  /** محتوى نصي للملاحظات والصفحات */
  content?: string;
  /** بيانات الملف/الصورة مخزّنة كـ Data URL داخل IndexedDB */
  data?: string;
  /** نوع MIME للملفات */
  mimeType?: string;
  /** حجم الملف بالبايت */
  size?: number;
  createdAt: string;
  updatedAt: string;
}

/** مساحة عمل واحدة */
export interface Board {
  id: string;
  name: string;
  /** لون مميّز للبورد (من لوحة ألوان البرنامج نفسه) */
  color: string;
  icon: string;
  /** ترتيب العرض */
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** معلومات المساحة التخزينية المتاحة على الجهاز */
export interface StorageInfo {
  /** المستخدم فعلياً بالبايت */
  usage: number;
  /** الحد الأقصى المتاح على الجهاز بالبايت */
  quota: number;
  /** النسبة المئوية المستخدمة */
  percent: number;
  supported: boolean;
}

export const BOARD_COLORS = [
  "#9FAC9D",
  "#B88A62",
  "#486A6C",
  "#7A5E8A",
  "#C4604A",
  "#5A9A57",
  "#A8904A",
  "#89999A",
] as const;

export const BOARD_ICONS = [
  "🎼",
  "🎵",
  "🎚️",
  "🎧",
  "🎹",
  "🥁",
  "🎬",
  "🏢",
  "💼",
  "📁",
  "⭐",
  "🎤",
] as const;
