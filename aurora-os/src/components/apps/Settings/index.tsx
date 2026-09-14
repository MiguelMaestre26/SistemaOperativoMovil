import React from 'react';
import {
  Wifi, Bluetooth, Moon, Bell, Sun, Volume2, Smartphone, Info,
  Image as ImageIcon, Trash2, Check, Plane, Focus, KeyRound,
} from 'lucide-react';
import { useSystemStore } from '../../../stores/useSystemStore';
import { useMediaStore, isColorUri } from '../../../stores/useMediaStore';
import { playBlip } from '../../../core/audio';
import {
  ALL_FITS, FIT_LABELS, ALL_POSITIONS, POSITION_LABELS,
  backgroundSizeFor, backgroundPositionFor,
} from '../../../core/wallpaper';
import type { WallpaperFit, WallpaperPosition } from '../../../types';
import {
  Screen, AppHeader, ListSection, ListGroup, ListRow, Toggle, Slider, ProgressBar, IconButton, SegmentedControl,
} from '../../ui';
import ChangePinDialog from './ChangePinDialog';

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
    wallpaperFit,
    wallpaperPosition,
    setAirplaneMode,
    setWifi,
    setBluetooth,
    setBrightness,
    setVolume,
    setDarkMode,
    setDoNotDisturb,
    setFocusMode,
    setWallpaper,
    setWallpaperFit,
    setWallpaperPosition,
    accent,
    setAccent,
  } = useSystemStore();

  const photos = useMediaStore(s => s.photos);
  const [showPinDialog, setShowPinDialog] = React.useState(false);

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

  const formatGB = (kb: number) => `${(kb / 1024).toFixed(1)} GB`;
  const storagePercent = totalStorage > 0 ? usedStorage / totalStorage : 0;
  const memoryPercent = totalMemory > 0 ? usedMemory / totalMemory : 0;

  const iconTile = (bg: string, node: React.ReactNode) => (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {node}
    </div>
  );

const ACCENTS = [
  { id: 'blue', label: 'Azul', color: '#0061A4' },
  { id: 'purple', label: 'Púrpura', color: '#6750A4' },
  { id: 'green', label: 'Verde', color: '#006A62' },
  { id: 'orange', label: 'Naranja', color: '#8F4C00' },
  { id: 'pink', label: 'Rosa', color: '#9A3350' },
  { id: 'teal', label: 'Turquesa', color: '#00696E' },
];

