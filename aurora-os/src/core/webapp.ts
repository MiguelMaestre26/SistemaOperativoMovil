import { isNative } from './native';
import { openInOs } from './browserSession';
import { useAppStore } from '../stores/useAppStore';

export function openExternal(url: string): void {
  if (isNative()) {
    openInOs(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

// En el modo escritorio abre las apps reales de WhatsApp/Telegram que están dentro
// del OS (sus webviews); en la web se abre la versión web dentro del navegador del OS.
export function launchMessenger(appId: 'whatsapp' | 'telegram'): void {
  if (isNative()) {
    useAppStore.getState().openApp(appId);
    return;
  }
  openInOs(appId === 'whatsapp' ? WA_WEB : TG_WEB);
}

export function waLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function tgChat(number: string): string {
  const digits = number.replace(/\D/g, '');
  return digits ? `https://t.me/+${digits}` : TG_WEB;
}

export const TG_WEB = 'https://web.telegram.org/a/';
export const WA_WEB = 'https://web.whatsapp.com/';