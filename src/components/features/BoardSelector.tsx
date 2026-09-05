import { useState, useRef } from "react";
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  HardDrive,
  PlusCircle,
} from "lucide-react";
import { Board, StorageInfo, BOARD_COLORS, BOARD_ICONS } from "@/types/boards";
import { cn } from "@/lib/utils";
import { BoardModal, ConfirmDialog } from "@/components/features/BoardModal";

interface BoardSelectorProps {
  boards: Board[];
  activeBoardId: string;
  storage: StorageInfo;
  onSelect: (id: string) => void;
  onAdd: (name: string, color: string, icon: string) => Promise<Board>;
  onRename: (id: string, name: string, color: string, icon: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function BoardSelector({
  boards,
  activeBoardId,
  storage,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onCopy,
}: BoardSelectorProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleMenuClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setMenuOpenId((prev) => (prev === id ? null : id));
  }

  // Quick add: creates a new board with auto-generated name and switches to its files tab
  async function handleQuickAdd() {
    const num = boards.length;
    const icons = ["📄", "📝", "📌", "💡", "🗂️", "📋", "🔖"];
    const colors = BOARD_COLORS;
    const icon = icons[num % icons.length];
    const color = colors[num % colors.length];
    const name = `صفحة ${num}`;
    await onAdd(name, color, icon);
  }

  return (
    <>
      <div className="bg-[#2C2A27] border-b border-[#3D3A35] px-4 py-0" dir="rtl">
        <div className="max-w-7xl mx-auto flex items-center gap-0">
          {/* Scrollable board tabs */}
          <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 pl-2">
            {boards.map((board) => {
              const isActive = board.id === activeBoardId;
              return (
                <div key={board.id} className="relative flex-shrink-0 group/tab">
                  <button
                    onClick={() => onSelect(board.id)}
                    className={cn(
                      "flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap border",
                      isActive
                        ? "text-white shadow-sm"
                        : "text-[#DFD8C5]/60 hover:text-[#DFD8C5] border-transparent hover:bg-[#3D3A35]"
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: board.color + "30",
                            borderColor: board.color + "60",
                            color: board.color,
                          }
                        : { borderColor: "transparent" }
                    }
                  >
                    <span>{board.icon}</span>
                    <span>{board.name}</span>
                    {/* kebab menu button — visible on hover */}
                    <span
                      className="opacity-0 group-hover/tab:opacity-100 transition-opacity ml-0.5 -mr-1"
                      onClick={(e) => handleMenuClick(e, board.id)}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {menuOpenId === board.id && (
                    <div
                      className="absolute top-full right-0 mt-1 bg-[#2C2A27] border border-[#3D3A35] rounded-xl shadow-xl py-1 z-30 min-w-[160px] animate-fade-in"
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditBoard(board);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#DFD8C5]/80 hover:bg-[#3D3A35] hover:text-[#DFD8C5] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        إعادة تسمية
                      </button>
                      <button
                        onClick={() => {
                          onCopy(board.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#DFD8C5]/80 hover:bg-[#3D3A35] hover:text-[#DFD8C5] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        نسخ المساحة
                      </button>
                      {board.id !== "default" && (
                        <button
                          onClick={() => {
                            setDeleteTarget(board);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف المساحة
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick add + full add buttons */}
          <div className="flex items-center gap-1 flex-shrink-0 mr-1">
            {/* Quick add (one click, auto name) */}
            <button
              onClick={handleQuickAdd}
              title="فتح صفحة جديدة بضغطة واحدة"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#9FAC9D] hover:text-white hover:bg-[#9FAC9D]/30 border border-[#9FAC9D]/30 hover:border-[#9FAC9D]/60 transition-all duration-150 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">صفحة جديدة</span>
            </button>
            {/* Full add modal */}
            <button
              onClick={() => setAddOpen(true)}
              title="مساحة عمل مخصصة"
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-[#DFD8C5]/40 hover:text-[#DFD8C5] hover:bg-[#3D3A35] border border-transparent hover:border-[#4A4742] transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Storage indicator */}
          {storage.supported && (
            <div className="flex items-center gap-2 px-3 border-r border-[#3D3A35] ml-1 flex-shrink-0">
              <HardDrive className="w-3.5 h-3.5 text-[#DFD8C5]/30 flex-shrink-0" />
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  <div className="w-20 h-1.5 bg-[#3D3A35] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(storage.percent, 100)}%`,
                        backgroundColor:
                          storage.percent > 85
                            ? "#C4604A"
                            : storage.percent > 60
                            ? "#A8904A"
                            : "#9FAC9D",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#DFD8C5]/40 font-mono whitespace-nowrap">
                    {storage.percent}%
                  </span>
                </div>
                <span className="text-[9px] text-[#DFD8C5]/25 mt-0.5 whitespace-nowrap">
                  {formatBytes(storage.usage)} / {formatBytes(storage.quota)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside overlay */}
      {menuOpenId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuOpenId(null)}
        />
      )}

      {/* Add modal */}
      <BoardModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={onAdd}
        title="مساحة عمل جديدة"
      />

      {/* Edit modal */}
      {editBoard && (
        <BoardModal
          isOpen={!!editBoard}
          onClose={() => setEditBoard(null)}
          onSave={(name, color, icon) => onRename(editBoard.id, name, color, icon)}
          initial={editBoard}
          title="تعديل المساحة"
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="حذف المساحة"
        message={`هل أنت متأكد من حذف مساحة "${deleteTarget?.name}"؟ سيتم حذف جميع ملفاتها بشكل دائم.`}
        confirmLabel="حذف"
        danger
        onConfirm={() => deleteTarget && onDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