const positionAlign: Record<WallpaperPosition, { align: React.CSSProperties['alignItems']; justify: React.CSSProperties['justifyContent'] }> = {
  'top-left': { align: 'flex-start', justify: 'flex-start' },
  top: { align: 'flex-start', justify: 'center' },
  'top-right': { align: 'flex-start', justify: 'flex-end' },
  left: { align: 'center', justify: 'flex-start' },
  center: { align: 'center', justify: 'center' },
  right: { align: 'center', justify: 'flex-end' },
  'bottom-left': { align: 'flex-end', justify: 'flex-start' },
  bottom: { align: 'flex-end', justify: 'center' },
  'bottom-right': { align: 'flex-end', justify: 'flex-end' },
};

  const toggle = (checked: boolean, onChange: (v: boolean) => void) => (
    <Toggle checked={checked} onChange={onChange} />
  );

  const sliderCell = (
    label: string,
    bg: string,
    node: React.ReactNode,
    slider: React.ReactNode,
  ) => (
    <div
      className="cell-row"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '10px 16px',
        background: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {iconTile(bg, node)}
        <span style={{ fontSize: 17, color: 'var(--text-primary)' }}>{label}</span>
      </div>
      <div style={{ paddingLeft: 42 }}>{slider}</div>
      <div className="cell-sep" style={{ marginLeft: 58 }} />
    </div>
  );

  return (
    <Screen>
      <AppHeader
        title="Ajustes"
        right={
          <IconButton
            label="Restablecer fondo"
            bg={wallpaper ? 'rgba(255,59,48,0.14)' : 'var(--bg-tertiary)'}
            onClick={() => setWallpaper('')}
          >
            <Trash2 size={16} color={wallpaper ? 'var(--danger)' : 'var(--text-secondary)'} />
          </IconButton>
        }
      />

      <ListSection title="Conectividad">
        <ListRow
          icon={iconTile('#FF9500', <Plane size={15} color="#fff" />)}
          label="Modo avión"
          value={toggle(isAirplaneMode, setAirplaneMode)}
        />
        <ListRow
          icon={iconTile('#007AFF', <Wifi size={15} color="#fff" />)}
          label="Wi-Fi"
          sublabel={isWifiOn ? 'Conectado a Aurora-5G' : 'Apagado'}
          value={toggle(isWifiOn, onWifi)}
        />
        <ListRow
          icon={iconTile('#007AFF', <Bluetooth size={15} color="#fff" />)}
          label="Bluetooth"
          sublabel={isBluetoothOn ? '2 dispositivos conectados' : 'Apagado'}
          value={toggle(isBluetoothOn, onBluetooth)}
        />
      </ListSection>

      <ListSection title="Pantalla y sonido">
        <ListGroup>
          {sliderCell(
            'Brillo',
            '#FFCC00',
            <Sun size={15} color="#fff" />,
            <Slider value={brightness} onChange={setBrightness} />,
          )}
          {sliderCell(
            'Volumen',
            '#5856D6',
            <Volume2 size={15} color="#fff" />,
            <Slider value={volume} onChange={onVolume} />,
          )}
        </ListGroup>
      </ListSection>

      <ListSection title="Modos">
        <ListRow
          icon={iconTile('#5856D6', <Moon size={15} color="#fff" />)}
          label="Modo oscuro"
          sublabel={isDarkMode ? 'Activado' : 'Desactivado'}
          value={toggle(isDarkMode, setDarkMode)}
        />
        <ListRow
          icon={iconTile('#FF2D55', <Bell size={15} color="#fff" />)}
          label="No molestar"
          sublabel={isDoNotDisturb ? 'Activo' : undefined}
          value={toggle(isDoNotDisturb, setDoNotDisturb)}
        />
        <ListRow
          icon={iconTile('#30B0C7', <Focus size={15} color="#fff" />)}
          label="Modo enfoque"
          sublabel={isFocusMode ? 'Activo' : undefined}
          value={toggle(isFocusMode, setFocusMode)}
        />
      </ListSection>

      <ListSection title="Fondo de pantalla">
        <ListGroup>
          <div
            className="cell-row"
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, background: 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {iconTile('#5856D6', <ImageIcon size={15} color="#fff" />)}
                <span style={{ fontSize: 17, color: 'var(--text-primary)' }}>Fondo de pantalla</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {wallpaper ? 'Personalizado' : 'Aurora'}
              </span>
            </div>

            <div
              style={{
                height: 90,
                borderRadius: 12,
                backgroundImage: wallpaper
                  ? `url(${wallpaper})`
                  : 'linear-gradient(135deg, #7C6FF0 0%, #A78BFA 50%, #60A5FA 100%)',
                backgroundSize: wallpaper ? backgroundSizeFor(wallpaperFit) : 'cover',
                backgroundPosition: wallpaper ? backgroundPositionFor(wallpaperPosition) : 'center',
                overflow: 'hidden',
                position: 'relative' as const,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 10,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {wallpaper ? 'Fondo personalizado' : 'Fondo Aurora (predeterminado)'}
              </div>
            </div>

            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {photos.map(p => {
                  const selected = wallpaper === p.uri;
                  return (
                    <button
                      key={p.id}
                      className="pressable"
                      onClick={() => setWallpaper(p.uri)}
                      aria-label={p.caption}
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: 10,
                        border: selected ? '2px solid var(--accent)' : '2px solid transparent',
                        padding: 0,
                        cursor: 'pointer',
                        background: isColorUri(p.uri) ? p.uri : 'var(--bg-tertiary)',
                        overflow: 'hidden',
                        position: 'relative' as const,
                        flexShrink: 0,
                      }}
                    >
                      {!isColorUri(p.uri) && (
                        <img
                          src={p.uri}
                          alt={p.caption}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                      {selected && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            background: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {photos.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                No hay imágenes. Descarga una o captura una foto con la Cámara.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Ajuste</span>
                <SegmentedControl
                  name="wallpaper-fit"
                  value={wallpaperFit}
                  onChange={(v) => setWallpaperFit(v as WallpaperFit)}
                  options={ALL_FITS.map(f => ({ value: f, label: FIT_LABELS[f] }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Posición</span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 6,
                    alignSelf: 'center',
                    width: 'min(100%, 180px)',
                  }}
                >
                  {ALL_POSITIONS.map(pos => {
                    const active = wallpaperPosition === pos;
                    return (
                      <button
                        key={pos}
                        className="pressable"
                        onClick={() => setWallpaperPosition(pos)}
                        aria-label={POSITION_LABELS[pos]}
                        title={POSITION_LABELS[pos]}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          border: active ? '1.5px solid var(--accent)' : '1px solid var(--outline-variant)',
                          background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: positionAlign[pos].align,
                          justifyContent: positionAlign[pos].justify,
                          padding: 10,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: active ? 'var(--accent)' : 'var(--outline)',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="cell-sep" style={{ marginLeft: 16 }} />
          </div>
        </ListGroup>
      </ListSection>

      <ListSection title="Color de acento">
        <ListGroup>
          <div
            className="cell-row"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              padding: '12px 16px',
              background: 'transparent',
            }}
          >
            {ACCENTS.map(a => (
              <button
                key={a.id}
                className="pressable"
                onClick={() => setAccent(a.id)}
                aria-label={a.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: accent === a.id ? '2px solid var(--primary)' : '2px solid var(--outline-variant)',
                  borderRadius: 999,
                  padding: '5px 14px 5px 6px',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: a.color, display: 'inline-flex', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </ListGroup>
      </ListSection>

      <ListSection title="Seguridad">
        <ListRow
          icon={iconTile('#30D158', <KeyRound size={15} color="#fff" />)}
          label="Contraseña"
          sublabel="Cambiar contraseña de desbloqueo"
          onClick={() => setShowPinDialog(true)}
        />
      </ListSection>

      <ListSection title="Acerca de">
        <ListRow
          icon={iconTile('#8E8E93', <Info size={15} color="#fff" />)}
          label="Nombre del dispositivo"
          value="AuroraOS"
        />
        <ListRow
          icon={iconTile('#007AFF', <Smartphone size={15} color="#fff" />)}
          label="Almacenamiento"
          sublabel={`${storagePercent * 100}% en uso`}
          value={formatGB(usedStorage)}
          showSeparator={false}
        />
      </ListSection>

      <div
        style={{
          margin: '0 16px',
          padding: '12px 16px',
          background: 'var(--surface-card)',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {formatGB(usedStorage)} / {formatGB(totalStorage)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Almacenamiento</span>
        </div>
        <ProgressBar value={storagePercent} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {formatGB(usedMemory)} / {formatGB(totalMemory)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memoria</span>
        </div>
        <ProgressBar value={memoryPercent} color="var(--success)" />
      </div>

      <div style={{ height: 24 }} />

      {showPinDialog && <ChangePinDialog onClose={() => setShowPinDialog(false)} />}
    </Screen>
  );
};

export default Settings;