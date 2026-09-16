import { create } from 'zustand';
import { processManager } from '../core/ProcessManager';
import { memoryManager } from '../core/MemoryManager';
import type { AppDefinition, AppInstance } from '../types';
import { ALL_APPS } from '../components/shell/Launcher';

interface AppStore {
  installedApps: AppDefinition[];
  openApps: AppInstance[];
  activeAppId: string | null;
  recentApps: string[];

  installApp: (app: AppDefinition) => void;
  openApp: (appId: string) => void;
  closeApp: (appId: string) => void;
  minimizeApp: (appId: string) => void;
  maximizeApp: (appId: string) => void;
  setActiveApp: (appId: string | null) => void;
  bringToFront: (appId: string) => void;
  getOpenApps: () => AppInstance[];
  isAppOpen: (appId: string) => boolean;
}

const APP_MEMORY: Record<string, number> = {
  calculator: 48, clock: 32, notes: 64, settings: 80,
  'file-manager': 96, camera: 128, gallery: 112, browser: 196,
  phone: 72, messages: 88, weather: 48, music: 108, email: 120,
  'chocolate-plan': 256, pokedex: 128,
  telegram: 128, whatsapp: 196, youtube: 220,
  'hbo-max': 240, 'disney-plus': 260, netflix: 260, gmail: 180,
  snake: 64,
  'ujap-en-linea': 180, 'acropolis-ujap': 180,
  'geometry-dash': 220,
  'pdf-viewer': 160,
};

export const useAppStore = create<AppStore>((set, get) => ({
  installedApps: ALL_APPS,
  openApps: [],
  activeAppId: null,
  recentApps: [],

  installApp: (app) => {
    const current = get().installedApps;
    if (!current.find(a => a.id === app.id)) {
      set({ installedApps: [...current, app] });
    }
  },

  openApp: (appId) => {
    const state = get();
    const existing = state.openApps.find(a => a.definition.id === appId && a.status !== 'terminated');
    if (existing) {
      get().bringToFront(appId);
      return;
    }

    const definition = state.installedApps.find(a => a.id === appId) || ALL_APPS.find(a => a.id === appId);
    if (!definition) return;

    if (!memoryManager.allocate(APP_MEMORY[appId] || 80)) {
      processManager.killOldest();
    }

    processManager.launch(appId, definition.name, APP_MEMORY[appId] || 80);
    const z = Math.max(0, ...state.openApps.map(a => a.zIndex)) + 1;

    const instance: AppInstance = {
      id: appId,
      definition,
      status: 'running',
      memoryUsage: APP_MEMORY[appId] || 80,
      batteryDrain: 0.05,
      launchedAt: Date.now(),
      lastActiveAt: Date.now(),
      zIndex: z,
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      minimized: false,
    };

    const recent = state.recentApps.filter(id => id !== appId);
    recent.unshift(appId);

    set({
      openApps: [...state.openApps, instance],
      activeAppId: appId,
      recentApps: recent.slice(0, 10),
    });
  },

  closeApp: (appId) => {
    const state = get();
    const app = state.openApps.find(a => a.id === appId);
    if (app) {
      memoryManager.free(app.memoryUsage);
      processManager.terminate(appId);
    }
    const remaining = state.openApps.filter(a => a.id !== appId);
    set({
      openApps: remaining,
      activeAppId: remaining.length > 0 ? remaining[remaining.length - 1].id : null,
    });
  },

  minimizeApp: (appId) => {
    set(state => ({
      openApps: state.openApps.map(a =>
        a.id === appId ? { ...a, minimized: true } : a
      ),
      activeAppId: state.openApps.filter(a => a.id !== appId && !a.minimized).pop()?.id || null,
    }));
    processManager.pause(appId);
  },

  maximizeApp: (appId) => {
    set(state => ({
      openApps: state.openApps.map(a =>
        a.id === appId ? { ...a, minimized: false } : a
      ),
    }));
    processManager.resume(appId);
  },

  setActiveApp: (appId) => set({ activeAppId: appId }),

  bringToFront: (appId) => {
    set(state => {
      const maxZ = Math.max(0, ...state.openApps.map(a => a.zIndex));
      return {
        openApps: state.openApps.map(a =>
          a.id === appId
            ? { ...a, zIndex: maxZ + 1, minimized: false, lastActiveAt: Date.now() }
            : a
        ),
        activeAppId: appId,
      };
    });
  },

  getOpenApps: () => get().openApps,
  isAppOpen: (appId) => get().openApps.some(a => a.id === appId && a.status !== 'terminated'),
}));
