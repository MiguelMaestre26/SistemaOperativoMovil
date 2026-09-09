import { useState, useEffect } from 'react';
import {
  Folder, FileText, ChevronRight, ArrowUp, Trash2, Download,
  Search, HardDrive, Plus, Image as ImageIcon, Music as MusicIcon,
  Video as VideoIcon, Home,
} from 'lucide-react';
import { storageManager, type StorageItem } from '../../../core/StorageManager';
import { isImageItem } from '../../../core/downloads';
import { notificationService } from '../../../core/NotificationService';
import { useSystemStore } from '../../../stores/useSystemStore';

const ROOT = 'root';

function iconFor(item: StorageItem): React.ReactNode {
  if (item.type === 'folder') {
    if (item.id === 'dcim') return <ImageIcon size={18} color="#8E8E93" style={{ marginRight: 10 }} />;
    if (item.id === 'music') return <MusicIcon size={18} color="#8E8E93" style={{ marginRight: 10 }} />;
    if (item.id === 'videos') return <VideoIcon size={18} color="#8E8E93" style={{ marginRight: 10 }} />;
    if (item.id === 'downloads') return <Download size={18} color="#8E8E93" style={{ marginRight: 10 }} />;
    return <Folder size={18} color="#007AFF" style={{ marginRight: 10 }} />;
  }
  return <FileText size={18} color="#8E8E93" style={{ marginRight: 10 }} />;
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
    notificationService.push('file-manager', item.name, `Archivo ${item.mimeType ?? ''} (sin visor).`.trim());
  };

  const createFile = () => {
    const name = window.prompt('Nombre del archivo:');
    if (!name?.trim()) return;
    storageManager.createFile(name.trim(), currentId, '');
    refresh();
  };

  const createFolder = () => {
    const name = window.prompt('Nombre de la carpeta:');
    if (!name?.trim()) return;
    storageManager.createFolder(name.trim(), currentId);
    refresh();
  };

  const remove = (id: string) => {
    const item = storageManager.getItem(id);
    if (!item) return;
    if (window.confirm(`¿Eliminar "${item.name}"?`)) {
      storageManager.deleteItem(id);
      refresh();
    }
  };

  const filtered = query ? storageManager.search(query) : items;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Archivos</span>
        <div style={styles.headerBtns}>
          <button style={styles.iconBtn} onClick={createFolder} title="Nueva carpeta">
            <Plus size={18} color="#007AFF" />
          </button>
          <button style={styles.iconBtn} onClick={createFile} title="Nuevo archivo">
            <FileText size={18} color="#007AFF" />
          </button>
        </div>
      </div>

      <div style={styles.searchBox}>
        <Search size={15} color="#8E8E93" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar archivos…"
          style={styles.searchInput}
        />
      </div>

      <div style={styles.crumbs}>
        <button style={styles.crumbBtn} onClick={() => setCurrentId(ROOT)} aria-label="Inicio">
          <Home size={14} color="#007AFF" />
        </button>
        {crumbs.map((c, i) => (
          <span key={c.id} style={styles.crumbSeg}>
            <ChevronRight size={12} color="#C7C7CC" />
            <button
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
          style={styles.upBtn}
          onClick={() => {
            const parent = storageManager.getItem(currentId)?.parentId;
            if (parent) setCurrentId(parent);
          }}
        >
          <ArrowUp size={15} color="#007AFF" /> Subir nivel
        </button>
      )}

      <div style={styles.list}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <HardDrive size={40} color="#E5E5EA" />
            <div style={styles.emptyText}>Carpeta vacía</div>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              style={styles.row}
              onClick={() => open(item)}
              onContextMenu={e => {
                e.preventDefault();
                setMenuFor(item.id);
              }}
            >
              {iconFor(item)}
              <div style={styles.rowMain}>
                <div style={styles.rowName}>{item.name}</div>
                <div style={styles.rowMeta}>
                  {item.type === 'folder'
                    ? 'Carpeta'
                    : `${item.mimeType ?? 'Archivo'} · ${formatSize(item.size)}`}
                </div>
              </div>
              <button
                style={styles.menuBtn}
                onClick={e => {
                  e.stopPropagation();
                  setMenuFor(menuFor === item.id ? null : item.id);
                }}
                aria-label="Opciones"
              >
                <Trash2 size={16} color="#FF3B30" />
              </button>
              {menuFor === item.id && (
                <div style={styles.menu}>
                  {item.type === 'file' && isImageItem(item) && item.content && (
                    <button
                      style={styles.menuAction}
                      onClick={() => {
                        useSystemStore.getState().setWallpaper(item.content!);
                        setMenuFor(null);
                      }}
                    >
                      <ImageIcon size={14} color="#007AFF" /> Usar como fondo
                    </button>
                  )}
                  <button style={styles.menuItem} onClick={() => { remove(item.id); setMenuFor(null); }}>
                    <Trash2 size={14} color="#FF3B30" /> Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.storageBar}>
        <div style={styles.storageText}>
          <span>{formatSize(getUsed())} usados de {formatSize(getTotal())}</span>
          <span>{Math.max(0, Math.round(storageManager.getUsagePercent()))}%</span>
        </div>
        <div style={styles.barTrack}>
          <div
            style={{
              ...styles.barFill,
              width: `${Math.min(100, storageManager.getUsagePercent())}%`,
            }}
          />
        </div>
      </div>

      {preview && preview.content && (
        <div style={styles.lightbox} onClick={() => setPreview(null)}>
          <div style={styles.lbTop}>
            <span style={styles.lbName}>{preview.name}</span>
            <button
              style={styles.lbAction}
              onClick={e => {
                e.stopPropagation();
                useSystemStore.getState().setWallpaper(preview.content!);
                setPreview(null);
              }}
            >
              <ImageIcon size={16} color="#fff" /> Usar como fondo
            </button>
            <button style={styles.lbClose} onClick={() => setPreview(null)} aria-label="Cerrar">
              X
            </button>
          </div>
          <div style={styles.lbImgBox} onClick={e => e.stopPropagation()}>
            <img src={preview.content} alt={preview.name} style={styles.lbImg} />
          </div>
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
    background: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px 0',
  },
  title: { fontSize: 20, fontWeight: 700, color: '#111' },
  headerBtns: { display: 'flex', gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'rgba(0,122,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    margin: '10px 14px 6px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#F2F2F7',
    borderRadius: 12,
    padding: '0 12px',
    height: 36,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: 13,
    color: '#111',
  },
  crumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '4px 14px',
    overflowX: 'auto',
    flexWrap: 'nowrap' as const,
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
    fontSize: 12,
    color: '#007AFF',
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
    background: 'rgba(0,122,255,0.08)',
    color: '#007AFF',
    fontSize: 13,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  list: { flex: 1, overflowY: 'auto', padding: '0 0 10px' },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    cursor: 'pointer',
    position: 'relative',
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, color: '#111', fontWeight: 500 },
  rowMeta: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  menuBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menu: {
    position: 'absolute',
    right: 14,
    top: 40,
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
    padding: 6,
    zIndex: 20,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: 'none',
    background: 'none',
    padding: '8px 12px',
    fontSize: 13,
    color: '#FF3B30',
    cursor: 'pointer',
    borderRadius: 6,
    width: '100%',
  },
  storageBar: { padding: '10px 14px 14px', background: '#fff' },
  storageText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    background: '#E5E5EA',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    background: '#007AFF',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: '60%',
  },
  emptyText: { color: '#C7C7CC', fontSize: 13 },
  menuAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: 'none',
    background: 'none',
    padding: '8px 12px',
    fontSize: 13,
    color: '#007AFF',
    cursor: 'pointer',
    borderRadius: 6,
    width: '100%',
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