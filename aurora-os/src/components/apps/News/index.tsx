import { useState, useEffect } from 'react';
import { Newspaper, ChevronLeft, ExternalLink, Star, Globe, Wifi } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';

interface Article {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  at: string;
}

const SOURCES = [
  { id: 'bbcmundo', name: 'BBC Mundo', rss: 'https://feeds.bbci.co.uk/mundo/rss.xml' },
  { id: 'elpais', name: 'El País', rss: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada' },
  { id: 'nacion', name: 'La Nación', rss: 'https://www.nacion.com/arc/outboundfeeds/rss/?outputType=xml' },
];

interface OfflineSource {
  title: string;
  body: string;
  source: string;
}

const OFFLINE: OfflineSource[] = [
  { title: 'IA en el aula: estudiantes y docentes negocian nuevas reglas', source: 'BBC Mundo', body: 'Universidades de la región implementan guías para el uso responsable de herramientas de inteligencia artificial en trabajos académicos. Los centros coinciden en que la supervisión docente sigue siendo clave y que la tecnología debe verse como un recurso de consulta, no de sustitución.' },
  { title: 'Red de transporte limpio anuncia expansión a más cantones', source: 'El País', body: 'El plan contempla sumar decenas de nuevas rutas eléctricas en los próximos meses. Las autoridades indican que la primera fase de la red registró un aumento sostenido de pasajeros y que las tarifas se mantendrán sin cambios durante el trimestre.' },
  { title: 'Feria del libro abre con novedades para todas las edades', source: 'La Nación', body: 'La cita cultural reúne a editoriales independientes, escritores y narradores. Los organizadores estiman una asistencia superior a la de ediciones anteriores y destacan la participación de clubes de lectura y talleres infantiles.' },
  { title: 'Caficultores apuestan por prácticas de bajo impacto ambiental', source: 'BBC Mundo', body: 'Cooperativas del Valle Central presentan un programa de renovación de cafetales con sombra y manejo integrado del suelo. La iniciativa busca mejorar la calidad del grano y reducir el uso de agroquímicos hacia el próximo ciclo.' },
  { title: 'Copa local: los cuartos de final definen sus cruces', source: 'La Nación', body: 'La última jornada de la fase de grupos dejó definidos los enfrentamientos de cuartos. Los favoritos deberán medirse ante rivales que han mostrado solidez en defensa. Los boletos salen a la venta este fin de semana.' },
  { title: 'Tipos de cambio estables en la apertura de la semana', source: 'El País', body: 'El mercado cambiario abrió sin sobresaltos y con baja volatilidad. Los analistas atribuyen la calma a la entrada de divisas por exportaciones y turismo, y prevén un movimiento moderado en los próximos días.' },
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 420);
}

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [favs, setFavs] = usePersistedState<string[]>('news:favorites', []);
  const [read, setRead] = usePersistedState<string[]>('news:read', []);
  const [source, setSource] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        SOURCES.map(async s => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 7000);
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(s.rss)}&count=15`, {
              signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error('rss failed');
            const data = await res.json();
            if (data?.status !== 'ok' || !Array.isArray(data.items)) throw new Error('bad rss');
            return data.items.map((it: Record<string, unknown>, i: number) => ({
              id: `${s.id}_${i}_${String(it.pubDate ?? it.title ?? '').slice(0, 12)}`,
              title: String(it.title ?? '').replace(/&#8217;|&#39;/g, "'"),
              body: stripHtml(String(it.description ?? '')),
              source: s.name,
              url: String(it.link ?? ''),
              at: String(it.pubDate ?? ''),
            }));
          } catch {
            return [];
          }
        }),
      );
      const merged = results.flat().filter(a => a.title);
      if (merged.length > 0) {
        setArticles(merged as Article[]);
        setLive(true);
      } else {
        setArticles(OFFLINE.map((o, i) => ({ id: `off_${i}`, title: o.title, body: o.body, source: o.source, url: '', at: '' })));
        setLive(false);
      }
    } catch {
      setArticles(OFFLINE.map((o, i) => ({ id: `off_${i}`, title: o.title, body: o.body, source: o.source, url: '', at: '' })));
      setLive(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const viewed = articles.filter(a => (source === null || a.source === source) && !favs.includes(a.id));
  const favList = articles.filter(a => favs.includes(a.id));

  const open = (id: string) => {
    setOpenId(id);
    setRead(r => (r.includes(id) ? r : [...r, id]));
  };

  const art = articles.find(a => a.id === openId) ?? null;

  if (art) {
    return (
      <div style={styles.container}>
        <div style={styles.msgHeader}>
          <button style={styles.iconBtn} onClick={() => setOpenId(null)} aria-label="Volver">
            <ChevronLeft size={22} color="#007AFF" />
          </button>
          <span style={styles.brand}>{art.source}</span>
          <button
            style={styles.iconBtn}
            onClick={() => setFavs(fs => (fs.includes(art.id) ? fs.filter(x => x !== art.id) : [...fs, art.id]))}
            aria-label="Favorito"
          >
            <Star size={18} color={favs.includes(art.id) ? '#FFD700' : '#8E8E93'} fill={favs.includes(art.id) ? '#FFD700' : 'none'} />
          </button>
        </div>
        <div style={styles.artScroll}>
          <div style={styles.artSource}>{art.source}</div>
          <h1 style={styles.artTitle}>{art.title}</h1>
          <div style={styles.artDate}>{art.at}</div>
          <p style={styles.artBody}>{art.body}</p>
          {art.url && (
            <button style={styles.openBtn} onClick={() => window.open(art.url, '_blank', 'noopener')}>
              <ExternalLink size={14} color="#fff" /> Abrir original
            </button>
          )}
          <div style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Newspaper size={20} color="#FF2D55" />
        <span style={styles.title}>Noticias</span>
        {live && <Globe size={16} color="#34C759" style={{ marginLeft: 'auto' }} />}
      </div>

      <div style={styles.tabsRow}>
        <button style={{ ...styles.tab, ...(source === null ? styles.tabActive : {}) }} onClick={() => setSource(null)}>
          Todas
        </button>
        {SOURCES.map(s => (
          <button key={s.id} style={{ ...styles.tab, ...(source === s.name ? styles.tabActive : {}) }} onClick={() => setSource(s.name)}>
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {live ? (
          <div style={styles.statusRow}>
            <Wifi size={12} color="#34C759" /> En vivo · fuentes RSS
          </div>
        ) : (
          <div style={styles.statusRow}>
            <Globe size={12} color="#FF9500" /> Sin conexión · edición local
          </div>
        )}
      </div>

      <div style={styles.feed}>
        {loading ? (
          <div style={styles.emptyTxt}>Cargando noticias…</div>
        ) : (
          <>
            {favList.length > 0 && (
              <>
                <div style={styles.sectionLabel}>Favoritos</div>
                {favList.map(a => renderItem(a))}
              </>
            )}
            <div style={styles.sectionLabel}>Últimas {source ?? 'noticias'}</div>
            {viewed.map(a => renderItem(a))}
            {viewed.length === 0 && favList.length === 0 && (
              <div style={styles.emptyTxt}>Sin artículos en esta sección.</div>
            )}
          </>
        )}
      </div>
    </div>
  );

  function renderItem(a: Article) {
    const isFav = favs.includes(a.id);
    return (
      <button key={a.id} style={styles.item} onClick={() => open(a.id)}>
        <div style={styles.itemMain}>
          <div style={styles.itemTop}>
            <span style={styles.itemSource}>{a.source}</span>
            <div style={styles.itemTitleRow}>
              {!read.includes(a.id) && <span style={styles.dot} />}
              <span style={styles.itemTitle}>{a.title}</span>
            </div>
          </div>
          <div style={styles.itemBody}>{a.body}</div>
          <div style={styles.itemBottom}>
            {isFav && <Star size={11} color="#FFD700" fill="#FFD700" />}
          </div>
        </div>
      </button>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 6px' },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  tabsRow: { display: 'flex', gap: 8, padding: '8px 16px 4px', overflowX: 'auto' },
  tab: {
    padding: '7px 14px',
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'none',
    color: '#111',
    fontSize: 13,
    cursor: 'pointer',
    flexShrink: 0,
  },
  tabActive: { background: '#FF2D55', borderColor: '#FF2D55', color: '#fff' },
  statusRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8E8E93', padding: '6px 0' },
  feed: { flex: 1, overflowY: 'auto', padding: '0 16px 20px' },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#8E8E93',
    padding: '14px 0 6px',
    fontWeight: 600,
  },
  item: {
    width: '100%',
    border: 'none',
    background: '#F7F7F9',
    borderRadius: 14,
    padding: '13px 14px',
    marginBottom: 10,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  itemMain: { minWidth: 0 },
  itemTop: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
  itemSource: { fontSize: 11, color: '#FF2D55', fontWeight: 700, textTransform: 'uppercase' as const },
  itemTitleRow: { display: 'flex', alignItems: 'flex-start', gap: 6 },
  itemTitle: { fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.3 },
  dot: { width: 8, height: 8, borderRadius: 4, background: '#FF2D55', flexShrink: 0, marginTop: 5 },
  itemBody: {
    fontSize: 13,
    color: '#6E6E73',
    marginTop: 6,
    lineHeight: 1.5,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  itemBottom: { display: 'flex', gap: 6, marginTop: 8, minHeight: 12 },
  emptyTxt: { color: '#C7C7CC', fontSize: 14, textAlign: 'center' as const, padding: '40px 0' },
  msgHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 14, fontWeight: 600, color: '#111' },
  artScroll: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  artSource: { fontSize: 12, color: '#FF2D55', fontWeight: 700, textTransform: 'uppercase' as const },
  artTitle: { fontSize: 24, fontWeight: 700, color: '#111', lineHeight: 1.3, marginTop: 8 },
  artDate: { fontSize: 12, color: '#8E8E93', marginTop: 10 },
  artBody: {
    fontSize: 16,
    lineHeight: 1.7,
    color: '#333',
    marginTop: 18,
    textAlign: 'justify' as const,
  },
  openBtn: {
    marginTop: 22,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '11px 18px',
    borderRadius: 22,
    border: 'none',
    background: '#FF2D55',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};