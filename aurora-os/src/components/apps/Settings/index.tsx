import React from 'react';
import { Wifi, Bluetooth, Moon, Bell, Sun, Volume2, Smartphone, Info, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import { useSystemStore } from '../../../stores/useSystemStore';
import { useMediaStore, isColorUri } from '../../../stores/useMediaStore';
import { playBlip } from '../../../core/audio';

const Toggle: React.FC<{ enabled: boolean; onChange: (val: boolean) => void }> = ({ enabled, onChange }) => (
  <div
    onClick={() => onChange(!enabled)}
    style={{
      width: 51,
      height: 31,
      borderRadius: 16,
      background: enabled ? '#34C759' : '#E5E5EA',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.3s',
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 27,
        height: 27,
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: 2,
        left: enabled ? 22 : 2,
        transition: 'left 0.3s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    />
  </div>
);

const Slider: React.FC<{ value: number; onChange: (val: number) => void; icon: React.ReactNode; min?: number; max?: number }> = ({
  value,
  onChange,
  icon,
  min = 0,
  max = 100,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 220 }}>
    <span style={{ color: '#8E8E93', flexShrink: 0 }}>{icon}</span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        accentColor: '#007AFF',
        height: 4,
        cursor: 'pointer',
      }}
    />
    <span style={{ fontSize: 13, color: '#8E8E93', minWidth: 28, textAlign: 'right' }}>{value}%</span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 13, color: '#8E8E93', textTransform: 'uppercase', padding: '8px 16px 4px', letterSpacing: 0.5 }}>
    {children}
  </div>
);

