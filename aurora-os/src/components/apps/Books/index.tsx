import { useState, useEffect } from 'react';
import { BookOpen, Search, X, ChevronLeft, ExternalLink, Loader2 } from 'lucide-react';
import { searchBooks, type Book } from '../../../core/books';
import { Screen, AppHeader, Button, Chip } from '../../ui';

export default function Books() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setBooks([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchBooks(q);
      setBooks(res);
      setSearched(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void runSearch('Costa Rica');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (openBook) {
    return (
      <Screen scroll={false} padding="0">
        <AppHeader
          variant="standard"
          title="Detalle"
          onBack={() => setOpenBook(null)}
          backLabel=""
        />
        <div style={styles.detailScroll}>
          <div style={styles.detailTop}>
            <div style={styles.coverLarge}>
              {openBook.thumbnail ? (
                <img src={openBook.thumbnail} alt={openBook.title} className="no-invert" style={styles.coverImgLg} />
              ) : (
                <BookOpen size={34} color="#fff" />
              )}
            </div>
            <div style={styles.detailMain}>
              <div style={styles.bookTitle}>{openBook.title}</div>
              <div style={styles.bookAuthor}>{openBook.authors.join(', ') || 'Anónimo'}</div>
              <div style={styles.bookMeta}>
                {openBook.publishedDate} · {openBook.pageCount > 0 ? `${openBook.pageCount} págs` : ''}
              </div>
              {openBook.categories.length > 0 && (
                <div style={styles.genreChipWrap}><Chip label={openBook.categories[0]} /></div>
              )}
            </div>
          </div>
          {openBook.description ? (
            <p style={styles.desc}>{openBook.description}</p>
          ) : (
            <p style={styles.descSub}>Sin descripción disponible.</p>
          )}
          {openBook.previewLink && (
            <Button
              style={styles.openBtn}
              onClick={() => window.open(openBook.previewLink, '_blank', 'noopener')}
            >
              <ExternalLink size={14} /> Ver en Google Books
            </Button>
          )}
          <div style={{ height: 30 }} />
        </div>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding="0">
      <AppHeader title="Libros" />

      <div style={styles.searchRow}>
        <div style={styles.searchBox}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void runSearch(query); }}
            placeholder="Buscar título o autor…"
            style={styles.searchInput}
          />
          {query && (
            <button className="pressable" style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
              <X size={14} color="var(--text-secondary)" />
            </button>
          )}
          <button className="pressable" style={styles.searchBtn} onClick={() => void runSearch(query)}>Buscar</button>
        </div>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.centerBox}>
            <Loader2 size={26} color="var(--accent)" className="spin" />
            <span style={styles.centerText}>Buscando en Google Books…</span>
          </div>
        ) : error ? (
          <div style={styles.centerBox}><span style={styles.centerTextRed}>{error}</span></div>
        ) : books.length === 0 ? (
          <div style={styles.centerBox}>
            <BookOpen size={40} color="var(--bg-tertiary)" />
            <span style={styles.centerText}>
              {searched ? 'Sin resultados.' : 'Busca tu próxima lectura.'}
            </span>
          </div>
        ) : (
          books.map(b => (
            <button key={b.id} className="pressable" style={styles.bookCard} onClick={() => setOpenBook(b)}>
              <div style={styles.cover}>
                {b.thumbnail ? (
                  <img src={b.thumbnail} alt={b.title} className="no-invert" style={styles.coverImg} />
                ) : (
                  <BookOpen size={22} color="#fff" />
                )}
              </div>
              <div style={styles.bookMain}>
                <div style={styles.bookTitle}>{b.title}</div>
                <div style={styles.bookAuthor}>{b.authors.join(', ') || 'Anónimo'}</div>
                <div style={styles.bookMeta}>
                  {[b.publishedDate, b.pageCount > 0 ? `${b.pageCount} págs` : '', b.categories[0]]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <ChevronLeft size={18} color="var(--text-tertiary)" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  searchRow: { padding: '10px 16px 4px', flexShrink: 0 },
  searchBox: {
    height: 38,
    borderRadius: 12,
    background: 'var(--surface-input)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 8px 0 14px',
  },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', background: 'none', minWidth: 0, fontFamily: 'inherit', userSelect: 'text' as const },
  clearBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  searchBtn: {
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    padding: '7px 12px',
    borderRadius: 14,
    cursor: 'pointer',
    flexShrink: 0,
  },
  list: { flex: 1, overflowY: 'auto', padding: '0 16px 20px' },
  centerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '60px 0',
    textAlign: 'center' as const,
  },
  centerText: { fontSize: 13, color: 'var(--text-secondary)' },
  centerTextRed: { fontSize: 13, color: 'var(--danger)' },
  bookCard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '13px 0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderBottom: '0.5px solid var(--separator-cell)',
    textAlign: 'left' as const,
  },
  cover: {
    width: 56,
    height: 80,
    borderRadius: 8,
    background: 'linear-gradient(150deg, #5856D6 0%, #AF52DE 50%, #FF2D55 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
  },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  coverImgLg: { width: 108, height: 154, objectFit: 'cover' as const, borderRadius: 10 },
  coverLarge: {
    width: 108,
    height: 154,
    borderRadius: 10,
    background: 'linear-gradient(150deg, #5856D6, #AF52DE)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
  },
  bookMain: { flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 },
  bookAuthor: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 },
  bookMeta: { fontSize: 12, color: 'var(--accent)', marginTop: 5 },
  genreChipWrap: { marginTop: 8 },
  detailScroll: { flex: 1, overflowY: 'auto', padding: '18px 20px' },
  detailTop: { display: 'flex', gap: 16 },
  detailMain: { flex: 1, minWidth: 0 },
  desc: { fontSize: 15, lineHeight: 1.65, color: 'var(--text-primary)', marginTop: 20 },
  descSub: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 20 },
  openBtn: {
    marginTop: 22,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
};