import { useState } from 'react';
import { Trash2, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useMediaStore, isColorUri } from '../../../stores/useMediaStore';
import { useSystemStore } from '../../../stores/useSystemStore';

export default function Gallery() {
  const photos = useMediaStore(s => s.photos);
  const removePhoto = useMediaStore(s => s.removePhoto);
  const [selected, setSelected] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>🖼️</div>
        <div style={styles.emptyText}>No hay fotos todavía.<br />Abre la Cámara y captura algunas.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Fotos</span>
        <span style={styles.count}>{photos.length}</span>
      </div>
      <div style={styles.grid}>
        {photos.map((p, i) => (
          <button key={p.id} style={styles.tileWrap} onClick={() => setSelected(i)}>
            <div
              style={{
                ...styles.tile,
                background: isColorUri(p.uri) ? p.uri : '#e5e5ea',
              }}
            >
              {!isColorUri(p.uri) && <img src={p.uri} alt={p.caption} style={styles.tileImg} />}
            </div>
          </button>
        ))}
      </div>

      {selected !== null && photos[selected] && (
        <div
          style={styles.lightbox}
          onClick={() => setSelected(null)}
        >
          <div style={styles.lbTop}>
            <span style={styles.caption}>{photos[selected].caption}</span>
            <div style={styles.lbTopBtns}>
              <button
                style={styles.lbBtn}
                onClick={e => {
                  e.stopPropagation();
                  useSystemStore.getState().setWallpaper(photos[selected].uri);
                }}
                aria-label="Usar como fondo de pantalla"
                title="Usar como fondo de pantalla"
              >
                <ImageIcon size={18} color="#34C759" />
              </button>
              <button
                style={styles.lbBtn}
                onClick={e => {
                  e.stopPropagation();
                  removePhoto(photos[selected].id);
                  setSelected(prev => (prev === null ? null : Math.min(Math.max(prev, 0), photos.length - 2)));
                }}
                aria-label="Eliminar"
              >
                <Trash2 size={18} color="#fff" />
              </button>
            </div>
          </div>
          <div
            style={styles.lbImgBox}
            onClick={e => e.stopPropagation()}
          >
            {isColorUri(photos[selected].uri) ? (
              <div style={{ width: '100%', height: '100%', background: photos[selected].uri }} />
            ) : (
              <img src={photos[selected].uri} alt={photos[selected].caption} style={styles.lbImg} />
            )}
          </div>
          <div style={styles.lbNav}>
            <button
              style={styles.lbBtn}
              disabled={selected === 0}
              onClick={e => {
                e.stopPropagation();
                setSelected(s => Math.max(0, (s ?? 0) - 1));
              }}
            >
              <ChevronLeft size={22} color="#fff" />
            </button>
            <button
              style={styles.lbClose}
              onClick={() => setSelected(null)}
            >
              <X size={20} color="#fff" />
            </button>
            <button
              style={styles.lbBtn}
              disabled={selected >= photos.length - 1}
              onClick={e => {
                e.stopPropagation();
                setSelected(s => Math.min(photos.length - 1, (s ?? 0) + 1));
              }}
            >
              <ChevronRight size={22} color="#fff" />
            </button>
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
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    fontSize: 20,
    fontWeight: 700,
    color: '#111',
  },
  count: { fontSize: 14, fontWeight: 400, color: '#8E8E93' },
  grid: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 2,
    padding: '0 2px 20px',
  },
  tileWrap: { border: 'none', padding: 0, background: 'none', cursor: 'pointer' },
  tile: {
    aspectRatio: '1 / 1',
    width: '100%',
    overflow: 'hidden',
  },
  tileImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  empty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: '#fff',
  },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center' as const, lineHeight: 1.5 },
  lightbox: {
    position: 'absolute',
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
    padding: '14px 16px',
  },
  caption: { color: '#fff', fontSize: 14, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  lbTopBtns: { display: 'flex', gap: 10, alignItems: 'center' },
  lbBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    width: 34,
    height: 34,
    borderRadius: 17,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  lbClose: {
    background: 'rgba(255,255,255,0.25)',
    border: 'none',
    width: 42,
    height: 42,
    borderRadius: 21,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lbImgBox: { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lbImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const },
  lbNav: {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '18px 0 24px',
  },
};