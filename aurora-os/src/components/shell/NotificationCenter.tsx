import { useState, useEffect } from 'react';
import { notificationService } from '../../core/NotificationService';
import type { SystemNotification } from '../../core/NotificationService';
import { useSystemStore } from '../../stores/useSystemStore';
import { motion } from 'framer-motion';
import { X, Bell, Trash2 } from 'lucide-react';

interface NotificationCenterProps {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const { brightness, setBrightness, isWifiOn, setWifi, isBluetoothOn, setBluetooth, isDoNotDisturb, setDoNotDisturb } = useSystemStore();

  useEffect(() => {
    setNotifications(notificationService.getAll());
  }, []);

  const dismiss = (id: string) => {
    notificationService.dismiss(id);
    setNotifications(notificationService.getAll());
  };

  const clearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
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
            { label: 'Wi-Fi', value: isWifiOn, toggle: () => setWifi(!isWifiOn), color: isWifiOn ? 'var(--accent)' : 'var(--bg-tertiary)' },
            { label: 'Bluetooth', value: isBluetoothOn, toggle: () => setBluetooth(!isBluetoothOn), color: isBluetoothOn ? 'var(--accent)' : 'var(--bg-tertiary)' },
            { label: 'DND', value: isDoNotDisturb, toggle: () => setDoNotDisturb(!isDoNotDisturb), color: isDoNotDisturb ? 'var(--warning)' : 'var(--bg-tertiary)' },
          ].map(t => (
            <button key={t.label} onClick={t.toggle} style={{
              ...styles.toggleBtn,
              background: t.color,
            }}>
              <div style={{ fontSize: 11, color: t.value ? '#fff' : 'var(--text-primary)', fontWeight: 500 }}>
                {t.label}
              </div>
            </button>
          ))}
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
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 9600,
    display: 'flex',
    flexDirection: 'column',
  },
  panel: {
    marginTop: 50,
    margin: '50px 8px 0',
    maxHeight: 'calc(100vh - 100px)',
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
    borderRadius: 16,
    background: 'var(--glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
  },
  toggleBtn: {
    border: 'none',
    borderRadius: 12,
    padding: '12px 8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  brightnessSection: {
    padding: 14,
    borderRadius: 16,
    background: 'var(--glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
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
    accentColor: 'var(--accent)',
    height: 4,
  },
  notifSection: {
    padding: 14,
    borderRadius: 16,
    background: 'var(--glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
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
    background: 'var(--bg-tertiary)',
    borderRadius: 10,
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
