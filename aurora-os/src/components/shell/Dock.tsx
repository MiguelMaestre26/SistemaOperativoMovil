import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Plus, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useDockStore, MAX_DOCK_APPS } from '../../stores/useDockStore';
import { ALL_APPS, getAppIcon } from './Launcher';
import DockAppPicker from './DockAppPicker';

const LONG_PRESS_MS = 400;

interface DockProps {
  onOpenDrawer: () => void;
}

export default function Dock({ onOpenDrawer }: DockProps) {
  const openApp = useAppStore(s => s.openApp);
  const openApps = useAppStore(s => s.openApps);
  const appIds = useDockStore(s => s.appIds);
  const editMode = useDockStore(s => s.editMode);
  const enterEditMode = useDockStore(s => s.enterEditMode);
  const exitEditMode = useDockStore(s => s.exitEditMode);
  const removeApp = useDockStore(s => s.removeApp);
  const resetToDefault = useDockStore(s => s.resetToDefault);

  const [pickerOpen, setPickerOpen] = useState(false);
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => () => {
    if (longTimerRef.current) clearTimeout(longTimerRef.current);
  }, []);

  useEffect(() => () => {
    exitEditMode();
  }, [exitEditMode]);

  const clearLongTimer = () => {
    if (longTimerRef.current) {
      clearTimeout(longTimerRef.current);
      longTimerRef.current = null;
    }
  };

  const startLongPress = () => {
    clearLongTimer();
    longTimerRef.current = setTimeout(() => {
      enterEditMode();
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 350);
    }, LONG_PRESS_MS);
  };

  const isOpen = (id: string) =>
    openApps.some(a => a.id === id && a.status !== 'terminated');

  const appDefs = appIds
    .map(id => ALL_APPS.find(a => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const showAddBtn = appIds.length < MAX_DOCK_APPS;
  const screenEl =
    typeof document !== 'undefined' ? document.querySelector('[data-screen]') : null;

  return (
    <div style={styles.container}>
      {editMode && (
        <div
          style={styles.editBackdrop}
          onPointerDown={e => {
            e.stopPropagation();
            exitEditMode();
          }}
        />
      )}

      {editMode && (
        <div style={styles.editBar} onPointerDown={e => e.stopPropagation()}>
          <span style={styles.editBarText}>Quita apps con la X · Añade con el +</span>
          <button className="pressable" style={styles.resetBtn} onClick={resetToDefault}>
            Restaurar
          </button>
          <button className="pressable" style={styles.doneBtn} onClick={exitEditMode}>
            Listo
          </button>
        </div>
      )}

      <div style={styles.dock}>
        {appDefs.map(def => {
          const running = isOpen(def.id);
          return (
            <div
              key={def.id}
              className={editMode ? 'home-jiggle' : undefined}
              style={styles.appItem}
              onClick={() => {
                if (suppressClickRef.current) return;
                if (editMode) return;
                openApp(def.id);
              }}
              onPointerDown={e => {
                e.stopPropagation();
                if (editMode) return;
                startLongPress();
              }}
              onPointerUp={clearLongTimer}
              onPointerLeave={clearLongTimer}
              onPointerCancel={clearLongTimer}
            >
              <div style={{ ...styles.appIcon, background: def.color }}>
                {getAppIcon(def.icon, 22)}
                {running && <div style={styles.dot} />}
                {editMode && (
                  <button
                    className="dock-remove-btn"
                    aria-label={`Quitar ${def.name} del dock`}
                    style={styles.removeBtn}
                    onClick={e => {
                      e.stopPropagation();
                      removeApp(def.id);
                    }}
                  >
                    <X size={11} color="#fff" strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {showAddBtn && (
          <div
            style={styles.appItem}
            onClick={() => setPickerOpen(true)}
            aria-label="Añadir aplicación al dock"
          >
            <button
              className="pressable"
              style={styles.addBtn}
              onClick={() => setPickerOpen(true)}
              aria-label="Añadir aplicación al dock"
            >
              <Plus size={22} color="var(--text-primary)" />
            </button>
          </div>
        )}

        <div style={styles.separator} />

        <div style={styles.appItem} onClick={onOpenDrawer} aria-label="Todas las aplicaciones">
          <div style={styles.appIconGrid}>
            <LayoutGrid size={21} color="var(--text-primary)" />
          </div>
        </div>
      </div>

      {pickerOpen &&
        screenEl &&
        createPortal(
          <DockAppPicker onClose={() => setPickerOpen(false)} />,
          screenEl as HTMLElement
        )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 80,
    pointerEvents: 'none',
  },
  editBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 94,
    background: 'rgba(0,0,0,0.12)',
    pointerEvents: 'auto',
  },
  editBar: {
    position: 'absolute',
    bottom: 112,
    left: 0,
    right: 0,
    zIndex: 96,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 18px',
    padding: '8px 12px',
    borderRadius: 14,
    background: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    boxShadow: 'var(--shadow-md)',
    pointerEvents: 'auto',
  },
  editBarText: {
    flex: 1,
    fontSize: 11.5,
    color: 'var(--on-surface-variant)',
    lineHeight: 1.3,
  },
  resetBtn: {
    background: 'transparent',
    border: '1px solid var(--outline-variant)',
    borderRadius: 999,
    padding: '7px 12px',
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--on-surface-variant)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  doneBtn: {
    background: 'var(--primary)',
    color: 'var(--on-primary)',
    border: 'none',
    borderRadius: 999,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  dock: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '10px 18px',
    borderRadius: 30,
    background: 'var(--glass)',
    backdropFilter: 'blur(22px) saturate(170%)',
    WebkitBackdropFilter: 'blur(22px) saturate(170%)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-md)',
    pointerEvents: 'auto',
    zIndex: 95,
  },
  appItem: {
    cursor: 'pointer',
    transition: 'transform 0.15s',
    position: 'relative' as const,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  appIconGrid: {
    width: 52,
    height: 52,
    borderRadius: 17,
    background: 'var(--surface-container-high)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    boxShadow: 'var(--shadow-sm)',
  },
  dot: {
    position: 'absolute' as const,
    bottom: -5,
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--primary)',
  },
  removeBtn: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 19,
    height: 19,
    borderRadius: '50%',
    background: '#FF453A',
    border: '2px solid var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 2,
    padding: 0,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 17,
    background: 'var(--surface-container-high)',
    border: '1px dashed var(--outline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  },
  separator: {
    width: 1,
    height: 30,
    background: 'var(--outline-variant)',
  },
};