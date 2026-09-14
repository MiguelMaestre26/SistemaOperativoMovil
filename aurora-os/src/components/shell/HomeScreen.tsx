import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ALL_APPS, getAppIcon } from './Launcher';
import FolderView from './FolderView';
import { WidgetsPage } from '../widgets';
import { openPrompt } from '../ui/dialogs';
import { Search } from 'lucide-react';
import { useHomeStore, type HomeItem, type HomeFolder } from '../../stores/useHomeStore';

interface HomeScreenProps {
  onOpenApp: (id: string) => void;
  onOpenDrawer: () => void;
}

const APPS_PER_PAGE = 20;
const LONG_PRESS_MS = 400;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function defaultFolderName(aId: string, bId: string): string {
  const na = ALL_APPS.find(x => x.id === aId)?.name ?? aId;
  const nb = ALL_APPS.find(x => x.id === bId)?.name ?? bId;
  return `${na} + ${nb}`;
}

function appDef(id: string) {
  return ALL_APPS.find(a => a.id === id);
}

function FolderPreview({
  folder,
  hovered = false,
  ghost = false,
}: {
  folder: HomeFolder | undefined;
  hovered?: boolean;
  ghost?: boolean;
}) {
  const defs = folder ? folder.apps.slice(0, 4).map(id => appDef(id)).filter((d): d is NonNullable<typeof d> => Boolean(d)) : [];
  const remaining = folder ? Math.max(0, folder.apps.length - defs.length) : 0;

  return (
    <div
      style={{
        ...styles.folderIcon,
        ...(ghost ? styles.folderIconGhost : {}),
        ...(hovered ? styles.folderHover : {}),
      }}
    >
      <div style={styles.folderGrid}>
        {Array.from({ length: 4 }).map((_, i) => {
          const def = defs[i];
          if (def) {
            return (
              <div key={def.id} style={{ ...styles.folderMini, background: def.color }}>
                {getAppIcon(def.icon, 12)}
              </div>
            );
          }
          if (remaining > 0 && i === 3) {
            return (
              <div key="more" style={styles.folderMini}>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-primary)' }}>+{remaining}</span>
              </div>
            );
          }
          return <div key={`e${i}`} style={styles.folderMiniEmpty} />;
        })}
      </div>
      {!ghost && folder && folder.apps.length > 4 && (
        <div style={styles.folderBadge}>{folder.apps.length}</div>
      )}
    </div>
  );
}

