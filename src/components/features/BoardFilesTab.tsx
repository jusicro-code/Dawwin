import { useState, useRef, useCallback } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  Image,
  File,
  Clipboard,
  Plus,
  Upload,
  Search,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Move,
  ArrowRight,
  X,
  Download,
} from "lucide-react";
import { BoardItem, BoardItemType } from "@/types/boards";
import { cn } from "@/lib/utils";
import { ConfirmDialog, RenameDialog } from "@/components/features/BoardModal";
import { Board } from "@/types/boards";

// ── Type helpers ─────────────────────────────────────────────────────────────

function itemIcon(type: BoardItemType, isOpen?: boolean) {
  switch (type) {
    case "folder":
      return isOpen ? (
        <FolderOpen className="w-5 h-5 text-[#A8904A]" />
      ) : (
        <Folder className="w-5 h-5 text-[#A8904A]" />
      );
    case "note":
      return <FileText className="w-4.5 h-4.5 text-[#89999A]" />;
    case "page":
      return <Clipboard className="w-4.5 h-4.5 text-[#B88A62]" />;
    case "image":
      return <Image className="w-4.5 h-4.5 text-[#7A5E8A]" />;
    default:
      return <File className="w-4.5 h-4.5 text-[#9FAC9D]" />;
  }
}

const TYPE_LABELS: Record<BoardItemType, string> = {
  folder: "مجلد",
  note: "ملاحظة",
  page: "صفحة",
  file: "ملف",
  image: "صورة",
};

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Move-to selector ─────────────────────────────────────────────────────────

interface MoveDialogProps {
  isOpen: boolean;
  item: BoardItem | null;
  boards: Board[];
  currentBoardId: string;
  allItems: BoardItem[];
  onMove: (itemId: string, newParentId: string | null, newBoardId: string) => void;
  onClose: () => void;
}

