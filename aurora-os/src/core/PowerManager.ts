import { useSystemStore } from '../stores/useSystemStore';

let bootTimer1: ReturnType<typeof setTimeout> | null = null;
let bootTimer2: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (bootTimer1) clearTimeout(bootTimer1);
  if (bootTimer2) clearTimeout(bootTimer2);
  bootTimer1 = null;
  bootTimer2 = null;
}

function runBootSequence() {
  clearTimers();
  bootTimer1 = setTimeout(() => useSystemStore.getState().setPowerState('booting'), 900);
  bootTimer2 = setTimeout(() => {
    useSystemStore.getState().setPowerState('on');
    useSystemStore.getState().setScreenLocked(true);
  }, 3600);
}

export const powerManager = {
  lock() {
    useSystemStore.getState().setScreenLocked(true);
  },

  unlock() {
    useSystemStore.getState().setScreenLocked(false);
  },

  shutdown() {
    clearTimers();
    useSystemStore.getState().setPowerState('off');
    useSystemStore.getState().setScreenLocked(true);
  },

  reboot() {
    clearTimers();
    useSystemStore.getState().setPowerState('off');
    useSystemStore.getState().setScreenLocked(true);
    runBootSequence();
  },

  powerOn() {
    useSystemStore.getState().setPowerState('off');
    useSystemStore.getState().setScreenLocked(true);
    runBootSequence();
  },
};
