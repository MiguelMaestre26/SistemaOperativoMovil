import { useSystemStore } from '../../stores/useSystemStore';
import { notificationService } from '../../core/NotificationService';
import {
  Wifi, WifiOff, Bluetooth, Battery, BatteryCharging,
  Signal, BellOff, Moon, Plane
} from 'lucide-react';

export default function StatusBar() {
  const { batteryLevel, isCharging, isWifiOn, isBluetoothOn, isDoNotDisturb, isFocusMode, isAirplaneMode, currentTime } = useSystemStore();
  const unreadCount = notificationService.getUnreadCount();

  const timeStr = currentTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <span style={styles.time}>{timeStr}</span>
      </div>

      <div style={styles.right}>
        {isFocusMode && <Moon size={11} color="var(--accent)" />}
        {isDoNotDisturb && <BellOff size={11} color="var(--warning)" />}
        {isAirplaneMode && <Plane size={11} color="var(--warning)" />}

        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}

        {isWifiOn ? (
          <Wifi size={13} color="var(--text-primary)" />
        ) : (
          <WifiOff size={13} color="var(--text-tertiary)" />
        )}

        <Signal size={13} color={isWifiOn ? 'var(--text-primary)' : 'var(--text-tertiary)'} />

        {isBluetoothOn && <Bluetooth size={11} color="var(--text-primary)" />}

        <div style={styles.batteryGroup}>
          {isCharging ? (
            <BatteryCharging size={16} color="var(--success)" />
          ) : (
            <Battery size={16} color={
              batteryLevel > 60 ? 'var(--text-primary)' :
              batteryLevel > 20 ? 'var(--warning)' : 'var(--danger)'
            } />
          )}
          <span style={{
            ...styles.batteryText,
            color: batteryLevel > 20 ? 'var(--text-primary)' : 'var(--danger)',
          }}>
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
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: 0.2,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
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
  batteryGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: 500,
  },
};
