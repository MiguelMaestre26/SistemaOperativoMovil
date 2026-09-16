import { useState, useEffect } from 'react';
import {
  Folder, FileText, ChevronRight, ArrowUp, Trash2, Download,
  HardDrive, Plus, Image as ImageIcon, Music as MusicIcon,
  Video as VideoIcon, Home,
} from 'lucide-react';
import { storageManager, type StorageItem } from '../../../core/StorageManager';
import { isImageItem } from '../../../core/downloads';
import { isPdfItem, openPdf } from '../../../core/pdfSession';
import { notificationService } from '../../../core/NotificationService';
import { useSystemStore } from '../../../stores/useSystemStore';
import {
  Screen, AppHeader, ListGroup, ListRow, SearchBar, EmptyState, Card, ProgressBar, IconButton,
  openPrompt, openConfirm,
} from '../../ui';

const ROOT = 'root';

function iconFor(item: StorageItem): React.ReactNode {
  if (item.type === 'folder') {
    if (item.id === 'dcim') return <ImageIcon size={18} color="#fff" />;
    if (item.id === 'music') return <MusicIcon size={18} color="#fff" />;
    if (item.id === 'videos') return <VideoIcon size={18} color="#fff" />;
    if (item.id === 'downloads') return <Download size={18} color="#fff" />;
    return <Folder size={18} color="#fff" />;
  }
  return <FileText size={18} color="#fff" />;
}

