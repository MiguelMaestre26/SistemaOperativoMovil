import { create } from 'zustand';
import { eventBus } from '../core/EventBus';
import { batteryManager } from '../core/BatteryManager';
import { memoryManager } from '../core/MemoryManager';
import { storageManager } from '../core/StorageManager';
import { loadState, saveState } from '../core/persistence';
import { notificationService } from '../core/NotificationService';
import type { PowerState, WallpaperFit, WallpaperPosition } from '../types';

const WALLPAPER_MAX = 1280;

// Reduce la imagen antes de guardarla para que siempre quepa en localStorage
// (las data-URL grandes superan la cuota y el fondo "no se mantenía").
function prepareWallpaper(url: string): Promise<string> {
  if (!url || url.startsWith('#') || !url.startsWith('data:image/')) return Promise.resolve(url);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const scale = w && h ? Math.min(1, WALLPAPER_MAX / Math.max(w, h)) : 1;
        if (scale >= 1) return resolve(url);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(url);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const png = /^data:image\/(png|gif)/i.test(url);
        return resolve(canvas.toDataURL(png ? 'image/png' : 'image/jpeg', 0.85));
      } catch {
        return resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

interface SystemStore {
  batteryLevel: number;
  isCharging: boolean;
  brightness: number;
  volume: number;
  isDarkMode: boolean;
  isWifiOn: boolean;
  isBluetoothOn: boolean;
  isAirplaneMode: boolean;
  isDoNotDisturb: boolean;
  isFocusMode: boolean;
  currentTime: Date;
  wallpaper: string;
  wallpaperFit: WallpaperFit;
  wallpaperPosition: WallpaperPosition;
  accent: string;
  totalStorage: number;
  usedStorage: number;
  totalMemory: number;
  usedMemory: number;
  screenLocked: boolean;
  powerState: PowerState;
  pinCode: string;
  setBatteryLevel: (level: number) => void;
  setCharging: (value: boolean) => void;
  setBrightness: (value: number) => void;
  setVolume: (value: number) => void;
  setDarkMode: (value: boolean) => void;
  setWifi: (value: boolean) => void;
  setBluetooth: (value: boolean) => void;
  setAirplaneMode: (value: boolean) => void;
  setDoNotDisturb: (value: boolean) => void;
  setFocusMode: (value: boolean) => void;
  setWallpaper: (url: string) => void;
  setWallpaperFit: (fit: WallpaperFit) => void;
  setWallpaperPosition: (position: WallpaperPosition) => void;
  setAccent: (accent: string) => void;
  updateTime: () => void;
  setScreenLocked: (value: boolean) => void;
  setPowerState: (value: PowerState) => void;
  setPinCode: (pin: string) => void;
}

let preAirplane = { wifi: true, bluetooth: false };

export const useSystemStore = create<SystemStore>((set) => ({
  batteryLevel: batteryManager.getLevel(),
  isCharging: false,
  brightness: 80,
  volume: 50,
  isDarkMode: false,
  isWifiOn: true,
  isBluetoothOn: false,
  isAirplaneMode: false,
  isDoNotDisturb: false,
  isFocusMode: false,
  currentTime: new Date(),
  wallpaper: loadState<string>('wallpaper', ''),
  wallpaperFit: loadState<WallpaperFit>('wallpaperFit', 'cover'),
  wallpaperPosition: loadState<WallpaperPosition>('wallpaperPosition', 'center'),
  accent: loadState<string>('auroraos:accent', 'blue'),
  totalStorage: storageManager.getTotal(),
  usedStorage: storageManager.getUsed(),
  totalMemory: memoryManager.getTotal(),
  usedMemory: memoryManager.getUsed(),
  screenLocked: true,
  powerState: 'on',
  pinCode: loadState<string>('auroraos:pin', '1234'),

  setBatteryLevel: (level) => set({ batteryLevel: level }),
  setCharging: (value) => {
    batteryManager.setCharging(value);
    set({ isCharging: value });
  },
  setBrightness: (value) => set({ brightness: value }),
  setVolume: (value) => set({ volume: value }),
  setDarkMode: (value) => set({ isDarkMode: value }),
  setWifi: (value) => set({ isWifiOn: value }),
  setBluetooth: (value) => set({ isBluetoothOn: value }),
  setAirplaneMode: (value) => {
    set(state => {
      if (value) {
        // Guarda el estado anterior para restaurarlo al salir del modo avión.
        preAirplane = { wifi: state.isWifiOn, bluetooth: state.isBluetoothOn && !state.isAirplaneMode };
        return { isAirplaneMode: true, isWifiOn: false, isBluetoothOn: false };
      }
      return { isAirplaneMode: false, isWifiOn: preAirplane.wifi, isBluetoothOn: preAirplane.bluetooth };
    });
  },
  setDoNotDisturb: (value) => set({ isDoNotDisturb: value }),
  setFocusMode: (value) => set({ isFocusMode: value }),
  setAccent: (accent) => {
    saveState('auroraos:accent', accent);
    set({ accent });
  },
  setWallpaper: (url) => {
    void prepareWallpaper(url).then(final => {
      saveState('wallpaper', final);
      set({ wallpaper: final });
      notificationService.push('launcher', 'Fondo de pantalla', final ? 'Fondo actualizado.' : 'Fondo restaurado.');
    });
  },
  setWallpaperFit: (fit) => {
    saveState('wallpaperFit', fit);
    set({ wallpaperFit: fit });
  },
  setWallpaperPosition: (position) => {
    saveState('wallpaperPosition', position);
    set({ wallpaperPosition: position });
  },
  updateTime: () => set({ currentTime: new Date() }),
  setScreenLocked: (value) => set({ screenLocked: value }),
  setPowerState: (value) => set({ powerState: value }),
  setPinCode: (pin) => {
    saveState('auroraos:pin', pin);
    set({ pinCode: pin });
  },
}));

eventBus.on('battery:changed', (args) => {
  const { level } = (args ?? {}) as { level: number };
  useSystemStore.getState().setBatteryLevel(Math.round(level));
});

eventBus.on('memory:changed', (args) => {
  const { used, total } = (args ?? {}) as { used: number; total: number };
  useSystemStore.setState({ usedMemory: used, totalMemory: total });
});

eventBus.on('storage:changed', (args) => {
  const { used, total } = (args ?? {}) as { used: number; total: number };
  useSystemStore.setState({ usedStorage: used, totalStorage: total });
});
