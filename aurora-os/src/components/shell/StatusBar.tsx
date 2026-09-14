import { useSystemStore } from '../../stores/useSystemStore';
import { notificationService } from '../../core/NotificationService';
import {
  Wifi, WifiOff, Bluetooth, BatteryCharging,
  Signal, BellOff, Moon, Plane,
} from 'lucide-react';

export default function StatusBar() {
  const { batteryLevel, isCharging, isWifiOn, isBluetoothOn, isDoNotDisturb, isFocusMode, isAirplaneMode, currentTime } = useSystemStore();
  const unreadCount = notificationService.getUnreadCount();
  const timeStr = currentTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const color = batteryLevel > 60 ? 'var(--text-primary)' : batteryLevel > 20 ? 'var(--warning)' : 'var(--danger)';
  const fillColor = batteryLevel > 60 ? 'var(--text-primary)' : batteryLevel > 20 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <span style={styles.time}>{timeStr}</span>
      </div>

      <div style={styles.right}>
        {isFocusMode && <Moon size={11} color="var(--accent)" />}
        {isDoNotDisturb && <BellOff size={11} color="var(--warning)" />}
        {isAirplaneMode && <Plane size={11} color="var(--warning)" />}
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
        {isWifiOn ? (
          <Wifi size={13} color="var(--text-primary)" />
        ) : (
          <WifiOff size={13} color="var(--text-tertiary)" />
        )}
        <Signal size={13} color={isWifiOn ? 'var(--text-primary)' : 'var(--text-tertiary)'} />
        {isBluetoothOn && <Bluetooth size={11} color="var(--text-primary)" />}

        <div style={styles.batteryPill}>
          {isCharging ? (
            <BatteryCharging size={13} color="var(--success)" />
          ) : (
            <div style={styles.pillOuter}>
              <div style={{ ...styles.pillFill, width: `${batteryLevel}%`, background: fillColor }} />
            </div>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color }}>
            {Math.round(batteryLevel)}%
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: '0 24px 6px',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  left: { display: 'flex', alignItems: 'center', gap: 6 },
  time: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 0.2 },
  right: { display: 'flex', alignItems: 'center', gap: 5 },
  badge: {
    background: 'var(--danger)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: '1px 5px',
    minWidth: 16,
    textAlign: 'center' as const,
  },
  batteryPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  pillOuter: {
    width: 24,
    height: 11,
    borderRadius: 4,
    border: '1.5px solid var(--text-primary)',
    padding: 1.5,
    overflow: 'hidden',
    display: 'flex',
  },
  pillFill: {
    height: '100%',
    borderRadius: 1.5,
  },
};