const Settings: React.FC = () => {
  const {
    isAirplaneMode,
    isWifiOn,
    isBluetoothOn,
    brightness,
    volume,
    isDarkMode,
    isDoNotDisturb,
    isFocusMode,
    totalStorage,
    usedStorage,
    totalMemory,
    usedMemory,
    wallpaper,
    setAirplaneMode,
    setWifi,
    setBluetooth,
    setBrightness,
    setVolume,
    setDarkMode,
    setDoNotDisturb,
    setFocusMode,
    setWallpaper,
  } = useSystemStore();

  const photos = useMediaStore(s => s.photos);

  const onWifi = (v: boolean) => {
    if (isAirplaneMode) return;
    setWifi(v);
  };
  const onBluetooth = (v: boolean) => {
    if (isAirplaneMode) return;
    setBluetooth(v);
  };
  const onVolume = (v: number) => {
    setVolume(v);
    playBlip(v / 100);
  };

  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: wallpaper ? `url(${wallpaper})` : '#F2F2F7',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'auto',
  };

  const sectionStyle: React.CSSProperties = {
    background: wallpaper ? 'rgba(255,255,255,0.94)' : '#fff',
    borderRadius: 10,
    margin: '0 16px 20px',
    overflow: 'hidden',
    minHeight: 200,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '0.5px solid #C6C6C8',
    minHeight: 44,
  };

  const lastRowStyle: React.CSSProperties = {
    ...rowStyle,
    borderBottom: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 17,
    color: '#1C1C1E',
  };

  const iconContainerStyle = (bg: string): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: 7,
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  });

  const formatKB = (kb: number) => {
    const gb = kb / (1024);
    return `${gb.toFixed(1)} GB`;
  };

  const storagePercent = totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0;
  const memoryPercent = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;

  return (
    <div style={containerStyle}>
      <div style={{ padding: '16px 16px 8px', fontSize: 34, fontWeight: 700, color: '#1C1C1E' }}>
        Settings
      </div>

<SectionTitle>Connectivity</SectionTitle>
      <div style={sectionStyle}>
        <div style={rowStyle}>
          <div style={labelStyle}>
            <div style={iconContainerStyle('#FF9500')}>
              <Smartphone size={16} />
            </div>
            Airplane Mode
          </div>
          <Toggle enabled={isAirplaneMode} onChange={setAirplaneMode} />
        </div>
        <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={labelStyle}>
              <div style={iconContainerStyle('#007AFF')}>
                <Wifi size={16} />
              </div>
              Wi-Fi
            </div>
            <Toggle enabled={isWifiOn} onChange={onWifi} />
          </div>
          <div style={{ fontSize: 13, color: '#8E8E93', paddingLeft: 42 }}>
            {isWifiOn ? 'Conectado a Aurora-5G' : 'Apagado'}
          </div>
        </div>
        <div style={{ ...lastRowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={labelStyle}>
              <div style={iconContainerStyle('#007AFF')}>
                <Bluetooth size={16} />
              </div>
              Bluetooth
            </div>
            <Toggle enabled={isBluetoothOn} onChange={onBluetooth} />
          </div>
          <div style={{ fontSize: 13, color: '#8E8E93', paddingLeft: 42 }}>
            {isBluetoothOn ? '2 dispositivos conectados' : 'Apagado'}
          </div>
        </div>
      </div>

      <SectionTitle>Display & Sound</SectionTitle>
      <div style={sectionStyle}>
        <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={labelStyle}>
            <div style={iconContainerStyle('#FFCC00')}>
              <Sun size={16} />
            </div>
            Brightness
          </div>
          <Slider value={brightness} onChange={setBrightness} icon={<Sun size={14} color="#FFCC00" />} />
        </div>
        <div style={{ ...lastRowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={labelStyle}>
            <div style={iconContainerStyle('#5856D6')}>
              <Volume2 size={16} />
            </div>
            Volume
          </div>
          <Slider value={volume} onChange={onVolume} icon={<Volume2 size={14} color="#5856D6" />} />
        </div>
      </div>

      <SectionTitle>Modes</SectionTitle>
      <div style={sectionStyle}>
        <div style={rowStyle}>
          <div style={labelStyle}>
            <div style={iconContainerStyle('#5856D6')}>
              <Moon size={16} />
            </div>
            Dark Mode
          </div>
          <Toggle enabled={isDarkMode} onChange={setDarkMode} />
        </div>
        <div style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={rowStyle}>
            <div style={labelStyle}>
              <div style={iconContainerStyle('#FF2D55')}>
                <Bell size={16} />
              </div>
              Do Not Disturb
            </div>
            <Toggle enabled={isDoNotDisturb} onChange={setDoNotDisturb} />
          </div>
          {isDoNotDisturb && (
            <div style={{ padding: '6px 16px 10px', fontSize: 13, color: '#8E8E93', borderTop: '0.5px solid #C6C6C8' }}>
              Las notificaciones se silencian y se guardan en el Centro de Notificaciones.
            </div>
          )}
        </div>
        <div style={{ ...lastRowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={labelStyle}>
              <div style={iconContainerStyle('#30B0C7')}>
                <Moon size={16} />
              </div>
              Focus Mode
            </div>
            <Toggle enabled={isFocusMode} onChange={setFocusMode} />
          </div>
          {isFocusMode && (
            <div style={{ padding: '6px 16px 10px', fontSize: 13, color: '#8E8E93', borderTop: '0.5px solid #C6C6C8' }}>
              Se reducen notificaciones y distractions mientras el modo está activo.
            </div>
          )}
        </div>
      </div>

      <SectionTitle>Wallpaper</SectionTitle>
      <div style={sectionStyle}>
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={labelStyle}>
              <div style={iconContainerStyle('#5856D6')}>
                <ImageIcon size={16} />
              </div>
              Fondo de pantalla
            </span>
            <button
              onClick={() => setWallpaper('')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, border: 'none',
                background: wallpaper ? 'rgba(255,59,48,0.12)' : 'rgba(0,0,0,0.06)',
                color: wallpaper ? '#FF3B30' : '#8E8E93', borderRadius: 12,
                padding: '7px 12px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Trash2 size={14} /> Quitar fondo
            </button>
          </div>

          <div
            style={{
              height: 90,
              borderRadius: 10,
              marginTop: 10,
              backgroundImage: wallpaper ? `url(${wallpaper})` : 'linear-gradient(135deg, #7C6FF0 0%, #A78BFA 50%, #60A5FA 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', bottom: 6, left: 10, color: '#fff', fontSize: 11, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              {wallpaper ? 'Fondo personalizado' : 'Fondo Aurora (predeterminado)'}
            </div>
          </div>

          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {photos.map(p => {
                const selected = wallpaper === p.uri;
                return (
                  <button
                    key={p.id}
                    onClick={() => setWallpaper(p.uri)}
                    title={p.caption}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 8,
                      border: selected ? '2px solid #007AFF' : '2px solid transparent',
                      padding: 0,
                      cursor: 'pointer',
                      background: isColorUri(p.uri) ? p.uri : '#E5E5EA',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {!isColorUri(p.uri) && (
                      <img src={p.uri} alt={p.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {selected && (
                      <span style={{
                        position: 'absolute', bottom: 2, right: 2, width: 18, height: 18,
                        borderRadius: 9, background: '#007AFF', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                      }}>
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {photos.length === 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#8E8E93' }}>
              No hay imágenes. Descarga una o captura una foto con la Cámara.
            </div>
          )}
        </div>
      </div>

      <SectionTitle>About</SectionTitle>
      <div style={sectionStyle}>
        <div style={rowStyle}>
          <div style={labelStyle}>
            <div style={iconContainerStyle('#8E8E93')}>
              <Info size={16} />
            </div>
            Device Name
          </div>
          <span style={{ color: '#8E8E93', fontSize: 17 }}>AuroraOS</span>
        </div>
        <div style={rowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#1C1C1E', fontSize: 15 }}>Storage</span>
              <span style={{ color: '#8E8E93', fontSize: 15 }}>
                {formatKB(usedStorage)} / {formatKB(totalStorage)}
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#E5E5EA', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${storagePercent}%`, height: '100%', background: '#007AFF', borderRadius: 3 }} />
            </div>
          </div>
        </div>
        <div style={lastRowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#1C1C1E', fontSize: 15 }}>Memory</span>
              <span style={{ color: '#8E8E93', fontSize: 15 }}>
                {formatKB(usedMemory)} / {formatKB(totalMemory)}
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#E5E5EA', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${memoryPercent}%`, height: '100%', background: '#34C759', borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
};

export default Settings;
