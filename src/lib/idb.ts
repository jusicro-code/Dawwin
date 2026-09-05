/**
 * IndexedDB wrapper for Boards / Workspaces system.
 * Two object stores: "boards" and "board_items".
 */

const DB_NAME = "dawwin_boards";
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("boards")) {
        const bs = db.createObjectStore("boards", { keyPath: "id" });
        bs.createIndex("order", "order", { unique: false });
      }

      if (!db.objectStoreNames.contains("board_items")) {
        const is = db.createObjectStore("board_items", { keyPath: "id" });
        is.createIndex("boardId", "boardId", { unique: false });
        is.createIndex("parentId", "parentId", { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

// ── Generic helpers ──────────────────────────────────────────────────────────

function tx(
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode = "readonly"
): IDBTransaction {
  return db.transaction(stores, mode);
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

// ── Boards ───────────────────────────────────────────────────────────────────

export async function getBoards(): Promise<import("@/types/boards").Board[]> {
  const db = await openDB();
  const store = tx(db, "boards").objectStore("boards");
  const all = await promisify<import("@/types/boards").Board[]>(store.getAll());
  return all.sort((a, b) => a.order - b.order);
}

export async function saveBoard(board: import("@/types/boards").Board): Promise<void> {
  const db = await openDB();
  const store = tx(db, "boards", "readwrite").objectStore("boards");
  await promisify(store.put(board));
}

export async function deleteBoard(id: string): Promise<void> {
  const db = await openDB();
  const t = tx(db, ["boards", "board_items"], "readwrite");
  await promisify(t.objectStore("boards").delete(id));
  // also remove all items belonging to this board
  const itemStore = t.objectStore("board_items");
  const idx = itemStore.index("boardId");
  const items = await promisify<import("@/types/boards").BoardItem[]>(idx.getAll(id));
  await Promise.all(items.map((it) => promisify(itemStore.delete(it.id))));
}

// ── Board Items ──────────────────────────────────────────────────────────────

export async function getBoardItems(
  boardId: string
): Promise<import("@/types/boards").BoardItem[]> {
  const db = await openDB();
  const store = tx(db, "board_items").objectStore("board_items");
  const idx = store.index("boardId");
  return promisify<import("@/types/boards").BoardItem[]>(idx.getAll(boardId));
}

export async function saveBoardItem(
  item: import("@/types/boards").BoardItem
): Promise<void> {
  const db = await openDB();
  const store = tx(db, "board_items", "readwrite").objectStore("board_items");
  await promisify(store.put(item));
}

export async function deleteBoardItem(id: string): Promise<void> {
  const db = await openDB();
  const store = tx(db, "board_items", "readwrite").objectStore("board_items");
  await promisify(store.delete(id));
}

// Delete item + all its recursive children
export async function deleteBoardItemDeep(
  id: string,
  allItems: import("@/types/boards").BoardItem[]
): Promise<void> {
  const db = await openDB();
  const store = tx(db, "board_items", "readwrite").objectStore("board_items");

  const toDelete = collectDescendants(id, allItems);
  toDelete.add(id);

  await Promise.all([...toDelete].map((tid) => promisify(store.delete(tid))));
}

function collectDescendants(
  parentId: string,
  all: import("@/types/boards").BoardItem[]
): Set<string> {
  const set = new Set<string>();
  const children = all.filter((i) => i.parentId === parentId);
  for (const ch of children) {
    set.add(ch.id);
    const nested = collectDescendants(ch.id, all);
    nested.forEach((x) => set.add(x));
  }
  return set;
}

// ── Storage estimate ─────────────────────────────────────────────────────────

export async function getStorageInfo(): Promise<import("@/types/boards").StorageInfo> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const est = await navigator.storage.estimate();
    const usage = est.usage ?? 0;
    const quota = est.quota ?? 0;
    const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
    return { usage, quota, percent, supported: true };
  }
  return { usage: 0, quota: 0, percent: 0, supported: false };
}
