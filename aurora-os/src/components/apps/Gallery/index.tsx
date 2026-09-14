import { useState } from 'react';
import { Trash2, X, ChevronLeft, ChevronRight, Image as ImageIcon, Play } from 'lucide-react';
import { useMediaStore, isColorUri } from '../../../stores/useMediaStore';
import { useSystemStore } from '../../../stores/useSystemStore';
import { Screen, AppHeader, IconButton, EmptyState } from '../../ui';

export default function Gallery() {
  const photos = useMediaStore(s => s.photos);
  const removePhoto = useMediaStore(s => s.removePhoto);
  const [selected, setSelected] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <Screen scroll={false} padding="0">
        <AppHeader title="Fotos" />
        <EmptyState
          icon={<ImageIcon size={26} color="var(--text-secondary)" />}
          title="No hay fotos todavía."
          subtitle="Abre la Cámara y captura algunas."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding="0">
      <AppHeader
        title="Fotos"
        right={
          <div style={styles.countWrap}>
            <span style={styles.count}>{photos.length}</span>
          </div>
        }
      />
      <div style={styles.grid}>
        {photos.map((p, i) => (
          <button key={p.id} className="pressable" style={styles.tileWrap} onClick={() => setSelected(i)}>
            {p.type === 'video' ? (
              <div
                style={{
                  ...styles.tile,
                  background: p.thumbnail ? `url(${p.thumbnail}) center/cover` : 'var(--bg-tertiary)',
                }}
              >
                <div style={styles.playBadge}>
                  <Play size={18} color="#fff" />
                </div>
              </div>
            ) : (
              <div
                style={{
                  ...styles.tile,
                  background: isColorUri(p.uri) ? p.uri : 'var(--bg-tertiary)',
                }}
              >
                {!isColorUri(p.uri) && <img src={p.uri} alt={p.caption} className="no-invert" style={styles.tileImg} />}
              </div>
            )}
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
              <span onClick={e => e.stopPropagation()}>
                <IconButton
                  label="Usar como fondo de pantalla"
                  bg="rgba(255,255,255,0.15)"
                  color="#34C759"
                  size={34}
                  onClick={() => useSystemStore.getState().setWallpaper(photos[selected].uri)}
                >
                  <ImageIcon size={18} />
                </IconButton>
              </span>
              <span onClick={e => e.stopPropagation()}>
                <IconButton
                  label="Eliminar"
                  bg="rgba(255,255,255,0.15)"
                  color="#fff"
                  size={34}
                  onClick={() => {
                    removePhoto(photos[selected].id);
                    setSelected(prev => (prev === null ? null : Math.min(Math.max(prev, 0), photos.length - 2)));
                  }}
                >
                  <Trash2 size={18} />
                </IconButton>
              </span>
            </div>
          </div>
          <div
            style={styles.lbImgBox}
            onClick={e => e.stopPropagation()}
          >
            {photos[selected].type === 'video' ? (
              photos[selected].thumbnail ? (
                <video src={photos[selected].uri} poster={photos[selected].thumbnail} controls autoPlay style={styles.lbVideo} />
              ) : (
                <video src={photos[selected].uri} controls style={styles.lbVideo} />
              )
            ) : isColorUri(photos[selected].uri) ? (
              <div style={{ width: '100%', height: '100%', background: photos[selected].uri }} />
            ) : (
              <img src={photos[selected].uri} alt={photos[selected].caption} className="no-invert" style={styles.lbImg} />
            )}
          </div>
          <div style={styles.lbNav}>
            <span onClick={e => e.stopPropagation()}>
              <IconButton
                label="Anterior"
                bg="rgba(255,255,255,0.15)"
                color="#fff"
                size={36}
                style={{ opacity: selected === 0 ? 0.4 : 1 }}
                onClick={() => setSelected(s => Math.max(0, (s ?? 0) - 1))}
              >
                <ChevronLeft size={22} />
              </IconButton>
            </span>
            <IconButton
              label="Cerrar"
              bg="rgba(255,255,255,0.25)"
              color="#fff"
              size={42}
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </IconButton>
            <span onClick={e => e.stopPropagation()}>
              <IconButton
                label="Siguiente"
                bg="rgba(255,255,255,0.15)"
                color="#fff"
                size={36}
                style={{ opacity: selected >= photos.length - 1 ? 0.4 : 1 }}
                onClick={() => setSelected(s => Math.min(photos.length - 1, (s ?? 0) + 1))}
              >
                <ChevronRight size={22} />
              </IconButton>
            </span>
          </div>
        </div>
      )}
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  countWrap: { minWidth: 44 },
  count: { fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' },
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
    position: 'relative' as const,
  },
  tileImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 34,
    height: 34,
    borderRadius: 17,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  lbImgBox: { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lbImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const },
  lbVideo: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const },
  lbNav: {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '18px 0 24px',
  },
};