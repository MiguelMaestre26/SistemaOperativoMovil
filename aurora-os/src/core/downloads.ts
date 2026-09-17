import { storageManager, type StorageItem } from './StorageManager';
import { notificationService } from './NotificationService';
import { useMediaStore } from '../stores/useMediaStore';
import { isNative, nativeBinaryRequest, onNativeDownload, onNativeDownloadImage } from './native';
import { openExternal } from './webapp';

type ImageListener = (info: { filename: string; dataUrl: string }) => void;

const imageListeners = new Set<ImageListener>();

export function onImageDownloaded(fn: ImageListener): () => void {
  imageListeners.add(fn);
  return () => {
    imageListeners.delete(fn);
  };
}

export function isImageItem(item: StorageItem): boolean {
  return item.content?.startsWith('data:image/') === true;
}

function emitImage(item: StorageItem): void {
  if (!isImageItem(item) || !item.content) return;
  imageListeners.forEach(fn => {
    try {
      fn({ filename: item.name, dataUrl: item.content! });
    } catch {
      /* noop */
    }
  });
}

function fileNameFromUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const last = u.pathname.split('/').filter(Boolean).pop() ?? '';
    if (/\.\w{1,5}$/i.test(last)) return last;
    return `${u.hostname.replace('www.', '')}.html`;
  } catch {
    return 'descarga.html';
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error ?? new Error('FileReader'));
    fr.readAsDataURL(blob);
  });
}

function mimeFromDataUrl(dataUrl: string): string {
  const m = /^data:([^;,]+)/.exec(dataUrl);
  return m?.[1] || 'application/octet-stream';
}

// Web: intenta la descarga directa (sitios con CORS abierto) y si falla usa el
// proxy del servidor (/proxy en dev o en un backend). Sin proxy ni CORS la
// llamada lanza para que el caller pueda abrir la URL en una pestaña.
async function fetchAsDataUrl(url: string): Promise<string> {
  const DIRECT_TIMEOUT = 8000;

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), DIRECT_TIMEOUT);
    const r = await fetch(url, { redirect: 'follow', signal: ac.signal });
    clearTimeout(t);
    if (r.ok) {
      const blob = await r.blob();
      return await blobToDataUrl(blob);
    }
  } catch {
    /* CORS o red: intentamos el proxy */
  }

  const p = await fetch(`/proxy?url=${encodeURIComponent(url)}`, { redirect: 'follow' });
  if (!p.ok) throw new Error(`HTTP ${p.status}`);
  const blob = await p.blob();
  return await blobToDataUrl(blob);
}

// Guarda una descarga (binario como data-URL) en Downloads y avisa.
export function saveDownloadPayload(filename: string, mimeType: string, dataUrl: string): StorageItem | null {
  try {
    const item = storageManager.createFile(filename, 'downloads', dataUrl, mimeType || 'application/octet-stream');
    emitImage(item);
    // Las imágenes descargadas también entran a Fotos (Galería), donde pueden
    // verse y usarse como fondo de pantalla.
    if (isImageItem(item) && item.content) {
      try {
        const media = useMediaStore.getState();
        if (!media.photos.some(p => p.uri === item.content)) {
          media.addPhoto(item.content, filename.replace(/\.[a-z0-9]+$/i, ''));
        }
      } catch {
        /* sin espacio en Fotos, no bloquea la descarga */
      }
    }
    notificationService.push('file-manager', 'Descarga completa', `${filename}`);
    return item;
  } catch (e) {
    notificationService.push('browser', 'Descarga fallida', e instanceof Error ? e.message : 'Error');
    return null;
  }
}

// Descarga una URL y la guarda en Downloads. Web: intenta fetch directo y cae a
// /proxy si hace falta. Nativo: fetch del proceso principal (sin CORS) con base64.
export async function saveUrlToStore(url: string): Promise<StorageItem | null> {
  try {
    const filename = fileNameFromUrl(url);
    if (isNative()) {
      const res = await nativeBinaryRequest(url);
      if (!res.ok || !res.dataUrl) {
        throw new Error(res.text ? `HTTP ${res.text}` : 'Error de red');
      }
      return saveDownloadPayload(filename, res.mimeType ?? 'application/octet-stream', res.dataUrl);
    }
    const dataUrl = await fetchAsDataUrl(url);
    return saveDownloadPayload(filename, mimeFromDataUrl(dataUrl), dataUrl);
  } catch {
    // Sin proxy (hosting estático) ni CORS: al menos abrimos la página para que
    // la persona guarde el archivo manualmente.
    openExternal(url);
    notificationService.push('browser', 'Descarga no disponible', 'Se abrió la página de la descarga en una pestaña');
    return null;
  }
}

// Recibe las descargas reales de los webviews (will-download en el proceso principal).
if (isNative()) {
  onNativeDownload(({ filename, mimeType, dataUrl }) => {
    saveDownloadPayload(filename, mimeType, dataUrl);
  });
  // "Guardar imagen" del menú contextual de los webviews.
  onNativeDownloadImage((url) => {
    saveUrlToStore(url);
  });
}