import type { WallpaperFit, WallpaperPosition } from '../types';

export const ALL_FITS: WallpaperFit[] = ['cover', 'contain', 'stretch', 'original'];

export const FIT_LABELS: Record<WallpaperFit, string> = {
  cover: 'Cubrir',
  contain: 'Ajustar',
  stretch: 'Estirar',
  original: 'Original',
};

// Orden para el grid 3x3 de posición.
export const ALL_POSITIONS: WallpaperPosition[] = [
  'top-left', 'top', 'top-right',
  'left', 'center', 'right',
  'bottom-left', 'bottom', 'bottom-right',
];

export const POSITION_LABELS: Record<WallpaperPosition, string> = {
  center: 'Centro',
  top: 'Arriba',
  bottom: 'Abajo',
  left: 'Izquierda',
  right: 'Derecha',
  'top-left': 'Arriba izq.',
  'top-right': 'Arriba der.',
  'bottom-left': 'Abajo izq.',
  'bottom-right': 'Abajo der.',
};

export function backgroundSizeFor(fit: WallpaperFit): string {
  switch (fit) {
    case 'cover':
      return 'cover';
    case 'contain':
      return 'contain';
    case 'stretch':
      return '100% 100%';
    case 'original':
      return 'auto';
  }
}

export function backgroundPositionFor(position: WallpaperPosition): string {
  switch (position) {
    case 'center':
      return 'center';
    case 'top':
      return 'top center';
    case 'bottom':
      return 'bottom center';
    case 'left':
      return 'left center';
    case 'right':
      return 'right center';
    case 'top-left':
      return 'top left';
    case 'top-right':
      return 'top right';
    case 'bottom-left':
      return 'bottom left';
    case 'bottom-right':
      return 'bottom right';
  }
}