function MoveDialog({ isOpen, item, boards, currentBoardId, allItems, onMove, onClose }: MoveDialogProps) {
  const [targetBoardId, setTargetBoardId] = useState(currentBoardId);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const targetFolders = allItems.filter(
    (it) => it.boardId === targetBoardId && it.type === "folder" && it.id !== item.id
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-[#DFD8C5] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDC8B7]/60">
          <h3 className="text-sm font-bold text-[#2C2A27] flex items-center gap-2">
            <Move className="w-4 h-4 text-[#9FAC9D]" />
            نقل "{item.name}"
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9FAC9D] hover:bg-[#ECE4D7]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#5A5447] mb-2 block">المساحة</label>
            <select
              value={targetBoardId}
              onChange={(e) => { setTargetBoardId(e.target.value); setTargetFolderId(null); }}
              className="w-full bg-[#ECE4D7] border border-[#DDC8B7] rounded-xl px-4 py-2.5 text-sm text-[#2C2A27] focus:outline-none focus:ring-2 focus:ring-[#9FAC9D]/40"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5A5447] mb-2 block">المجلد</label>
            <select
              value={targetFolderId ?? ""}
              onChange={(e) => setTargetFolderId(e.target.value || null)}
              className="w-full bg-[#ECE4D7] border border-[#DDC8B7] rounded-xl px-4 py-2.5 text-sm text-[#2C2A27] focus:outline-none focus:ring-2 focus:ring-[#9FAC9D]/40"
            >
              <option value="">— الجذر (بدون مجلد) —</option>
              {targetFolders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDC8B7]/60">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5A5447] bg-[#ECE4D7] border border-[#DDC8B7] hover:bg-[#DFD8C5] transition-all">
            إلغاء
          </button>
          <button
            onClick={() => { onMove(item.id, targetFolderId, targetBoardId); onClose(); }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#9FAC9D] hover:bg-[#8A9A88] transition-all shadow-sm"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            نقل
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Note/Page editor modal ───────────────────────────────────────────────────

interface ContentEditorProps {
  isOpen: boolean;
  item: BoardItem | null;
  onSave: (content: string) => void;
  onClose: () => void;
}

function ContentEditor({ isOpen, item, onSave, onClose }: ContentEditorProps) {
  const [content, setContent] = useState(item?.content ?? "");

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-[#DFD8C5] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDC8B7]/60">
          <div className="flex items-center gap-2">
            {itemIcon(item.type)}
            <h3 className="text-sm font-bold text-[#2C2A27]">{item.name}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9FAC9D] hover:bg-[#ECE4D7]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={item.type === "note" ? "اكتب ملاحظتك هنا..." : "محتوى الصفحة..."}
          className="flex-1 resize-none px-6 py-5 bg-transparent text-sm text-[#2C2A27] placeholder-[#A09880] focus:outline-none leading-relaxed min-h-[300px]"
          dir="rtl"
        />
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDC8B7]/60">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5A5447] bg-[#ECE4D7] border border-[#DDC8B7] hover:bg-[#DFD8C5] transition-all">
            إغلاق
          </button>
          <button
            onClick={() => { onSave(content); onClose(); }}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#9FAC9D] hover:bg-[#8A9A88] transition-all shadow-sm"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Image preview modal ───────────────────────────────────────────────────────

function ImagePreview({ item, onClose }: { item: BoardItem | null; onClose: () => void }) {
  if (!item?.data) return null;
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <img
          src={item.data}
          alt={item.name}
          className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
        />
        <p className="mt-3 text-white/80 text-sm font-medium">{item.name}</p>
        <button
          onClick={onClose}
          className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#2C2A27] text-white flex items-center justify-center hover:bg-[#3D3A35] transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main BoardFilesTab ────────────────────────────────────────────────────────

interface BoardFilesTabProps {
  items: BoardItem[];
  boards: Board[];
  activeBoardId: string;
  onAddItem: (type: BoardItemType, name: string, parentId: string | null, extra?: Partial<BoardItem>) => Promise<BoardItem>;
  onUpdateItem: (id: string, patch: Partial<BoardItem>) => Promise<void>;
  onRemoveItem: (id: string) => Promise<void>;
  onMoveItem: (id: string, newParentId: string | null, newBoardId: string) => Promise<void>;
  onUploadFile: (file: File, parentId: string | null) => Promise<BoardItem>;
}

export default function BoardFilesTab({
  items,
  boards,
  activeBoardId,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onUploadFile,
}: BoardFilesTabProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<BoardItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<BoardItem | null>(null);
  const [editorItem, setEditorItem] = useState<BoardItem | null>(null);
  const [previewItem, setPreviewItem] = useState<BoardItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Breadcrumb path ──────────────────────────────────────────────────────

  function buildPath(folderId: string | null): BoardItem[] {
    const path: BoardItem[] = [];
    let cur = folderId;
    while (cur) {
      const node = items.find((it) => it.id === cur);
      if (!node) break;
      path.unshift(node);
      cur = node.parentId;
    }
    return path;
  }

  const breadcrumb = buildPath(currentFolderId);

  // ── Displayed items ──────────────────────────────────────────────────────

  const displayedItems = searchQuery
    ? items.filter(
        (it) =>
          it.boardId === activeBoardId &&
          it.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items.filter(
        (it) => it.boardId === activeBoardId && it.parentId === currentFolderId
      );

  const sortedItems = [...displayedItems].sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name, "ar");
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleItemClick = useCallback(
    (item: BoardItem) => {
      if (item.type === "folder") {
        setCurrentFolderId(item.id);
        setSearchQuery("");
      } else if (item.type === "image") {
        setPreviewItem(item);
      } else if (item.type === "note" || item.type === "page") {
        setEditorItem(item);
      }
    },
    []
  );

  async function handleNewFolder() {
    await onAddItem("folder", "مجلد جديد", currentFolderId);
  }

  async function handleNewNote() {
    const item = await onAddItem("note", "ملاحظة جديدة", currentFolderId);
    setEditorItem(item);
  }

  async function handleNewPage() {
    const item = await onAddItem("page", "صفحة جديدة", currentFolderId);
    setEditorItem(item);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const f of Array.from(files)) {
      await onUploadFile(f, currentFolderId);
    }
    e.target.value = "";
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    for (const f of Array.from(files)) {
      await onUploadFile(f, currentFolderId);
    }
  }

  function handleDownload(item: BoardItem) {
    if (!item.data) return;
    const a = document.createElement("a");
    a.href = item.data;
    a.download = item.name;
    a.click();
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  const isEmpty = sortedItems.length === 0;

  return (
    <div
      className="min-h-[400px]"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drag-drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-[#9FAC9D]/20 border-4 border-dashed border-[#9FAC9D] flex items-center justify-center pointer-events-none rounded-2xl">
          <div className="text-center">
            <Upload className="w-12 h-12 text-[#9FAC9D] mx-auto mb-2" />
            <p className="text-lg font-bold text-[#2C2A27]">أفلت الملفات هنا</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FAC9D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الملفات..."
            className="w-full bg-white border border-[#DDC8B7] rounded-xl pr-10 pl-4 py-2.5 text-sm text-[#2C2A27] placeholder-[#A09880] focus:outline-none focus:ring-2 focus:ring-[#9FAC9D]/40 focus:border-[#9FAC9D] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 mr-auto flex-wrap">
          <button
            onClick={handleNewFolder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#A8904A]/15 text-[#6A5A20] border border-[#A8904A]/40 hover:bg-[#A8904A]/25 transition-all duration-150"
          >
            <Folder className="w-3.5 h-3.5" />
            مجلد
          </button>
          <button
            onClick={handleNewNote}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#89999A]/15 text-[#2D4F51] border border-[#89999A]/40 hover:bg-[#89999A]/25 transition-all duration-150"
          >
            <FileText className="w-3.5 h-3.5" />
            ملاحظة
          </button>
          <button
            onClick={handleNewPage}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#B88A62]/15 text-[#5A4020] border border-[#B88A62]/40 hover:bg-[#B88A62]/25 transition-all duration-150"
          >
            <Clipboard className="w-3.5 h-3.5" />
            صفحة
          </button>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#9FAC9D]/20 text-[#3D6838] border border-[#9FAC9D]/50 hover:bg-[#9FAC9D]/30 transition-all duration-150"
          >
            <Upload className="w-3.5 h-3.5" />
            رفع ملف
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {!searchQuery && (
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-lg transition-all",
              currentFolderId === null
                ? "text-[#2C2A27] bg-[#DDC8B7]/50"
                : "text-[#9A8E80] hover:text-[#5A5447] hover:bg-[#DDC8B7]/30"
            )}
          >
            الجذر
          </button>
          {breadcrumb.map((crumb, i) => (
            <div key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-[#C4B8A8] rtl:rotate-180" />
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-lg transition-all",
                  i === breadcrumb.length - 1
                    ? "text-[#2C2A27] bg-[#DDC8B7]/50"
                    : "text-[#9A8E80] hover:text-[#5A5447] hover:bg-[#DDC8B7]/30"
                )}
              >
                {crumb.icon ?? crumb.name}
                {crumb.icon ? ` ${crumb.name}` : ""}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Items grid */}
      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-[#DDC8B7]/60 bg-[#ECE4D7]/30 cursor-pointer"
          onClick={handleUploadClick}
        >
          <Upload className="w-10 h-10 text-[#DDC8B7] mb-3" />
          <p className="text-sm font-medium text-[#9A8E80] mb-1">
            {searchQuery ? "لا توجد نتائج" : "المساحة فارغة"}
          </p>
          <p className="text-xs text-[#B0A898]">
            {searchQuery ? "جرّب كلمات مختلفة" : "اسحب الملفات هنا أو استخدم أزرار الإضافة"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {sortedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              menuOpenId={menuItemId}
              onMenuToggle={(id) =>
                setMenuItemId((prev) => (prev === id ? null : id))
              }
              onClick={() => handleItemClick(item)}
              onRename={() => setRenameTarget(item)}
              onDelete={() => setDeleteTarget(item)}
              onMove={() => setMoveTarget(item)}
              onDownload={() => handleDownload(item)}
              onOpen={() => {
                if (item.type === "note" || item.type === "page") setEditorItem(item);
                else if (item.type === "image") setPreviewItem(item);
              }}
            />
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Click-outside for menu */}
      {menuItemId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuItemId(null)} />
      )}

      {/* Dialogs */}
      <RenameDialog
        isOpen={!!renameTarget}
        title={`إعادة تسمية "${renameTarget?.name}"`}
        initial={renameTarget?.name ?? ""}
        onSave={(name) => renameTarget && onUpdateItem(renameTarget.id, { name })}
        onClose={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="حذف العنصر"
        message={`هل تريد حذف "${deleteTarget?.name}"؟${deleteTarget?.type === "folder" ? " سيُحذف كل محتواه أيضاً." : ""}`}
        confirmLabel="حذف"
        danger
        onConfirm={() => deleteTarget && onRemoveItem(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <MoveDialog
        isOpen={!!moveTarget}
        item={moveTarget}
        boards={boards}
        currentBoardId={activeBoardId}
        allItems={items}
        onMove={onMoveItem}
        onClose={() => setMoveTarget(null)}
      />

      <ContentEditor
        isOpen={!!editorItem}
        item={editorItem}
        onSave={(content) => editorItem && onUpdateItem(editorItem.id, { content })}
        onClose={() => setEditorItem(null)}
      />

      {previewItem && (
        <ImagePreview item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}

// ── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: BoardItem;
  menuOpenId: string | null;
  onMenuToggle: (id: string) => void;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: () => void;
  onDownload: () => void;
  onOpen: () => void;
}

function ItemCard({
  item,
  menuOpenId,
  onMenuToggle,
  onClick,
  onRename,
  onDelete,
  onMove,
  onDownload,
  onOpen,
}: ItemCardProps) {
  const isMenuOpen = menuOpenId === item.id;
  const isDownloadable = (item.type === "file" || item.type === "image") && item.data;

  return (
    <div
      className="relative group bg-white rounded-2xl border border-[#EDE8DE] hover:border-[#C8BEA8] hover:shadow-md transition-all duration-200 overflow-visible cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail / Icon */}
      <div className="aspect-square flex items-center justify-center bg-[#F7F3EE] rounded-t-2xl overflow-hidden">
        {item.type === "image" && item.data ? (
          <img
            src={item.data}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-3xl">{itemIcon(item.type, false)}</span>
            {item.size && (
              <span className="text-[9px] text-[#B0A898] font-mono">
                {formatSize(item.size)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="px-2.5 py-2">
        <p className="text-[11px] font-semibold text-[#2C2A27] truncate leading-tight">
          {item.name}
        </p>
        <p className="text-[10px] text-[#A09880] mt-0.5">
          {TYPE_LABELS[item.type]}
        </p>
      </div>

      {/* Menu button */}
      <button
        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#9A8E80] opacity-0 group-hover:opacity-100 hover:bg-white hover:text-[#2C2A27] transition-all duration-150 z-10 shadow-sm"
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle(item.id);
        }}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {/* Dropdown */}
      {isMenuOpen && (
        <div
          className="absolute top-8 left-0 bg-white rounded-xl shadow-lg border border-[#DFD8C5] py-1 z-30 min-w-[150px] animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {(item.type === "note" || item.type === "page") && (
            <button
              onClick={() => { onOpen(); onMenuToggle(item.id); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#4A4540] hover:bg-[#ECE4D7] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#89999A]" />
              فتح
            </button>
          )}
          <button
            onClick={() => { onRename(); onMenuToggle(item.id); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#4A4540] hover:bg-[#ECE4D7] transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#89999A]" />
            إعادة تسمية
          </button>
          <button
            onClick={() => { onMove(); onMenuToggle(item.id); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#4A4540] hover:bg-[#ECE4D7] transition-colors"
          >
            <Move className="w-3.5 h-3.5 text-[#89999A]" />
            نقل إلى
          </button>
          {isDownloadable && (
            <button
              onClick={() => { onDownload(); onMenuToggle(item.id); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#4A4540] hover:bg-[#ECE4D7] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#89999A]" />
              تحميل
            </button>
          )}
          <hr className="border-[#EDE8DE] my-1" />
          <button
            onClick={() => { onDelete(); onMenuToggle(item.id); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف
          </button>
        </div>
      )}
    </div>
  );
}
