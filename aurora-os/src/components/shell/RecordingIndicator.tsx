import { useEffect, useState } from 'react';
import { Square } from 'lucide-react';
import { screenCaptureService, saveRecordingToGallery } from '../../core/ScreenCapture';

export default function RecordingIndicator() {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    return screenCaptureService.subscribe(rec => {
      setRecording(rec);
      setSecs(0);
    });
  }, []);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const stop = async () => {
    const result = await screenCaptureService.stopRecording();
    if (result) saveRecordingToGallery(result);
  };

  if (!recording) return null;

  return (
    <div data-rec-indicator style={styles.wrap}>
      <button onClick={stop} style={styles.badge} aria-label="Detener grabación">
        <Square size={10} color="#fff" fill="#fff" />
        <span style={styles.txt}>REC {secs}s</span>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 9000,
    pointerEvents: 'none',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#FF3B30',
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    pointerEvents: 'auto',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(255,59,48,0.5)',
  },
  txt: { letterSpacing: 0.5 },
};