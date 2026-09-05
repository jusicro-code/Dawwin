import { useState } from "react";
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Archive,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useBoards } from "@/hooks/useBoards";
import Header from "@/components/layout/Header";
import StatsCards from "@/components/features/StatsCards";
import ProjectCard from "@/components/features/ProjectCard";
import AddProjectModal from "@/components/features/AddProjectModal";
import ExportPDFButton from "@/components/features/ExportPDFButton";
import BoardSelector from "@/components/features/BoardSelector";
import BoardFilesTab from "@/components/features/BoardFilesTab";
import { Project } from "@/types";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRODUCTION_TYPE_COLORS,
  DEFAULT_TYPE_COLOR,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from "@/constants";
import { formatCurrency, formatDate, getRemainingDays, cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type MainTab = "active" | "archive" | "files";

export default function Dashboard() {
  const {
    projects,
    filteredActiveProjects,
    archivedProjects,
    financialSummary,
    activeTab: projectsTab,
    setActiveTab: setProjectsTab,
    addProject,
    updateProject,
    deleteProject,
    loadingProjects,
  } = useProjects();

  const {
    boards,
    activeBoardId,
    activeBoard,
    setActiveBoardId,
    items: boardItems,
    storage,
    addBoard,
    renameBoard,
    updateBoardStyle,
    removeBoard,
    copyBoard,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    uploadFile,
  } = useBoards();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("active");

  // Sync mainTab ↔ projectsTab
  function handleTabChange(tab: MainTab) {
    setMainTab(tab);
    if (tab === "active") setProjectsTab("active");
    else if (tab === "archive") setProjectsTab("archive");
  }

  function handleEdit(project: Project) {
    setEditProject(project);
    setIsModalOpen(true);
  }

  function handleAdd() {
    setEditProject(null);
    setIsModalOpen(true);
  }

  function handleSave(data: Omit<Project, "id" | "createdAt">) {
    if (editProject) {
      updateProject(editProject.id, data);
    } else {
      addProject(data);
    }
  }

  const isArchiveTab = mainTab === "archive";
  const isFilesTab = mainTab === "files";

  const baseProjects = isArchiveTab ? archivedProjects : filteredActiveProjects;

  const displayedProjects = baseProjects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q);
    const matchType = filterType === "all" || p.productionType === filterType;
    return matchSearch && matchType;
  });

  const allProductionTypes = Array.from(
    new Set(projects.map((p) => p.productionType))
  );

  const activeCount = filteredActiveProjects.length;
  const archiveCount = archivedProjects.length;

  return (
    <div className="min-h-screen bg-[#DFD8C5]">
      <Header />
      {/* ── Board selector bar ── */}
      <BoardSelector
        boards={boards}
        activeBoardId={activeBoardId}
        storage={storage}
        onSelect={(id) => {
          setActiveBoardId(id);
          // when switching boards, reset to active tab
          setMainTab("active");
          setProjectsTab("active");
        }}
        onAdd={addBoard}
        onRename={async (id, name, color, icon) => {
          await renameBoard(id, name);
          await updateBoardStyle(id, color, icon);
        }}
        onDelete={removeBoard}
        onCopy={copyBoard}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-[#ECE4D7] rounded-t-none min-h-[calc(100vh-73px)]">
        {/* Stats */}
        <StatsCards summary={financialSummary} activeCategory={null} />

        {/* Tabs + Action Buttons */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          {/* Three tabs */}
          <div className="flex bg-[#2C2A27] rounded-2xl p-1.5 gap-1 border border-[#3D3A35]">
            {/* Active tab */}
            <button
              onClick={() => handleTabChange("active")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                mainTab === "active"
                  ? "bg-[#9FAC9D] text-white shadow-sm"
                  : "text-[#DFD8C5]/70 hover:bg-[#3D3A35] hover:text-white"
              )}
            >
              <span>🎼</span>
              <span>المشاريع النشطة</span>
              {activeCount > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    mainTab === "active"
                      ? "bg-white/25 text-white"
                      : "bg-[#5A5447] text-[#DFD8C5]/80"
                  )}
                >
                  {activeCount}
                </span>
              )}
            </button>

            {/* Archive tab */}
            <button
              onClick={() => handleTabChange("archive")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                mainTab === "archive"
                  ? "bg-[#5A9A57] text-white shadow-sm"
                  : "text-[#DFD8C5]/70 hover:bg-[#3D3A35] hover:text-white"
              )}
            >
              <span>✅</span>
              <span>الأرشيف</span>
              {archiveCount > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    mainTab === "archive"
                      ? "bg-white/25 text-white"
                      : "bg-[#5A5447] text-[#DFD8C5]/80"
                  )}
                >
                  {archiveCount}
                </span>
              )}
            </button>

            {/* Files tab */}
            <button
              onClick={() => handleTabChange("files")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                mainTab === "files"
                  ? "text-white shadow-sm"
                  : "text-[#DFD8C5]/70 hover:bg-[#3D3A35] hover:text-white"
              )}
              style={
                mainTab === "files"
                  ? { backgroundColor: (activeBoard?.color ?? "#9FAC9D") + "90" }
                  : {}
              }
            >
              <FolderOpen className="w-4 h-4" />
              <span>ملفات المساحة</span>
              {boardItems.filter((it) => it.boardId === activeBoardId).length > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    mainTab === "files"
                      ? "bg-white/25 text-white"
                      : "bg-[#5A5447] text-[#DFD8C5]/80"
                  )}
                >
                  {boardItems.filter((it) => it.boardId === activeBoardId).length}
                </span>
              )}
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {!isFilesTab && <ExportPDFButton projects={projects} summary={financialSummary} />}
            {!isArchiveTab && !isFilesTab && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#9FAC9D] hover:bg-[#7D9A7B] text-white font-bold rounded-xl text-sm transition-all duration-150 shadow-md"
              >
                <Plus className="w-4 h-4" />
                مشروع جديد
              </button>
            )}
          </div>
        </div>

        {/* ── Files Tab ── */}
        {isFilesTab && (
          <BoardFilesTab
            items={boardItems}
            boards={boards}
            activeBoardId={activeBoardId}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onMoveItem={async (id, newParent, newBoard) => {
              await moveItem(id, newParent, newBoard);
            }}
            onUploadFile={uploadFile}
          />
        )}

        {/* Category Legend (active tab only) */}
        {!isArchiveTab && !isFilesTab && (
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <span className="text-xs font-semibold text-[#7A7060]">الأقسام:</span>
            {(["personal", "corporate", "major"] as const).map((cat) => {
              const count = filteredActiveProjects.filter(
                (p) => p.category === cat
              ).length;
              const dotColors: Record<string, string> = {
                personal: "bg-[#B88A62]",
                corporate: "bg-[#486A6C]",
                major: "bg-[#7A5E8A]",
              };
              const bgColors: Record<string, string> = {
                personal: "bg-[#B88A62]/10 border-[#B88A62]/30 text-[#6B4A20]",
                corporate: "bg-[#486A6C]/10 border-[#486A6C]/30 text-[#1E3E40]",
                major: "bg-[#7A5E8A]/10 border-[#7A5E8A]/30 text-[#4A2E5A]",
              };
              return (
                <div
                  key={cat}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold",
                    bgColors[cat]
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", dotColors[cat])} />
                  <span>{CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}</span>
                  {count > 0 && (
                    <span className="font-bold opacity-70">({count})</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Archive Header */}
        {isArchiveTab && !isFilesTab && (
          <div className="flex items-center gap-3 bg-[#3D7A3A]/10 border border-[#5A9A57]/30 rounded-xl px-4 py-3 mb-5">
            <Archive className="w-5 h-5 text-[#5A9A57]" />
            <div>
              <p className="text-sm font-bold text-[#2D5E2A]">
                أرشيف المشاريع المنجزة والمسددة
              </p>
              <p className="text-xs text-[#5A7A50]">
                جميع المشاريع التي تم إنجازها واستلام مبالغها كاملاً
              </p>
            </div>
          </div>
        )}

        {/* Toolbar (projects only) */}
        {!isFilesTab && <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FAC9D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مشروع أو عميل..."
              className="w-full bg-white border border-[#DDC8B7] rounded-xl pr-10 pl-4 py-2.5 text-sm text-[#2C2A27] placeholder-[#A09880] focus:outline-none focus:ring-2 focus:ring-[#9FAC9D]/40 focus:border-[#9FAC9D] transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150",
              showFilters
                ? "bg-[#9FAC9D]/15 border-[#9FAC9D] text-[#3D6838]"
                : "bg-white border-[#DDC8B7] text-[#5A5447] hover:border-[#9FAC9D]/60"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            تصفية
          </button>

          <div className="flex bg-white border border-[#DDC8B7] rounded-xl p-1 gap-0.5 mr-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                viewMode === "grid"
                  ? "bg-[#9FAC9D] text-white shadow-sm"
                  : "text-[#9FAC9D] hover:bg-[#ECE4D7]"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                viewMode === "list"
                  ? "bg-[#9FAC9D] text-white shadow-sm"
                  : "text-[#9FAC9D] hover:bg-[#ECE4D7]"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>}

        {/* Expanded Filters (projects only) */}
        {!isFilesTab && showFilters && (
          <div className="bg-white rounded-2xl border border-[#DFD8C5] p-4 mb-5 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#5A5447]">
                نوع الإنتاج:
              </span>
              <button
                onClick={() => setFilterType("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                  filterType === "all"
                    ? "bg-[#9FAC9D] text-white border-[#9FAC9D]"
                    : "bg-[#F0EBE3] text-[#5A5447] border-[#DDC8B7] hover:border-[#9FAC9D]/50"
                )}
              >
                الكل
              </button>
              {allProductionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                    filterType === type
                      ? "bg-[#9FAC9D] text-white border-[#9FAC9D]"
                      : "bg-[#F0EBE3] text-[#5A5447] border-[#DDC8B7] hover:border-[#9FAC9D]/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Count (projects only) */}
        {!isFilesTab && displayedProjects.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-[#7A7060]">
              يُعرض{" "}
              <span className="font-bold text-[#2C2A27]">
                {displayedProjects.length}
              </span>{" "}
              {displayedProjects.length === 1 ? "مشروع" : "مشاريع"}
              {!isArchiveTab && (
                <span className="text-xs text-[#9FAC9D] mr-2">
                  (مرتبة حسب الأولوية الزمنية)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Projects content (hidden when files tab active) */}
        {!isFilesTab && (loadingProjects ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#9FAC9D] animate-spin mb-3" />
            <p className="text-sm text-[#9A8E80]">جارٍ تحميل مشاريعك...</p>
          </div>
        ) : displayedProjects.length === 0 ? (
          baseProjects.length === 0 ? (
            <EmptyState isArchive={isArchiveTab} onAdd={handleAdd} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="w-10 h-10 text-[#DDC8B7] mb-3" />
              <p className="text-[#9A8E80] font-medium">لا توجد نتائج</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                }}
                className="mt-3 text-sm text-[#9FAC9D] hover:underline font-medium"
              >
                مسح الفلاتر
              </button>
            </div>
          )
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={deleteProject}
                showCategory={false}
              />
            ))}
          </div>
        ) : (
          <ListView
            projects={displayedProjects}
            onEdit={handleEdit}
            onDelete={deleteProject}
          />
        ))}
      </main>

      {/* Modal */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditProject(null);
        }}
        onSave={handleSave}
        editProject={editProject}
        defaultCategory="personal"
        defaultYear={new Date().getFullYear()}
      />
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({
  isArchive,
  onAdd,
}: {
  isArchive: boolean;
  onAdd: () => void;
}) {
  if (isArchive) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#DFD8C5] flex items-center justify-center mb-5 text-3xl">
          ✅
        </div>
        <h3 className="text-lg font-bold text-[#2C2A27] mb-2">
          لا توجد مشاريع منجزة بعد
        </h3>
        <p className="text-sm text-[#9A8E80] text-center max-w-xs leading-relaxed">
          المشاريع التي تحمل حالة "مكتمل ومسدد" ستظهر هنا تلقائياً.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-16 h-16 rounded-2xl bg-[#DFD8C5] flex items-center justify-center mb-5 text-3xl">
        🎼
      </div>
      <h3 className="text-lg font-bold text-[#2C2A27] mb-2">
        لا توجد مشاريع نشطة حالياً
      </h3>
      <p className="text-sm text-[#9A8E80] text-center mb-6 max-w-xs leading-relaxed">
        ابدأ بإضافة مشروع جديد وتتبع دفعاته وأيام التسليم المتبقية.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 bg-[#9FAC9D] hover:bg-[#8A9A88] text-white font-semibold rounded-xl transition-all duration-150 shadow-sm text-sm"
      >
        <Plus className="w-4 h-4" />
        أضف مشروعاً جديداً
      </button>
    </div>
  );
}

// ── List View ────────────────────────────────────────────────────────────────
function ListView({
  projects,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) {
  const COLS = "grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr_1.1fr_1fr_auto]";

  return (
    <div className="bg-[#DFD8C5] rounded-2xl border border-[#DDC8B7]/60 overflow-hidden shadow-sm">
      <div className={cn("grid gap-3 px-6 py-3.5 border-b border-[#DDC8B7]/60 bg-[#DFD8C5]", COLS)}>
        {["القسم", "اسم المشروع", "العميل", "نوع الإنتاج", "قيمة العقد", "المتبقي", "الحالة", ""].map(
          (h, i) => (
            <span key={i} className="text-xs font-bold text-[#7A7060] uppercase tracking-wider">
              {h}
            </span>
          )
        )}
      </div>

      <div className="divide-y divide-[#DDC8B7]/40">
        {projects.map((project) => {
          const statusStyle = STATUS_COLORS[project.status];
          const typeColor = PRODUCTION_TYPE_COLORS[project.productionType] ?? DEFAULT_TYPE_COLOR;
          const remaining =
            project.contractValue - (project.advancePayment + project.finalPayment);
          const isFullyPaid = remaining <= 0;
          const hasDeliveryDate = Boolean(project.deliveryDate);
          const rawDays = hasDeliveryDate ? getRemainingDays(project.deliveryDate) : null;
          const remainingDays = rawDays !== null && rawDays >= 0 ? rawDays : null;

          const catDotColors: Record<string, string> = {
            personal: "bg-[#B88A62]",
            corporate: "bg-[#486A6C]",
            major: "bg-[#7A5E8A]",
          };

          return (
            <div
              key={project.id}
              className={cn(
                "grid gap-3 px-6 py-4 items-center hover:bg-[#ECE4D7]/50 transition-colors duration-150",
                COLS
              )}
            >
              {/* Category */}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    catDotColors[project.category] ?? "bg-[#9FAC9D]"
                  )}
                />
                <span className="text-xs font-semibold text-[#6A6055] truncate">
                  {CATEGORY_ICONS[project.category]} {CATEGORY_LABELS[project.category]}
                </span>
              </div>

              {/* Name */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2C2A27] truncate">
                  {project.name}
                </p>
                {remainingDays !== null && project.status !== "fully_settled" ? (
                  <p
                    className={cn(
                      "text-xs mt-0.5 font-medium",
                      remainingDays <= 7 ? "text-orange-500" : "text-[#9A8E80]"
                    )}
                  >
                    باقي {remainingDays} يوم
                  </p>
                ) : !hasDeliveryDate ? (
                  <p className="text-xs mt-0.5 text-[#B0A898]">غير مجدول</p>
                ) : null}
              </div>

              <p className="text-sm text-[#5A5447] truncate">{project.client}</p>

              <span
                className={cn(
                  "inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-lg border w-fit",
                  typeColor
                )}
              >
                {project.productionType}
              </span>

              <span className="text-sm font-bold text-[#5A7358]">
                {formatCurrency(project.contractValue)}
              </span>

              <span
                className={cn(
                  "text-sm font-bold",
                  isFullyPaid ? "text-[#2D5E2A]" : "text-[#C4604A]"
                )}
              >
                {isFullyPaid ? "✓ مسدد" : formatCurrency(remaining)}
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border w-fit",
                  statusStyle.bg,
                  statusStyle.text,
                  statusStyle.border
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusStyle.dot)} />
                <span className="hidden sm:inline">{STATUS_LABELS[project.status]}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(project)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#89999A] hover:bg-[#ECE4D7] hover:text-[#5A7358] transition-all"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => onDelete(project.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#89999A] hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// suppress unused import
const _unused = { formatDate };
