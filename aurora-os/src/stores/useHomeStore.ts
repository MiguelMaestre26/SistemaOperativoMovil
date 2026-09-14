import { create } from 'zustand';
import { loadState, saveState } from '../core/persistence';
import { ALL_APPS } from '../components/shell/Launcher';

export interface HomeFolder {
  id: string;
  name: string;
  apps: string[];
}

export type HomeItem =
  | { kind: 'app'; id: string }
  | { kind: 'folder'; id: string };

interface HomeLayout {
  items: HomeItem[];
  folders: Record<string, HomeFolder>;
}

interface HomeStore extends HomeLayout {
  editMode: boolean;
  enterEditMode: () => void;
  exitEditMode: () => void;
  moveItem: (from: number, to: number) => void;
  createFolder: (appIds: string[], name: string) => string;
  addToFolder: (appId: string, folderId: string) => void;
  removeFromFolder: (appId: string, folderId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
}

const STORAGE_KEY = 'home-layout';

const DEFAULT_ITEMS: HomeItem[] = ALL_APPS.map(a => ({ kind: 'app', id: a.id }));

const saved = loadState<{ items: HomeItem[]; folders: Record<string, HomeFolder> } | null>(STORAGE_KEY, null);
const baseItems: HomeItem[] = Array.isArray(saved?.items) && saved!.items.length > 0 ? saved!.items : DEFAULT_ITEMS;
const presentIds = new Set(
  baseItems.flatMap(it => {
    if (it.kind === 'app') return [it.id];
    const apps = saved?.folders?.[it.id]?.apps ?? [];
    return apps;
  })
);
const missingApps: HomeItem[] = ALL_APPS
  .filter(a => !presentIds.has(a.id))
  .map(a => ({ kind: 'app', id: a.id }));
const initialItems: HomeItem[] = [...baseItems, ...missingApps];
const initialFolders: Record<string, HomeFolder> = saved?.folders ?? {};

function makeId(): string {
  return 'folder-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function persist(state: HomeStore) {
  saveState(STORAGE_KEY, { items: state.items, folders: state.folders });
}

export const useHomeStore = create<HomeStore>((set, get) => ({
  items: initialItems,
  folders: initialFolders,
  editMode: false,

  enterEditMode: () => set({ editMode: true }),
  exitEditMode: () => set({ editMode: false }),

  moveItem: (from, to) => {
    const { items } = get();
    if (from === to || from < 0 || to < 0 || from >= items.length || to > items.length) return;
    const arr = [...items];
    const [moved] = arr.splice(from, 1);
    const insertAt = from < to ? to - 1 : to;
    arr.splice(insertAt, 0, moved);
    set({ items: arr });
    persist(get());
  },

  createFolder: (appIds, name) => {
    const id = makeId();
    set(state => {
      const ids = new Set(appIds);
      const remaining = state.items.filter(it => !(it.kind === 'app' && ids.has(it.id)));
      const firstMatch = state.items.findIndex(it => it.kind === 'app' && ids.has(it.id));
      const at = firstMatch >= 0 ? Math.min(firstMatch, remaining.length) : remaining.length;
      remaining.splice(at, 0, { kind: 'folder', id });
      return {
        items: remaining,
        folders: { ...state.folders, [id]: { id, name, apps: [...appIds] } },
      };
    });
    persist(get());
    return id;
  },

  addToFolder: (appId, folderId) => {
    set(state => {
      const folder = state.folders[folderId];
      if (!folder || folder.apps.includes(appId)) return state;
      return {
        items: state.items.filter(it => !(it.kind === 'app' && it.id === appId)),
        folders: {
          ...state.folders,
          [folderId]: { ...folder, apps: [...folder.apps, appId] },
        },
      };
    });
    persist(get());
  },

  removeFromFolder: (appId, folderId) => {
    set(state => {
      const folder = state.folders[folderId];
      if (!folder) return state;
      const apps = folder.apps.filter(a => a !== appId);
      const folders = { ...state.folders };
      let items = [...state.items];
      if (apps.length === 0) {
        delete folders[folderId];
        items = items.filter(it => !(it.kind === 'folder' && it.id === folderId));
      } else {
        folders[folderId] = { ...folder, apps };
        const folderItemIdx = items.findIndex(it => it.kind === 'folder' && it.id === folderId);
        if (folderItemIdx >= 0) items.splice(folderItemIdx, 0, { kind: 'app', id: appId });
      }
      return { items, folders };
    });
    persist(get());
  },

  renameFolder: (folderId, name) => {
    set(state => {
      const folder = state.folders[folderId];
      if (!folder) return state;
      return { folders: { ...state.folders, [folderId]: { ...folder, name } } };
    });
    persist(get());
  },

  deleteFolder: (folderId) => {
    set(state => {
      const folder = state.folders[folderId];
      if (!folder) return state;
      const folders = { ...state.folders };
      delete folders[folderId];
      const items = state.items.filter(it => !(it.kind === 'folder' && it.id === folderId));
      folder.apps.forEach(id => items.push({ kind: 'app', id }));
      return { items, folders };
    });
    persist(get());
  },
}));