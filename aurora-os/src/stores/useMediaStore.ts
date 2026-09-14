import { create } from 'zustand';
import { loadState, saveState } from '../core/persistence';

export type PhotoKind = 'image' | 'video';

export interface Photo {
  id: string;
  uri: string;
  caption: string;
  createdAt: number;
  type?: PhotoKind;
  thumbnail?: string;
}

function seedPhotos(): Photo[] {
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9'];
  const captions = ['Playa', 'Montaña', 'Atardecer', 'Bosque', 'Ciudad', 'Océano'];
  return colors.map((c, i) => ({
    id: `seed_${i}`,
    uri: c,
    caption: captions[i],
    createdAt: Date.now() - (6 - i) * 86400000,
  }));
}

interface MediaState {
  photos: Photo[];
  addPhoto: (uri: string, caption?: string, type?: PhotoKind, thumbnail?: string) => void;
  removePhoto: (id: string) => void;
  clear: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  photos: loadState('media:photos', seedPhotos()),

  addPhoto: (uri, caption = 'Foto', type: PhotoKind = 'image', thumbnail?: string) =>
    set(s => {
      const photos = [
        { id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, uri, caption, createdAt: Date.now(), type, thumbnail },
        ...s.photos,
      ];
      saveState('media:photos', photos);
      return { photos };
    }),

  removePhoto: id =>
    set(s => {
      const photos = s.photos.filter(p => p.id !== id);
      saveState('media:photos', photos);
      return { photos };
    }),

  clear: () => {
    saveState('media:photos', []);
    set({ photos: [] });
  },
}));

export function isColorUri(uri: string): boolean {
  return /^#/.test(uri);
}