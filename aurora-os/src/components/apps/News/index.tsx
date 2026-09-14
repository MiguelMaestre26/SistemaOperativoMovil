import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Star, Globe, Wifi } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import {
  Screen, AppHeader, ListSection, ListRow, Chip, Button, IconButton, EmptyState, Skeleton,
} from '../../ui';

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
      <Screen scroll={false} padding="0">
        <AppHeader
          variant="standard"
          title={art.source}
          onBack={() => setOpenId(null)}
          backLabel=""
          right={
            <IconButton
              label="Favorito"
              bg="transparent"
              onClick={() => setFavs(fs => (fs.includes(art.id) ? fs.filter(x => x !== art.id) : [...fs, art.id]))}
            >
              <Star size={18} color={favs.includes(art.id) ? '#FFD700' : 'var(--text-tertiary)'} fill={favs.includes(art.id) ? '#FFD700' : 'none'} />
            </IconButton>
          }
        />
        <div style={styles.artScroll}>
          <div style={styles.artSource}>{art.source}</div>
          <h1 style={styles.artTitle}>{art.title}</h1>
          <div style={styles.artDate}>{art.at}</div>
          <p style={styles.artBody}>{art.body}</p>
          {art.url && (
            <Button
              variant="primary"
              onClick={() => window.open(art.url, '_blank', 'noopener')}
              style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 8, background: '#FF2D55' }}
            >
              <ExternalLink size={14} color="#fff" /> Abrir original
            </Button>
          )}
          <div style={{ height: 40 }} />
        </div>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding="0">
      <AppHeader
        title="Noticias"
        right={live ? <Globe size={16} color="var(--success)" /> : undefined}
      />

      <div style={styles.tabsRow}>
        <Chip label="Todas" active={source === null} onClick={() => setSource(null)} />
        {SOURCES.map(s => (
          <Chip key={s.id} label={s.name} active={source === s.name} onClick={() => setSource(s.name)} />
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {live ? (
          <div style={styles.statusRow}>
            <Wifi size={12} color="var(--success)" /> En vivo · fuentes RSS
          </div>
        ) : (
          <div style={styles.statusRow}>
            <Globe size={12} color="#FF9500" /> Sin conexión · edición local
          </div>
        )}
      </div>

      <div style={styles.feed}>
        {loading ? (
          <div style={styles.skeletonList}>
            <Skeleton height={104} radius={14} />
            <Skeleton height={104} radius={14} />
            <Skeleton height={104} radius={14} />
          </div>
        ) : (
          <>
            {favList.length > 0 && (
              <ListSection title="Favoritos">
                {favList.map(a => renderItem(a))}
              </ListSection>
            )}
            <ListSection title={`Últimas ${source ?? 'noticias'}`}>
              {viewed.map(a => renderItem(a))}
              {viewed.length === 0 && favList.length === 0 && (
                <EmptyState
                  icon={<Newspaper size={26} color="var(--text-secondary)" />}
                  title="Sin artículos en esta sección."
                />
              )}
            </ListSection>
          </>
        )}
      </div>
    </Screen>
  );

  function renderItem(a: Article) {
    const isFav = favs.includes(a.id);
    return (
      <ListRow
        key={a.id}
        icon={<Avatar source={a.source} />}
        label={a.title}
        sublabel={a.body}
        onClick={() => open(a.id)}
        value={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!read.includes(a.id) && <span style={styles.dot} />}
            {isFav && <Star size={12} color="#FFD700" fill="#FFD700" />}
          </span>
        }
      />
    );
  }
}

function Avatar({ source }: { source: string }) {
  const initials = source.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)',
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabsRow: { display: 'flex', gap: 8, padding: '8px 16px 6px', overflowX: 'auto', flexShrink: 0 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', padding: '6px 0' },
  feed: { flex: 1, overflowY: 'auto', padding: '0 0 24px' },
  dot: { width: 8, height: 8, borderRadius: 4, background: '#FF2D55', flexShrink: 0, marginTop: 4 },
  skeletonList: { display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 16px 0' },
  artScroll: { flex: 1, overflowY: 'auto', padding: '16px 20px 24px' },
  artSource: { fontSize: 12, color: '#FF2D55', fontWeight: 700, textTransform: 'uppercase' as const },
  artTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginTop: 8 },
  artDate: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 },
  artBody: {
    fontSize: 16,
    lineHeight: 1.7,
    color: 'var(--text-primary)',
    marginTop: 18,
    textAlign: 'justify' as const,
  },
};