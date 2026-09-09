type OrientationListener = (isLandscape: boolean) => void;

let current = false;
const listeners = new Set<OrientationListener>();

export function getOrientation(): boolean {
  return current;
}

export function setOrientation(isLandscape: boolean): void {
  if (current === isLandscape) return;
  current = isLandscape;
  listeners.forEach((fn) => {
    try {
      fn(isLandscape);
    } catch {
      /* noop */
    }
  });
}

export function toggleOrientation(): void {
  setOrientation(!current);
}

export function onOrientationChange(fn: OrientationListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}