function iconBg(item: StorageItem): string {
  if (item.type !== 'folder') return '#8E8E93';
  switch (item.id) {
    case 'dcim': return '#30B0C7';
    case 'music': return '#FF2D55';
    case 'videos': return '#FF9500';
    case 'downloads': return 'var(--primary)';
    default: return 'var(--tertiary)';
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function FileManager() {
  const [currentId, setCurrentId] = useState<string>(ROOT);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [crumbs, setCrumbs] = useState<StorageItem[]>([storageManager.getItem(ROOT)!]);
  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [, force] = useState(0);
  const [preview, setPreview] = useState<StorageItem | null>(null);

  const refresh = () => {
    setItems(storageManager.getChildren(currentId));
    const path: StorageItem[] = [];
    let cur = storageManager.getItem(currentId);
    while (cur) {
      path.unshift(cur);
      cur = cur.parentId ? storageManager.getItem(cur.parentId) : undefined;
    }
    setCrumbs(path);
    force(n => n + 1);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const getUsed = () => storageManager.getUsed();
  const getTotal = () => storageManager.getTotal();

  const open = (item: StorageItem) => {
    if (item.type === 'folder') {
      setCurrentId(item.id);
      return;
    }
    if (isImageItem(item) && item.content) {
      setPreview(item);
      return;
    }
    if (isPdfItem(item)) {
      openPdf(item);
      return;
    }
    notificationService.push('file-manager', item.name, `Archivo ${item.mimeType ?? ''} (sin visor).`.trim());
  };

  const createFile = async () => {
    const name = await openPrompt({ title: 'Nuevo archivo', placeholder: 'Nombre del archivo' });
    if (!name?.trim()) return;
    storageManager.createFile(name.trim(), currentId, '');
    refresh();
  };

  const createFolder = async () => {
    const name = await openPrompt({ title: 'Nueva carpeta', placeholder: 'Nombre de la carpeta' });
    if (!name?.trim()) return;
    storageManager.createFolder(name.trim(), currentId);
    refresh();
  };

  const remove = async (id: string) => {
    const item = storageManager.getItem(id);
    if (!item) return;
    const ok = await openConfirm({
      title: 'Eliminar',
      message: `¿Eliminar "${item.name}"?`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    storageManager.deleteItem(id);
    refresh();
  };

  const filtered = query ? storageManager.search(query) : items;

  return (
    <Screen scroll={false} padding="0" style={{ position: 'relative' }}>
      <AppHeader
        title="Archivos"
        right={
          <>
            <IconButton label="Nueva carpeta" bg="rgba(0,122,255,0.12)" onClick={() => void createFolder()}>
              <Plus size={18} color="var(--accent)" />
            </IconButton>
            <IconButton label="Nuevo archivo" bg="rgba(0,122,255,0.12)" onClick={() => void createFile()}>
              <FileText size={18} color="var(--accent)" />
            </IconButton>
          </>
        }
      />

      <SearchBar value={query} onChange={setQuery} placeholder="Buscar archivos…" />

      <div style={styles.crumbs}>
        <button className="pressable" style={styles.crumbBtn} onClick={() => setCurrentId(ROOT)} aria-label="Inicio">
          <Home size={14} color="var(--accent)" />
        </button>
        {crumbs.map((c, i) => (
          <span key={c.id} style={styles.crumbSeg}>
            <ChevronRight size={12} color="var(--text-tertiary)" />
            <button
              className="pressable"
              style={styles.crumbText}
              onClick={() => i < crumbs.length - 1 && setCurrentId(c.id)}
            >
              {c.name}
            </button>
          </span>
        ))}
      </div>

      {!query && currentId !== ROOT && (
        <button
          className="pressable"
          style={styles.upBtn}
          onClick={() => {
            const parent = storageManager.getItem(currentId)?.parentId;
            if (parent) setCurrentId(parent);
          }}
        >
          <ArrowUp size={15} color="var(--accent)" /> Subir nivel
        </button>
      )}

      <div style={styles.list}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<HardDrive size={28} color="var(--text-secondary)" />}
            title="Carpeta vacía"
          />
        ) : (
          <ListGroup>
            {filtered.map((item, i) => (
              <div
                key={item.id}
                style={styles.rowWrap}
                onContextMenu={e => {
                  e.preventDefault();
                  setMenuFor(menuFor === item.id ? null : item.id);
                }}
              >
                <ListRow
                  chevron={false}
                  showSeparator={i < filtered.length - 1}
                  icon={iconFor(item)}
                  iconBg={iconBg(item)}
                  label={item.name}
                  sublabel={item.type === 'folder' ? 'Carpeta' : `${item.mimeType ?? 'Archivo'} · ${formatSize(item.size)}`}
                  onClick={() => open(item)}
                  value={
                    <span onClick={e => e.stopPropagation()}>
                      <IconButton
                        label="Opciones"
                        size={30}
                        bg="transparent"
                        onClick={() => setMenuFor(menuFor === item.id ? null : item.id)}
                      >
                        <Trash2 size={16} color="var(--danger)" />
                      </IconButton>
                    </span>
                  }
                />
                {menuFor === item.id && (
                  <div style={styles.menu}>
                    {item.type === 'file' && isImageItem(item) && item.content && (
                      <button
                        className="pressable"
                        style={styles.menuAction}
                        onClick={() => {
                          useSystemStore.getState().setWallpaper(item.content!);
                          setMenuFor(null);
                        }}
                      >
                        <ImageIcon size={14} color="var(--accent)" /> Usar como fondo
                      </button>
                    )}
                    <button
                      className="pressable"
                      style={styles.menuItem}
                      onClick={() => { void remove(item.id); setMenuFor(null); }}
                    >
                      <Trash2 size={14} color="var(--danger)" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </ListGroup>
        )}
      </div>

      <Card style={{ margin: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={styles.storageText}>
          <span>{formatSize(getUsed())} usados de {formatSize(getTotal())}</span>
          <span>{Math.max(0, Math.round(storageManager.getUsagePercent()))}%</span>
        </div>
        <ProgressBar value={Math.min(1, storageManager.getUsagePercent() / 100)} />
      </Card>

      {preview && preview.content && (
        <div style={styles.lightbox} onClick={() => setPreview(null)}>
          <div style={styles.lbTop}>
            <span style={styles.lbName}>{preview.name}</span>
            <button
              className="pressable"
              style={styles.lbAction}
              onClick={e => {
                e.stopPropagation();
                useSystemStore.getState().setWallpaper(preview.content!);
                setPreview(null);
              }}
            >
              <ImageIcon size={16} color="#fff" /> Usar como fondo
            </button>
            <button className="pressable" style={styles.lbClose} onClick={() => setPreview(null)} aria-label="Cerrar">
              X
            </button>
          </div>
          <div style={styles.lbImgBox} onClick={e => e.stopPropagation()}>
            <img src={preview.content} alt={preview.name} style={styles.lbImg} />
          </div>
        </div>
      )}
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  crumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '4px 14px 6px',
    overflowX: 'auto',
    flexWrap: 'nowrap' as const,
    flexShrink: 0,
  },
  crumbBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
  },
  crumbSeg: { display: 'flex', alignItems: 'center' },
  crumbText: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 4,
    fontSize: 13,
    color: 'var(--accent)',
    whiteSpace: 'nowrap' as const,
  },
  upBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '2px 14px 6px',
    padding: '6px 12px',
    borderRadius: 8,
    border: 'none',
    background: 'rgba(0,122,255,0.10)',
    color: 'var(--accent)',
    fontSize: 13,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  list: { flex: 1, overflowY: 'auto', padding: '2px 0 14px' },
  rowWrap: { position: 'relative' as const },
  menu: {
    position: 'absolute' as const,
    right: 16,
    top: 44,
    background: 'var(--surface-card)',
    borderRadius: 10,
    boxShadow: 'var(--shadow-lg)',
    padding: 6,
    zIndex: 20,
    minWidth: 160,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: 'none',
    background: 'none',
    padding: '8px 12px',
    fontSize: 13,
    color: 'var(--danger)',
    cursor: 'pointer',
    borderRadius: 6,
    width: '100%',
  },
  menuAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: 'none',
    background: 'none',
    padding: '8px 12px',
    fontSize: 13,
    color: 'var(--accent)',
    cursor: 'pointer',
    borderRadius: 6,
    width: '100%',
  },
  storageText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  lightbox: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.95)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  lbTop: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '14px 16px',
  },
  lbName: {
    color: '#fff',
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flexShrink: 1,
  },
  lbAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(52,199,89,0.25)',
    border: '1px solid rgba(52,199,89,0.5)',
    color: '#fff',
    borderRadius: 14,
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  lbClose: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    width: 30,
    height: 30,
    borderRadius: 15,
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 700,
  },
  lbImgBox: { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lbImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const },
};