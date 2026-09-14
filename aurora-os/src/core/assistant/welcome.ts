import { useSystemStore } from '../../stores/useSystemStore';
import greetingAudio from '../../assets/audio/chocolate-greeting.wav';
import introAudio from '../../assets/audio/chocolate-intro.wav';

export const WELCOME_AUDIO = {
  greeting: greetingAudio,
  intro: introAudio,
} as const;

const WELCOME_SEEN_KEY = 'auroraos:chocolate:welcome-seen';

function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function welcomeSeen(): boolean {
  return hasSeenWelcome();
}

function markWelcomeSeen(): void {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
  } catch {
    /* storage no disponible */
  }
}

let currentAudio: HTMLAudioElement | null = null;
let sequenceToken = 0;
let currentResolve: ((played: boolean) => void) | null = null;

function systemVolume(): number {
  return Math.max(0.05, useSystemStore.getState().volume / 100);
}

function stopCurrent(): void {
  sequenceToken++;
  currentResolve?.(false);
  currentResolve = null;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
}

function playFile(src: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const audio = new Audio(src);
    currentAudio = audio;
    currentResolve = resolve;
    audio.volume = systemVolume();
    const done = (played: boolean) => {
      if (currentAudio === audio) {
        currentAudio = null;
        currentResolve = null;
      }
      resolve(played);
    };
    audio.onended = () => done(true);
    audio.onerror = () => done(false);
    void audio.play().catch(() => done(false));
  });
}

export function playWelcomeSequence(): void {
  stopCurrent();
  const token = sequenceToken;
  void (async () => {
    const greetingPlayed = await playFile(WELCOME_AUDIO.greeting);
    if (token !== sequenceToken) return;
    if (hasSeenWelcome()) return;
    // Si el audio fue bloqueado (p. ej. política de autoplay) no marcar como visto:
    // se reintenta en el siguiente uso en lugar de perder la explicación para siempre.
    if (!greetingPlayed) return;
    const introPlayed = await playFile(WELCOME_AUDIO.intro);
    if (token !== sequenceToken) return;
    if (introPlayed) markWelcomeSeen();
  })();
}

export function playExplanation(): void {
  stopCurrent();
  void (async () => {
    await playFile(WELCOME_AUDIO.intro);
  })();
}

export function stopWelcomeSequence(): void {
  stopCurrent();
}