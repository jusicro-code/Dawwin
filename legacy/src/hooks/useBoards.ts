import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBoards,
  saveBoard,
  deleteBoard,
  getBoardItems,
  saveBoardItem,
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

  // Use a ref to always have the latest activeBoardId in callbacks without stale closures
  const activeBoardIdRef = useRef(activeBoardId);
  useEffect(() => {
    activeBoardIdRef.current = activeBoardId;
  }, [activeBoardId]);

  // Use a ref to always have latest items in callbacks
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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
    getBoardItems(activeBoardId).then((loaded) => {
      setItems(loaded);
    });
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
      if (activeBoardIdRef.current === id) setActiveBoardId("default");
    },
    []
  );

  const copyBoard = useCallback(
    async (id: string) => {
      const currentBoards = await getBoards();
      const src = currentBoards.find((b) => b.id === id);
      if (!src) return;
      const newId = genId();
      const newBoard: Board = {
        ...src,
        id: newId,
        name: `${src.name} (نسخة)`,
        order: currentBoards.length,
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
    []
  );

  const reorderBoards = useCallback(async (reordered: Board[]) => {
    const updated = reordered.map((b, i) => ({ ...b, order: i }));
    setBoards(updated);
    for (const b of updated) await saveBoard(b);
  }, []);

  // ── Item CRUD — use refs to avoid stale closures ──────────────────────────

  const addItem = useCallback(
    async (
      type: BoardItemType,
      name: string,
      parentId: string | null,
      extra?: Partial<BoardItem>
    ): Promise<BoardItem> => {
      // Always read the latest activeBoardId via ref
      const boardId = activeBoardIdRef.current;
      const item: BoardItem = {
        id: genId(),
        boardId,
        parentId,
        type,
        name,
        content: "",
        ...extra,
        // Override boardId in case extra had a different one
        boardId: boardId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveBoardItem(item);
      // Immediately append to state — only if still on same board
      setItems((prev) => {
        // Prevent duplicates
        if (prev.find((it) => it.id === item.id)) return prev;
        return [...prev, item];
      });
      return item;
    },
    [] // No deps needed — uses refs
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<BoardItem>) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it
        )
      );
      // Read latest from ref
      const current = itemsRef.current.find((it) => it.id === id);
      if (current) {
        await saveBoardItem({ ...current, ...patch, updatedAt: new Date().toISOString() });
      }
    },
    []
  );

  const removeItem = useCallback(
    async (id: string) => {
      const currentItems = itemsRef.current;
      await deleteBoardItemDeep(id, currentItems);
      const toDelete = new Set<string>();
      const collect = (pid: string) => {
        toDelete.add(pid);
        currentItems.filter((i) => i.parentId === pid).forEach((c) => collect(c.id));
      };
      collect(id);
      setItems((prev) => prev.filter((it) => !toDelete.has(it.id)));
    },
    []
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
      const current = itemsRef.current.find((it) => it.id === id);
      if (current) {
        const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
        await saveBoardItem(updated);
        // If moved to another board, remove from current view
        if (newBoardId && newBoardId !== activeBoardIdRef.current) {
          setItems((prev) => prev.filter((it) => it.id !== id));
        }
      }
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File, parentId: string | null): Promise<BoardItem> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const boardId = activeBoardIdRef.current;
            const itemType: BoardItemType = file.type.startsWith("image/") ? "image" : "file";
            const item: BoardItem = {
              id: genId(),
              boardId,
              parentId,
              type: itemType,
              name: file.name,
              content: "",
              data: reader.result as string,
              mimeType: file.type,
              size: file.size,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await saveBoardItem(item);
            setItems((prev) => {
              if (prev.find((it) => it.id === item.id)) return prev;
              return [...prev, item];
            });
            const info = await getStorageInfo();
            setStorage(info);
            resolve(item);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },
    []
  );

  const refreshItems = useCallback(() => {
    return getBoardItems(activeBoardIdRef.current).then((loaded) => {
      setItems(loaded);
    });
  }, []);

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
    refreshItems,
  };
}
