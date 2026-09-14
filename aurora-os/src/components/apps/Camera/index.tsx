import { useRef, useState, useEffect, useCallback } from 'react';
import { Zap, ZapOff, RefreshCw, Aperture } from 'lucide-react';
import { useMediaStore } from '../../../stores/useMediaStore';

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = useState(false);
  const [noCamera, setNoCamera] = useState(false);
  const [flashFx, setFlashFx] = useState(false);
  const photos = useMediaStore(s => s.photos);
  const addPhoto = useMediaStore(s => s.addPhoto);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setNoCamera(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setNoCamera(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }
    } catch {
      setNoCamera(true);
    }
  }, [facing, stopStream]);

  useEffect(() => {
    void startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    setFlashFx(true);
    setTimeout(() => setFlashFx(false), 220);

    if (!canvas) return;
    if (video && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const uri = canvas.toDataURL('image/jpeg', 0.85);
      const label = new Date().toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      addPhoto(uri, `Foto ${label}`);
    } else {
      canvas.width = 360;
      canvas.height = 460;
      const ctx = canvas.getContext('2d')!;
      const hue = (Date.now() / 30) % 360;
      const g = ctx.createLinearGradient(0, 0, 360, 460);
      g.addColorStop(0, `hsl(${hue}, 65%, 55%)`);
      g.addColorStop(1, `hsl(${(hue + 50) % 360}, 70%, 32%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 360, 460);
      addPhoto(canvas.toDataURL('image/jpeg', 0.85), 'Foto simulada');
    }
  };

  const switchCamera = () => {
    setFacing(f => (f === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div style={styles.container}>
      <div style={styles.viewfinder}>
        {noCamera ? (
          <div style={styles.simView}>
            <Aperture size={64} color="rgba(255,255,255,0.5)" />
            <div style={styles.simLabel}>Vista previa simulada (cámara no disponible)</div>
          </div>
        ) : (
          <video ref={videoRef} playsInline muted style={styles.video} />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {flashFx && <div style={styles.flashFx} />}

        <div style={styles.topBar}>
          <button className="pressable" style={styles.iconBtn} onClick={() => setFlash(v => !v)} aria-label="Flash">
            {flash ? <Zap size={20} color="#FFD700" /> : <ZapOff size={20} color="#fff" />}
          </button>
          <button className="pressable" style={styles.iconBtn} onClick={switchCamera} aria-label="Cambiar cámara">
            <RefreshCw size={20} color="#fff" />
          </button>
        </div>
      </div>

      <div style={styles.controls}>
        <button className="pressable" style={styles.shutter} onClick={capture} aria-label="Capturar" />
      </div>

      {photos.length > 0 && (
        <div style={styles.filmstrip}>
          {photos.slice(0, 8).map(p => (
            <img
              key={p.id}
              src={p.uri}
              alt={p.caption}
              className="no-invert"
              style={{
                ...styles.thumb,
                background: /^#/.test(p.uri) ? p.uri : undefined,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#000',
  },
  viewfinder: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    background: '#111',
    margin: 0,
  },
  video: { width: '100%', height: '100%', objectFit: 'cover' as const },
  simView: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'radial-gradient(circle at 50% 40%, #2a3a55 0%, #0d1626 70%)',
  },
  simLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, padding: '0 24px', textAlign: 'center' },
  flashFx: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.9)',
    transition: 'opacity 0.2s',
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 16px',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: 'rgba(0,0,0,0.4)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 0 10px',
    background: '#000',
  },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    border: '4px solid #fff',
    background: 'rgba(255,255,255,0.25)',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  filmstrip: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    padding: '0 12px 14px',
    background: '#000',
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
};