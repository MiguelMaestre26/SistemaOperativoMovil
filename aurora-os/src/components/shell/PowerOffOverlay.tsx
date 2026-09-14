export default function PowerOffOverlay() {
  return (
    <div style={styles.overlay}>
      <div style={styles.pillLeft} />
      <div style={styles.pillRight} />
      <span style={styles.hint}>Mantén pulsado el botón de encendido para iniciar</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 46,
    overflow: 'hidden',
    background: '#000',
    zIndex: 9700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLeft: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'rgba(255,69,58,0.08)',
    filter: 'blur(30px)',
  },
  pillRight: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: '50%',
    background: 'rgba(48,209,88,0.07)',
    filter: 'blur(30px)',
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center' as const,
    maxWidth: 220,
    lineHeight: 1.5,
  },
};