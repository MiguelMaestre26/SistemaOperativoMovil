import { useState } from 'react';
import { ChevronLeft, Pencil, Trash2, Minus, Plus } from 'lucide-react';
import { useHomeStore } from '../../stores/useHomeStore';
import { useAppStore } from '../../stores/useAppStore';
import { getAppIcon, ALL_APPS } from './Launcher';
import { openConfirm } from '../ui/dialogs';

interface FolderViewProps {
  folderId: string;
  onClose: () => void;
}

export default function FolderView({ folderId, onClose }: FolderViewProps) {
  const folder = useHomeStore(s => s.folders[folderId]);
  const removeFromFolder = useHomeStore(s => s.removeFromFolder);
  const deleteFolder = useHomeStore(s => s.deleteFolder);
  const renameFolder = useHomeStore(s => s.renameFolder);
  const openApp = useAppStore(s => s.openApp);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (!folder) return null;

  const apps = folder.apps
    .map(id => ALL_APPS.find(a => a.id === id))
    .filter((a): a is (typeof ALL_APPS)[number] => Boolean(a));

  const startRename = () => {
    setNameDraft(folder.name);
    setEditingName(true);
  };

  const commitRename = () => {
    const value = nameDraft.trim();
    if (value) renameFolder(folderId, value);
    setEditingName(false);
  };

  const onRemove = async (appId: string) => {
    const remaining = folder.apps.filter(a => a !== appId);
    if (remaining.length === 0) {
      const ok = await openConfirm({
        title: 'Mover la aplicación',
        message: `"${ALL_APPS.find(a => a.id === appId)?.name ?? appId}" fue la única aplicación de la carpeta. La carpeta se eliminará.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        destructive: true,
      });
      if (ok) {
        deleteFolder(folderId);
        onClose();
      }
    } else {
      removeFromFolder(appId, folderId);
    }
  };

  const onDeleteFolder = async () => {
    const ok = await openConfirm({
      title: 'Eliminar carpeta',
      message: `¿Eliminar "${folder.name}"? Sus aplicaciones volverán a la pantalla de inicio.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (ok) {
      deleteFolder(folderId);
      onClose();
    }
  };

  return (
    <div
      style={styles.root}
      onPointerDown={e => e.stopPropagation()}
      onPointerMove={e => e.stopPropagation()}
      onPointerUp={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            className="pressable"
            style={styles.backBtn}
            onClick={onClose}
            aria-label="Volver"
          >
            <ChevronLeft size={24} color="var(--primary)" />
          </button>
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              maxLength={24}
              onChange={e => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingName(false);
              }}
              style={styles.nameInput}
            />
          ) : (
            <div style={styles.headerTitle}>{folder.name}</div>
          )}
          <button
            className="pressable"
            style={styles.iconBtn}
            onClick={editingName ? commitRename : startRename}
            aria-label="Renombrar carpeta"
          >
            <Pencil size={17} color="var(--primary)" />
          </button>
        </div>
        <button
          className="pressable"
          style={styles.iconBtn}
          onClick={onDeleteFolder}
          aria-label="Eliminar carpeta"
        >
          <Trash2 size={18} color="var(--danger)" />
        </button>
      </div>

      {/* Count */}
      <div style={styles.subtitle}>
        {folder.apps.length} {folder.apps.length === 1 ? 'aplicación' : 'aplicaciones'} · arma tus carpetas
      </div>

      {/* Create folder tip */}
      {folder.apps.length < 2 && (
        <div style={styles.tip}>
          <Plus size={14} />
          <span>Arrastra otra aplicación sobre esta carpeta en la pantalla de inicio para añadirla.</span>
        </div>
      )}

      {/* Apps grid */}
      <div style={styles.grid}>
        {apps.length > 0 ? (
          apps.map(app => (
            <div key={app.id} style={styles.appItem}>
              <div style={styles.iconWrap}>
                <button
                  className="pressable"
                  style={styles.appButton}
                  onClick={() => openApp(app.id)}
                >
                  <div style={{ ...styles.appIcon, background: app.color }}>
                    {getAppIcon(app.icon)}
                  </div>
                </button>
                <button
                  className="pressable"
                  style={styles.removeBadge}
                  onClick={() => void onRemove(app.id)}
                  aria-label={`Quitar ${app.name} de la carpeta`}
                >
                  <Minus size={11} color="#fff" />
                </button>
              </div>
              <span style={styles.appName}>{app.name}</span>
            </div>
          ))
        ) : (
          <div style={styles.empty}>La carpeta está vacía.</div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute',
    inset: 0,
    background: 'var(--surface-container-low)',
    zIndex: 90,
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 16px 0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '8px 0 4px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flex: 1,
  },
  backBtn: {
    background: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    borderRadius: 999,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    background: 'var(--surface-container-high)',
    border: '1px solid var(--primary)',
    borderRadius: 10,
    padding: '6px 10px',
    color: 'var(--text-primary)',
    fontSize: 17,
    fontWeight: 700,
    fontFamily: 'inherit',
    outline: 'none',
  },
  iconBtn: {
    background: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    borderRadius: 999,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    margin: '6px 0 10px',
  },
  tip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--text-secondary)',
    background: 'var(--surface-container-high)',
    border: '1px solid var(--outline-variant)',
    borderRadius: 12,
    padding: '8px 10px',
    marginBottom: 8,
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 18,
    alignContent: 'start',
    padding: '4px 0 90px',
  },
  appItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  },
  iconWrap: {
    position: 'relative' as const,
  },
  appButton: {
    border: 'none',
    background: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: '24%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  removeBadge: {
    position: 'absolute' as const,
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 999,
    background: 'var(--danger)',
    border: '2px solid var(--surface-container-low)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  appName: {
    fontSize: 11,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    maxWidth: 72,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: 14,
    padding: '40px 0',
  },
};