import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBoards,
  saveBoard,
  deleteBoard,
  getBoardItems,
  saveBoardItem,
  deleteBoardItem,
  deleteBoardItemDeep,
  getStorageInfo,
} from "@/lib/idb";
import { Board, BoardItem, BoardItemType, StorageInfo, BOARD_COLORS, BOARD_ICONS } from "@/types/boards";

const DEFAULT_BOARD: Board = {
  id: "default",
  name: "المساحة الرئيسية",
  color: BOARD_COLORS[0],
  icon: "🎼",
  order: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([DEFAULT_BOARD]);
  const [activeBoardId, setActiveBoardId] = useState<string>("default");
  const [items, setItems] = useState<BoardItem[]>([]);
  const [storage, setStorage] = useState<StorageInfo>({ usage: 0, quota: 0, percent: 0, supported: false });
  const [ready, setReady] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      let storedBoards = await getBoards();
      if (!storedBoards.find((b) => b.id === "default")) {
        await saveBoard(DEFAULT_BOARD);
        storedBoards = [DEFAULT_BOARD, ...storedBoards];
      }
      setBoards(storedBoards.sort((a, b) => a.order - b.order));
      const info = await getStorageInfo();
      setStorage(info);
      setReady(true);
    })();
  }, []);

  // ── Load items when active board changes ──────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    getBoardItems(activeBoardId).then(setItems);
  }, [activeBoardId, ready]);

  // ── Refresh storage every 30s ─────────────────────────────────────────────
  useEffect(() => {
    refreshTimer.current = setInterval(async () => {
      const info = await getStorageInfo();
      setStorage(info);
    }, 30_000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, []);

  // ── Board CRUD ────────────────────────────────────────────────────────────

  const addBoard = useCallback(
    async (name: string, color: string, icon: string): Promise<Board> => {
      const board: Board = {
        id: genId(),
        name,
        color,
        icon,
        order: boards.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveBoard(board);
      setBoards((prev) => [...prev, board]);
      return board;
    },
    [boards.length]
  );

  const renameBoard = useCallback(async (id: string, name: string) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, name, updatedAt: new Date().toISOString() } : b
      )
    );
    const all = await getBoards();
    const b = all.find((x) => x.id === id);
    if (b) await saveBoard({ ...b, name, updatedAt: new Date().toISOString() });
  }, []);

  const updateBoardStyle = useCallback(
    async (id: string, color: string, icon: string) => {
      setBoards((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, color, icon, updatedAt: new Date().toISOString() } : b
        )
      );
      const all = await getBoards();
      const b = all.find((x) => x.id === id);
      if (b) await saveBoard({ ...b, color, icon, updatedAt: new Date().toISOString() });
    },
    []
  );

  const removeBoardById = useCallback(
    async (id: string) => {
      if (id === "default") return;
      await deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
      if (activeBoardId === id) setActiveBoardId("default");
    },
    [activeBoardId]
  );

  const copyBoard = useCallback(
    async (id: string) => {
      const src = boards.find((b) => b.id === id);
      if (!src) return;
      const newId = genId();
      const newBoard: Board = {
        ...src,
        id: newId,
        name: `${src.name} (نسخة)`,
        order: boards.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveBoard(newBoard);
      // Copy all items
      const srcItems = await getBoardItems(id);
      const idMap = new Map<string, string>();
      srcItems.forEach((it) => idMap.set(it.id, genId()));
      for (const it of srcItems) {
        const newItem: BoardItem = {
          ...it,
          id: idMap.get(it.id)!,
          boardId: newId,
          parentId: it.parentId ? (idMap.get(it.parentId) ?? null) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveBoardItem(newItem);
      }
      setBoards((prev) => [...prev, newBoard]);
    },
    [boards]
  );

  const reorderBoards = useCallback(async (reordered: Board[]) => {
    const updated = reordered.map((b, i) => ({ ...b, order: i }));
    setBoards(updated);
    for (const b of updated) await saveBoard(b);
  }, []);

  // ── Item CRUD ─────────────────────────────────────────────────────────────

  const addItem = useCallback(
    async (
      type: BoardItemType,
      name: string,
      parentId: string | null,
      extra?: Partial<BoardItem>
    ): Promise<BoardItem> => {
      const item: BoardItem = {
        id: genId(),
        boardId: activeBoardId,
        parentId,
        type,
        name,
        content: "",
        ...extra,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveBoardItem(item);
      setItems((prev) => [...prev, item]);
      return item;
    },
    [activeBoardId]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<BoardItem>) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it
        )
      );
      const current = items.find((it) => it.id === id);
      if (current) {
        await saveBoardItem({ ...current, ...patch, updatedAt: new Date().toISOString() });
      }
    },
    [items]
  );

  const removeItem = useCallback(
    async (id: string) => {
      await deleteBoardItemDeep(id, items);
      const toDelete = new Set<string>();
      const collect = (pid: string) => {
        toDelete.add(pid);
        items.filter((i) => i.parentId === pid).forEach((c) => collect(c.id));
      };
      collect(id);
      setItems((prev) => prev.filter((it) => !toDelete.has(it.id)));
    },
    [items]
  );

  const moveItem = useCallback(
    async (id: string, newParentId: string | null, newBoardId?: string) => {
      const patch: Partial<BoardItem> = { parentId: newParentId };
      if (newBoardId) patch.boardId = newBoardId;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it
        )
      );
      const current = items.find((it) => it.id === id);
      if (current) {
        const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
        await saveBoardItem(updated);
        if (newBoardId && newBoardId !== activeBoardId) {
          setItems((prev) => prev.filter((it) => it.id !== id));
        }
      }
    },
    [items, activeBoardId]
  );

  const uploadFile = useCallback(
    async (file: File, parentId: string | null): Promise<BoardItem> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const item = await addItem("file", file.name, parentId, {
            type: file.type.startsWith("image/") ? "image" : "file",
            data: reader.result as string,
            mimeType: file.type,
            size: file.size,
          });
          const info = await getStorageInfo();
          setStorage(info);
          resolve(item);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },
    [addItem]
  );

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];

  return {
    boards,
    activeBoardId,
    activeBoard,
    setActiveBoardId,
    items,
    storage,
    ready,
    addBoard,
    renameBoard,
    updateBoardStyle,
    removeBoard: removeBoardById,
    copyBoard,
    reorderBoards,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    uploadFile,
    refreshItems: () => getBoardItems(activeBoardId).then(setItems),
  };
}