export default function HomeScreen({ onOpenApp, onOpenDrawer }: HomeScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [page, setPage] = useState(0);
  const [pageW, setPageW] = useState(390);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; horiz: boolean } | null>(null);
  const [dragX, setDragX] = useState(0);

  // ── Home layout store ────────────────────────────────────────
  const homeItems = useHomeStore(s => s.items);
  const folders = useHomeStore(s => s.folders);
  const editMode = useHomeStore(s => s.editMode);
  const enterEditMode = useHomeStore(s => s.enterEditMode);
  const exitEditMode = useHomeStore(s => s.exitEditMode);
  const moveItem = useHomeStore(s => s.moveItem);
  const createFolder = useHomeStore(s => s.createFolder);
  const addToFolder = useHomeStore(s => s.addToFolder);
  const renameFolder = useHomeStore(s => s.renameFolder);

  // ── Gestión de carpetas ──────────────────────────────────────
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);

  // ── Drag & hold de aplicaciones ──────────────────────────────
  const [drag, setDrag] = useState<{ x: number; y: number; item: HomeItem } | null>(null);
  const [dragFrom, setDragFrom] = useState(-1);
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const [hoverFolderId, setHoverFolderId] = useState<string | null>(null);
  const dragActiveRef = useRef(false);
  const fromIndexRef = useRef(-1);
  const justDraggedRef = useRef(false);
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressRef = useRef<{
    pointerId: number;
    el: HTMLElement | null;
    originX: number;
    originY: number;
    lastX: number;
    lastY: number;
    item: HomeItem;
    itemIndex: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setPageW(el.offsetWidth || 390);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => {
    if (longTimerRef.current) clearTimeout(longTimerRef.current);
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    if (pageScrollRef.current) clearInterval(pageScrollRef.current);
  }, []);

  useEffect(() => () => {
    exitEditMode();
  }, [exitEditMode]);

  const appPages = chunk(homeItems, APPS_PER_PAGE);
  const totalPages = 1 + appPages.length;
  const clampPage = (n: number) => Math.max(0, Math.min(totalPages - 1, n));

  const clearLongTimer = () => {
    if (longTimerRef.current) {
      clearTimeout(longTimerRef.current);
      longTimerRef.current = null;
    }
  };

  const clearPress = () => {
    clearLongTimer();
    pressRef.current = null;
  };

  const stopAutoPage = () => {
    if (pageScrollRef.current) {
      clearInterval(pageScrollRef.current);
      pageScrollRef.current = null;
    }
  };

  const finishDrag = () => {
    dragActiveRef.current = false;
    fromIndexRef.current = -1;
    stopAutoPage();
    clearLongTimer();
    pressRef.current = null;
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = setTimeout(() => {
      justDraggedRef.current = false;
    }, 120);
    setDrag(null);
    setDragFrom(-1);
    setDragSlot(null);
    setHoverFolderId(null);
  };

  const beginDragFromPress = () => {
    const p = pressRef.current;
    if (!p || !p.el) return;
    try {
      p.el.setPointerCapture(p.pointerId);
    } catch {
      /* ignore */
    }
    p.moved = true;
    dragActiveRef.current = true;
    fromIndexRef.current = p.itemIndex;
    justDraggedRef.current = true;
    setDragFrom(p.itemIndex);
    setDrag({ x: p.lastX, y: p.lastY, item: p.item });
    clearLongTimer();
  };

  const onItemPointerDown = (e: React.PointerEvent, item: HomeItem, index: number) => {
    e.stopPropagation();
    clearPress();
    if (dragActiveRef.current) return;
    const el = e.currentTarget as HTMLElement;
    pressRef.current = {
      pointerId: e.pointerId,
      el,
      originX: e.clientX,
      originY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      item,
      itemIndex: index,
      moved: false,
    };
    if (editMode) {
      beginDragFromPress();
      return;
    }
    longTimerRef.current = setTimeout(() => {
      if (!pressRef.current) return;
      enterEditMode();
      beginDragFromPress();
    }, LONG_PRESS_MS);
  };

  const getOverItem = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const cell = el?.closest?.('[data-home-index]') as HTMLElement | null;
    if (!cell) return null;
    const index = Number(cell.dataset.homeIndex);
    const item = homeItems[index];
    if (!item || Number.isNaN(index)) return null;
    return { index, item, glyph: cell.firstElementChild as HTMLElement | null };
  };

  const isOverGlyph = (g: HTMLElement | null, clientX: number, clientY: number) => {
    if (!g) return false;
    const rect = g.getBoundingClientRect();
    const hw = rect.width / 2;
    const hh = rect.height / 2;
    return Math.abs(clientX - (rect.left + hw)) < hw && Math.abs(clientY - (rect.top + hh)) < hh;
  };

  const computeDropSlot = (clientX: number, clientY: number): number | null => {
    const grid = page >= 1 ? gridRefs.current[page - 1] : null;
    const pageItems = appPages[page - 1];
    if (!grid || !pageItems || pageItems.length === 0) return null;
    const rect = grid.getBoundingClientRect();
    const cols = 4;
    const rows = Math.ceil(pageItems.length / cols);
    const col = Math.min(cols - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * cols)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * rows)));
    return Math.max(0, Math.min(homeItems.length - 1, (page - 1) * APPS_PER_PAGE + row * cols + col));
  };

  const handleAutoPage = (clientX: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dir: -1 | 0 | 1 = clientX < rect.left + 36 ? -1 : clientX > rect.right - 36 ? 1 : 0;
    if (pageScrollRef.current) {
      clearInterval(pageScrollRef.current);
      pageScrollRef.current = null;
    }
    if (dir === 0) return;
    const step = () => setPage(p => clampPage(p + dir));
    step();
    pageScrollRef.current = setInterval(step, 700);
  };

  const onItemPointerMove = (e: React.PointerEvent) => {
    if (dragActiveRef.current) {
      e.stopPropagation();
      e.preventDefault();
      const item = pressRef.current?.item;
      if (!item) return;
      setDrag({ x: e.clientX, y: e.clientY, item });
      const over = getOverItem(e.clientX, e.clientY);
      const isApp = item.kind === 'app';
      setHoverFolderId(
        over && isApp && over.item.kind === 'folder' && over.index !== fromIndexRef.current &&
          isOverGlyph(over.glyph, e.clientX, e.clientY)
          ? over.item.id
          : null
      );
      if (over && isApp && over.item.kind === 'app' && over.index !== fromIndexRef.current) {
        const g = over.glyph;
        if (g) {
          const rect = g.getBoundingClientRect();
          const nearCenter =
            Math.abs(e.clientX - (rect.left + rect.width / 2)) < rect.width * 0.4 &&
            Math.abs(e.clientY - (rect.top + rect.height / 2)) < rect.height * 0.4;
          setDragSlot(nearCenter ? over.index : computeDropSlot(e.clientX, e.clientY));
        }
      } else {
        setDragSlot(computeDropSlot(e.clientX, e.clientY));
      }
      handleAutoPage(e.clientX);
      return;
    }
    const p = pressRef.current;
    if (!p || p.moved) return;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    if (Math.abs(e.clientX - p.originX) > 10 || Math.abs(e.clientY - p.originY) > 10) {
      clearPress();
    }
  };

  const performDrop = (slot: number | null, over: ReturnType<typeof getOverItem>, clientX: number, clientY: number) => {
    const from = fromIndexRef.current;
    if (from < 0 || from >= homeItems.length) return;
    const moving = homeItems[from];
    if (!moving) return;

    if (over && over.index !== from && moving.kind === 'app' && isOverGlyph(over.glyph, clientX, clientY)) {
      const tItem = over.item;
      if (tItem.kind === 'app' && tItem.id !== moving.id) {
        const name = defaultFolderName(moving.id, tItem.id);
        const folderId = createFolder([moving.id, tItem.id], name);
        exitEditMode();
        void openPrompt({
          title: 'Nombre de la carpeta',
          message: 'Ponle un nombre a tu carpeta de aplicaciones.',
          value: name,
          cancelText: 'Cancelar',
          confirmText: 'Guardar',
        }).then(val => {
          if (val && val.trim()) renameFolder(folderId, val.trim());
        });
        return;
      }
      if (tItem.kind === 'folder') {
        addToFolder(moving.id, tItem.id);
        return;
      }
    }
    if (slot !== null && slot !== from) moveItem(from, slot);
  };

  const onItemPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (dragActiveRef.current) {
      const over = getOverItem(e.clientX, e.clientY);
      performDrop(computeDropSlot(e.clientX, e.clientY), over, e.clientX, e.clientY);
      finishDrag();
      return;
    }
    clearPress();
  };

  const onItemPointerCancel = () => {
    if (dragActiveRef.current) finishDrag();
    clearPress();
  };

  const onItemClick = (item: HomeItem) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    if (editMode || openFolderId) return;
    if (item.kind === 'folder') {
      if (folders[item.id]) setOpenFolderId(item.id);
      return;
    }
    exitEditMode();
    onOpenApp(item.id);
  };

  const onRootPointerDown = (e: React.PointerEvent) => {
    if (editMode && !(e.target as HTMLElement).closest('button')) {
      exitEditMode();
    }
    dragRef.current = { startX: e.clientX, startY: e.clientY, horiz: false };
  };

  const onRootPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.horiz) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        d.horiz = true;
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null;
        setDragging(false);
        return;
      }
    }
    if (d.horiz) setDragX(dx);
  };

  const onRootPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!d || !d.horiz) {
      setDragX(0);
      return;
    }
    const dx = e.clientX - d.startX;
    if (dx < -pageW * 0.18) setPage(p => clampPage(p + 1));
    else if (dx > pageW * 0.18) setPage(p => clampPage(p - 1));
    setDragX(0);
  };

  return (
    <div
      ref={rootRef}
      style={styles.root}
      onPointerDown={onRootPointerDown}
      onPointerMove={onRootPointerMove}
      onPointerUp={onRootPointerUp}
      onPointerCancel={onRootPointerUp}
    >
      <button
        className="pressable"
        style={styles.searchPill}
        onClick={() => {
          exitEditMode();
          onOpenDrawer();
        }}
        onPointerDown={e => e.stopPropagation()}
      >
        <Search size={16} color="var(--on-surface-variant)" />
        <span style={styles.searchPillText}>Buscar aplicaciones</span>
      </button>

      {/* Barra de modo edición */}
      {editMode && (
        <div style={styles.editBar}>
          <span style={styles.editBarText}>
            Mantén presionado y arrastra · Suelta una app sobre otra para crear una carpeta
          </span>
          <button
            className="pressable"
            style={styles.doneBtn}
            onClick={exitEditMode}
            onPointerDown={e => e.stopPropagation()}
          >
            Listo
          </button>
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: `${totalPages * 100}%`,
            transform: `translateX(${dragX - page * pageW}px)`,
            transition: dragging
              ? 'none'
              : 'transform 0.34s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <Page key="widgets" heightPx={pageW}>
            <WidgetsPage onOpenApp={onOpenApp} />
          </Page>

          {appPages.map((pageItems, i) => {
            const pageStart = i * APPS_PER_PAGE;
            return (
              <Page key={`apps-${i}`} heightPx={pageW}>
                <div style={styles.sectionLabel}>
                  {i === 0 ? 'Tus aplicaciones' : 'Más aplicaciones'}
                </div>
                <div
                  ref={el => {
                    gridRefs.current[i] = el;
                  }}
                  data-app-grid
                  style={styles.appGrid}
                >
                  {i === page - 1 && drag !== null && dragSlot !== null && (() => {
                    const local = dragSlot - (page - 1) * APPS_PER_PAGE;
                    const cols = 4;
                    const rows = Math.ceil(pageItems.length / cols);
                    if (local < 0 || local >= pageItems.length) return null;
                    const dropCol = local % cols;
                    const dropRow = Math.floor(local / cols);
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${(dropCol / cols) * 100}%`,
                          top: `${(dropRow / rows) * 100}%`,
                          width: `${(100 / cols) * 0.96}%`,
                          height: `${(100 / rows) * 0.9}%`,
                          borderRadius: 18,
                          border: '2px dashed var(--primary)',
                          opacity: 0.55,
                          background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                          pointerEvents: 'none',
                          zIndex: 2,
                        }}
                      />
                    );
                  })()}
                  {pageItems.map((item, localIdx) => {
                    const index = pageStart + localIdx;
                    const isFolder = item.kind === 'folder';
                    const folder = isFolder ? folders[item.id] : undefined;
                    const isBeingDragged = index === dragFrom;
                    const isHoverFolder =
                      isFolder &&
                      !isBeingDragged &&
                      hoverFolderId !== null &&
                      item.id === hoverFolderId;

                    return (
                      <div
                        key={item.kind === 'folder' ? `folder-${item.id}` : `app-${item.id}`}
                        data-home-index={index}
                        style={styles.appItem}
                        className={
                          isBeingDragged
                            ? 'home-dragging'
                            : editMode
                              ? 'home-jiggle'
                              : undefined
                        }
                        onPointerDown={e => onItemPointerDown(e, item, index)}
                        onPointerMove={onItemPointerMove}
                        onPointerUp={onItemPointerUp}
                        onPointerCancel={onItemPointerCancel}
                        onClick={() => onItemClick(item)}
                      >
                        {isFolder && folder ? (
                          <FolderPreview folder={folder} hovered={isHoverFolder} />
                        ) : !isFolder ? (
                          <div style={{ ...styles.appIcon, background: appDef(item.id)?.color ?? '#444' }}>
                            {getAppIcon(appDef(item.id)?.icon ?? 'store')}
                          </div>
                        ) : (
                          <FolderPreview folder={undefined} />
                        )}
                        <span style={styles.appName}>
                          {isFolder ? (folder?.name ?? 'Carpeta') : (appDef(item.id)?.name ?? item.id)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {i === appPages.length - 1 && (
                  <button
                    style={styles.drawerBtn}
                    onClick={() => {
                      exitEditMode();
                      onOpenDrawer();
                    }}
                  >
                    Ver todas las aplicaciones
                  </button>
                )}
              </Page>
            );
          })}
        </div>
      </div>

      {/* Indicador de página */}
      <div style={styles.dots}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            aria-label={`Página ${i + 1}`}
            style={{
              ...styles.dot,
              background: i === page ? 'var(--primary)' : 'var(--outline-variant)',
              opacity: i === page ? 1 : 0.6,
              width: i === page ? 18 : 7,
            }}
          />
        ))}
      </div>

      {/* Carpeta abierta */}
      {openFolderId && (
        <FolderView folderId={openFolderId} onClose={() => setOpenFolderId(null)} />
      )}

      {/* Fantasma de arrastre */}
      {drag &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: drag.x,
              top: drag.y,
              transform: 'translate(-50%, -55%) scale(1.12)',
              zIndex: 100000,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
            }}
          >
            {drag.item.kind === 'app' ? (
              <div style={{ ...styles.appIcon, width: 64, height: 64, background: appDef(drag.item.id)?.color ?? '#444' }}>
                {getAppIcon(appDef(drag.item.id)?.icon ?? 'store', 28)}
              </div>
            ) : (
              <FolderPreview folder={folders[drag.item.id]} ghost />
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

function Page({ children, heightPx }: { children: ReactNode; heightPx: number }) {
  return (
    <div
      style={{
        flex: `1 0 ${heightPx}px`,
        height: '100%',
        minWidth: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
    touchAction: 'pan-y',
    display: 'flex',
    flexDirection: 'column',
  },
  searchPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '10px 18px 4px',
    padding: '0 18px',
    height: 46,
    borderRadius: 999,
    background: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  searchPillText: {
    fontSize: 15,
    color: 'var(--on-surface-variant)',
    fontWeight: 400,
  },
  editBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '2px 18px 4px',
    padding: '7px 14px',
    borderRadius: 14,
    background: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    flexShrink: 0,
  },
  editBarText: {
    flex: 1,
    fontSize: 11.5,
    color: 'var(--on-surface-variant)',
    lineHeight: 1.3,
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--on-surface-variant)',
    letterSpacing: 0.4,
    padding: '14px 20px 8px',
    textTransform: 'uppercase' as const,
  },
  appGrid: {
    position: 'relative' as const,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
    padding: '4px 14px 12px',
  },
  appItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'grab',
    transition: 'transform 0.15s ease',
    willChange: 'transform',
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: '24%',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  folderIcon: {
    width: 60,
    height: 60,
    borderRadius: '24%',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  folderIconGhost: {
    width: 64,
    height: 64,
    background: 'var(--glass-strong)',
  },
  folderHover: {
    transform: 'scale(1.12)',
    boxShadow: '0 0 0 3px var(--primary), var(--shadow-md)',
    borderColor: 'var(--primary)',
  },
  folderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 3,
    padding: 8,
  },
  folderMini: {
    width: 18,
    height: 18,
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
  },
  folderMiniEmpty: {
    width: 18,
    height: 18,
    borderRadius: 5,
    background: 'rgba(120,120,128,0.28)',
  },
  folderBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    padding: '0 5px',
    borderRadius: 999,
    background: 'var(--danger)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  appName: {
    fontSize: 11,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    maxWidth: 76,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  drawerBtn: {
    margin: '6px 16px 0',
    padding: '11px',
    borderRadius: 999,
    background: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--primary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  dots: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'none',
  },
  dot: {
    height: 7,
    borderRadius: 999,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'background 0.2s ease, width 0.2s ease, opacity 0.2s ease',
  },
};