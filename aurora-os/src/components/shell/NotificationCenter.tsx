import { useState, useEffect } from 'react';
import { notificationService } from '../../core/NotificationService';
import type { SystemNotification } from '../../core/NotificationService';
import { screenCaptureService, saveRecordingToGallery } from '../../core/ScreenCapture';
import { useSystemStore } from '../../stores/useSystemStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { motion } from 'framer-motion';
import { X, Bell, Trash2, Camera, Video, Square } from 'lucide-react';
import { toast } from '../ui/Toast';

interface NotificationCenterProps {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => notificationService.getAll());
  const [recording, setRecording] = useState(false);
  const addPhoto = useMediaStore(s => s.addPhoto);
  const { brightness, setBrightness, isWifiOn, setWifi, isBluetoothOn, setBluetooth, isDoNotDisturb, setDoNotDisturb } = useSystemStore();

  useEffect(() => {
    return screenCaptureService.subscribe(setRecording);
  }, []);

  const dismiss = (id: string) => {
    notificationService.dismiss(id);
    setNotifications(notificationService.getAll());
  };

  const clearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
  };

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleScreenshot = async () => {
    onClose();
    await wait(260);
    try {
      const uri = await screenCaptureService.takeScreenshot();
      const label = new Date().toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      addPhoto(uri, `Captura ${label}`);
      toast('Captura guardada en Fotos');
      notificationService.push('gallery', 'Captura de pantalla', 'Disponible en la app Fotos.');
    } catch {
      toast('No se pudo tomar la captura');
    }
  };

  const handleRecord = async () => {
    if (recording) {
      const result = await screenCaptureService.stopRecording();
      if (result) saveRecordingToGallery(result);
      return;
    }
    await screenCaptureService.startRecording();
    onClose();
    toast('Grabación de pantalla iniciada · toca REC para detener');
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <motion.div
        initial={{ y: -300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={styles.panel}
      >
        {/* Quick toggles */}
        <div style={styles.togglesGrid}>
          {[
            { label: 'Wi-Fi', value: isWifiOn, toggle: () => setWifi(!isWifiOn), color: isWifiOn ? 'var(--primary)' : 'var(--surface-container-highest)', text: isWifiOn ? 'var(--on-primary)' : 'var(--on-surface-variant)' },
            { label: 'Bluetooth', value: isBluetoothOn, toggle: () => setBluetooth(!isBluetoothOn), color: isBluetoothOn ? 'var(--primary)' : 'var(--surface-container-highest)', text: isBluetoothOn ? 'var(--on-primary)' : 'var(--on-surface-variant)' },
            { label: 'DND', value: isDoNotDisturb, toggle: () => setDoNotDisturb(!isDoNotDisturb), color: isDoNotDisturb ? 'var(--error)' : 'var(--surface-container-highest)', text: isDoNotDisturb ? 'var(--on-error)' : 'var(--on-surface-variant)' },
          ].map(t => (
            <button key={t.label} onClick={t.toggle} style={{
              ...styles.toggleBtn,
              background: t.color,
            }}>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 600 }}>
                {t.label}
              </div>
            </button>
          ))}
        </div>

        {/* Captura de pantalla */}
        <div style={styles.captureSection}>
          <button onClick={handleScreenshot} style={styles.captureBtn}>
            <span style={styles.captureIcon}>
              <Camera size={18} color="var(--on-primary)" />
            </span>
            <span style={styles.captureLabel}>Screenshot</span>
          </button>
          <button
            onClick={handleRecord}
            style={{
              ...styles.captureBtn,
              background: recording ? 'var(--error)' : 'var(--surface-container-highest)',
            }}
          >
            <span style={recording ? styles.captureIconActive : styles.captureIcon}>
              {recording ? <Square size={16} color="#fff" fill="#fff" /> : <Video size={18} color={recording ? '#fff' : 'var(--on-primary)'} />}
            </span>
            <span style={{ ...styles.captureLabel, color: recording ? '#fff' : 'var(--text-primary)' }}>
              {recording ? 'Detener' : 'Grabar'}
            </span>
          </button>
        </div>

        {/* Brightness */}
        <div style={styles.brightnessSection}>
          <div style={styles.brightnessHeader}>
            <span style={styles.brightnessLabel}>Brightness</span>
            <span style={styles.brightnessValue}>{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={e => setBrightness(Number(e.target.value))}
            style={styles.slider}
          />
        </div>

        {/* Notifications */}
        <div style={styles.notifSection}>
          <div style={styles.notifHeader}>
            <span style={styles.notifTitle}>Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clearAll} style={styles.clearBtn}>
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={styles.notifEmpty}>
              <Bell size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>No notifications</div>
            </div>
          ) : (
            <div style={styles.notifList}>
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={styles.notifItem}
                >
                  <div>
                    <div style={styles.notifItemTitle}>{n.title}</div>
                    <div style={styles.notifItemBody}>{n.body}</div>
                  </div>
                  <button onClick={() => dismiss(n.id)} style={styles.notifDismiss}>
                    <X size={14} color="var(--text-tertiary)" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 9600,
    borderRadius: 46,
    display: 'flex',
    flexDirection: 'column',
  },
  panel: {
    marginTop: 50,
    margin: '50px 8px 0',
    maxHeight: 'calc(100% - 100px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  togglesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    padding: 16,
    borderRadius: 24,
    background: 'var(--surface-container-high)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--outline-variant)',
  },
  toggleBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '13px 8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  brightnessSection: {
    padding: 14,
    borderRadius: 24,
    background: 'var(--surface-container-high)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--outline-variant)',
  },
  captureSection: {
    padding: 12,
    borderRadius: 24,
    background: 'var(--surface-container-high)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--outline-variant)',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  captureBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    borderRadius: 16,
    padding: '14px 8px',
    cursor: 'pointer',
    background: 'var(--surface-container-highest)',
  },
  captureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--primary)',
  },
  captureIconActive: {
    width: 34,
    height: 34,
    borderRadius: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--error)',
  },
  captureLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  brightnessHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brightnessLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  brightnessValue: {
    fontSize: 13,
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  slider: {
    width: '100%',
    accentColor: 'var(--primary)',
    height: 4,
  },
  notifSection: {
    padding: 14,
    borderRadius: 24,
    background: 'var(--surface-container)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--outline-variant)',
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  notifEmpty: {
    textAlign: 'center' as const,
    padding: '20px 0',
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  notifList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  notifItem: {
    background: 'var(--surface-container-high)',
    borderRadius: 14,
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  notifItemBody: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
  notifDismiss: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
  },
};
