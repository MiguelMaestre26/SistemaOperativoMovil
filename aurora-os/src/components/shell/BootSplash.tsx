export default function BootSplash() {
  return (
    <div style={styles.overlay}>
      <div style={styles.logo} className="boot-glow">
        <div style={styles.logoCore} />
      </div>
      <div style={styles.brand}>AuroraOS</div>
      <div style={styles.shine} />
      <div style={styles.loadingDots}>
        <span style={styles.dot} />
        <span style={styles.dot} />
        <span style={styles.dot} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 46,
    overflow: 'hidden',
    background: '#05050a',
    zIndex: 9650,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 28,
    background: 'linear-gradient(135deg, #30cfd0 0%, #7f7fd5 55%, #ff6ec4 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 60px rgba(127,127,213,0.55)',
  },
  logoCore: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.92)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#fff',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: '-60%',
    width: '60%',
    height: '100%',
    background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.08), transparent)',
  },
  loadingDots: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)',
    animation: 'bootGlow 1.2s ease-in-out infinite',
  },
};