import { create } from 'zustand';
import { loadState, saveState } from '../core/persistence';
import { ALL_APPS } from '../components/shell/Launcher';

export const MAX_DOCK_APPS = 4;
export const DEFAULT_DOCK_IDS = ['phone', 'messages', 'browser', 'music'];

const STORAGE_KEY = 'dock-layout';

interface DockStore {
  appIds: string[];
  editMode: boolean;
  enterEditMode: () => void;
  exitEditMode: () => void;
  addApp: (id: string) => void;
  removeApp: (id: string) => void;
  resetToDefault: () => void;
}

function sanitize(input: unknown): string[] {
  const known = new Set(ALL_APPS.map(a => a.id));
  const raw = Array.isArray(input) ? input : [];
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id === 'string' && known.has(id) && !out.includes(id)) {
      out.push(id);
    }
    if (out.length >= MAX_DOCK_APPS) break;
  }
  return out;
}

const saved = loadState<unknown>(STORAGE_KEY, null);
const fallback: string[] = sanitize(DEFAULT_DOCK_IDS);
const initial = Array.isArray(saved) && saved.length > 0 ? sanitize(saved) : fallback;

function persist(state: Pick<DockStore, 'appIds'>) {
  saveState(STORAGE_KEY, state.appIds);
}

export const useDockStore = create<DockStore>((set, get) => ({
  appIds: initial,
  editMode: false,

  enterEditMode: () => set({ editMode: true }),
  exitEditMode: () => set({ editMode: false }),

  addApp: (id) => {
    const { appIds } = get();
    if (appIds.includes(id) || appIds.length >= MAX_DOCK_APPS) return;
    set({ appIds: [...appIds, id] });
    persist(get());
  },

  removeApp: (id) => {
    const { appIds } = get();
    if (!appIds.includes(id)) return;
    set({ appIds: appIds.filter(a => a !== id) });
    persist(get());
  },

  resetToDefault: () => {
    set({ appIds: [...DEFAULT_DOCK_IDS] });
    persist(get());
  },
}));