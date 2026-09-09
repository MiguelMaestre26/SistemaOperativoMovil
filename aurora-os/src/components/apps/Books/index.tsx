import { useState } from 'react';
import { ChevronLeft, BookOpen, Moon, Sun, Bookmark, Minus, Plus } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';

interface Chapter {
  title: string;
  paragraphs: string[];
}

interface Book {
  id: string;
  title: string;
  author: string;
  emoji: string;
  genre: string;
  chapters: Chapter[];
}

const BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Aventuras en el Valle Central',
    author: 'M. Aguilar',
    emoji: '🏔️',
    genre: 'Aventura',
    chapters: [
      {
        title: 'La partida',
        paragraphs: [
          'El tren salía de la Estación del Atlántico a las seis en punto de la mañana. Samuel apretó su cuaderno contra el pecho y miró por última vez el andén. Nadie había venido a despedirlo, pero eso no le importaba: llevaba años esperando ese viaje.',
          'El Valle Central amanecía entre neblina y cafetales. Desde la ventana, las montañas parecían gigantes dormidos. Samuel sacó su lápiz y empezó a dibujar lo que veía, porque su abuelo le había dicho que los viajes se empiezan a vivir dos veces: una cuando se hacen y otra cuando se recuerdan.',
          'En el vagón conoció a Lucía, una cartógrafa que viajaba a trazar un mapa de los volcanes. —Los mapas no muestran los caminos —le dijo—; los mapas muestran las decisiones. Samuel no entendió del todo, pero escribió la frase en su cuaderno.',
        ],
      },
      {
        title: 'El mapa de Lucía',
        paragraphs: [
          'Después de dos horas, el tren se detuvo en un pueblo que no aparecía en ningún plano. Las casas tenían techos de colores y un mercado olía a plátano maduro y a café recién tostado. Lucía desdobló un pergamino enorme y marcó un punto con tinta roja.',
          '—Aquí empieza el camino al cráter —dijo—. Me han contado que sus paredes guardan inscripciones de los pueblos que vivieron antes de nosotros. ¿Quieres venir a verlas? Samuel asintió sin pensarlo. A veces, en los mapas, los lugares deciden por ti.',
          'Caminaron entre helechos gigantes y ríos de agua fría. En el borde del cráter, la neblina se abrió como un telón. Dentro de la piedra, marcadas con la paciencia de siglos, había espirales y soles y figuras humanas danzando.',
        ],
      },
      {
        title: 'El regreso',
        paragraphs: [
          'Samuel pasó tres días copiando las inscripciones. Cuando por fin volvió al tren, su cuaderno estaba repleto de espirales y de preguntas. —Nunca dejaré de viajar —le confesó a Lucía—. —Pues ponlo por escrito —le respondió ella—. Así los demás decidirán también.',
          'El tren entró de nuevo al Valle Central al anochecer. Las luces de las casas parecían estrellas bajadas a la tierra. Samuel miró su cuaderno y sonrió: mañana empezaría a escribir la historia de su viaje.',
          'Y eso, pensó mientras la ventana empañada dibujaba un sol sobre el cristal, es lo mejor que puede hacer un viajero: volver para contar.',
        ],
      },
    ],
  },
  {
    id: 'b2',
    title: 'El Último Faro',
    author: 'R. Jiménez',
    emoji: '🌊',
    genre: 'Narrativa',
    chapters: [
      {
        title: 'Torre Norte',
        paragraphs: [
          'El faro de Torre Norte llevaba apagado cuarenta años cuando Elena recibió la carta. Decía, con letra temblorosa, que su abuelo había dejado algo para ella en la cámara de la lámpara. El ferry la dejó en el muelle justo cuando el cielo se teñía de violeta.',
          'La escalera de caracol crujía, pero la puerta de la cámara abrió con facilidad. Dentro había una caja de lata con una llave y un cuaderno. En la primera página, con tinta de mar, su abuelo había escrito: "Si estás leyendo esto, el mar te eligió".',
          'El cuaderno contaba que los barcos de la ruta nocturna seguían una luz que solo aparecía cuando había luna nueva. Su abuelo la llamaba "la luz del faro que no existe". Elena se subió a la bancada y encendió la vieja lámpara: funcionaba.',
        ],
      },
      {
        title: 'La ruta nocturna',
        paragraphs: [
          'Esa noche no hubo luna. Elena encendió la lámpara y esperó. Al poco rato, en el horizonte, apareció una segunda luz que se acercaba. Era un barco pequeño, con velas remendadas, que navegaba sin tripulación.',
          'El barco rodeó el faro tres veces y se detuvo bajo la torre. Desde la cubierta, una voz ronca gritó: —¿Tienes la llave? Elena abrió la caja y mostró la llave oxidada. —Sube —dijo la voz—. Hay cartas de tu abuelo que nunca llegaron.',
          'Dentro del barco, en un baúl, había decenas de sobres sin franquear. Estaban dirigidos a ella. El cartero del mar explicó que el abuelo, por una promesa antigua, no podía franquear cartas que hablaran del tesoro de la costa.',
        ],
      },
      {
        title: 'La promesa',
        paragraphs: [
          'Las cartas contaban la historia de una flota que, en una tormenta, había escondido su cargamento en las cuevas de la península. El abuelo fue el único que conservó el mapa, y prometió devolverlo a los marineros que lo custodiaban, generación tras generación.',
          'Elena pasó la noche escribiendo respuestas. Al amanecer, el barco zarpó con el mapa a bordo. —Ya no hará falta el faro —le dijo el cartero—. Pero te pedimos que lo enciendas cada luna nueva, por costumbre.',
          'Elena aceptó. Desde entonces, cada mes, una luz pequeña barre el mar de Torre Norte. Y si nadie la ve, da igual: su abuelo decía que algunos faros iluminan lugares que no aparecen en los mapas.',
        ],
      },
    ],
  },
  {
    id: 'b3',
    title: 'Bits y Realidades',
    author: 'D. Vega',
    emoji: '🤖',
    genre: 'Ensayo',
    chapters: [
      {
        title: 'La nueva tinta',
        paragraphs: [
          'Durante siglos escribimos sobre papel y después sobre pantallas. Pero la escritura más reciente no la imprimimos ni la pinta un teclado: la aprende una máquina cuando la alimentamos con millones de páginas. Llamamos a eso un modelo de lenguaje.',
          'Un modelo no entiende las palabras como nosotros. Detecta patrones: qué palabra suele seguir a otra, qué idea acompaña a otra idea. Es como un músico enorme que jamás escuchó una melodía, pero que ha visto miles de partituras.',
          'Esta diferencia importa. Cuando una herramienta escribe mal un código o sugiere una respuesta imprecisa, no es que mienta: es que sigue un patrón incompleto. Entenderlo nos convierte de usuarios crédulos en lectores críticos.',
        ],
      },
      {
        title: 'Herramientas que preguntan',
        paragraphs: [
          'Las primeras máquinas ordenaban. Las actuales preguntan. Le pedimos que escriba un correo y nos pregunta el tono; le pedimos un plan y nos pregunta el presupuesto. Ese diálogo es nuevo en la historia de la informática.',
          'El riesgo está en dejar de preguntarnos nosotros. Si una respuesta parece lista y pulida, tendemos a creerla. Por eso la habilidad central de hoy no es memorizar, sino contrastar, verificar y hacer la siguiente pregunta.',
          'Ni la herramienta es un oráculo ni el humano un simple operador. Lo útil es un acuerdo: la máquina propone, la persona decide, y juntas corrigen.',
        ],
      },
      {
        title: 'El oficio de decidir',
        paragraphs: [
          'Cada vez que usamos un sistema de este tipo tomamos decisiones que lo entrenan y lo limitan. Elegimos qué datos son nuestros, qué respuestas aceptamos y qué cosecha de ideas regresamos al mundo.',
          'Así, la frontera ya no está entre lo que una máquina puede hacer y lo que no. Está entre lo que decidimos delegar y lo que decidimos cuidar. Esa frontera se dibuja todos los días, en una pregunta, en un clic, en una pausa.',
          'Después de todo, la mejor herramienta no es la que piensa por nosotros. Es la que nos devuelve, con más claridad, la pregunta que ya llevábamos puesta.',
        ],
      },
    ],
  },
];

const GENRES = ['Todos', 'Aventura', 'Narrativa', 'Ensayo'];

export default function Books() {
  const [progress, setProgress] = usePersistedState<Record<string, { chapter: number; scroll: number }>>('books:progress', {});
  const [bookId, setBookId] = useState<string | null>(null);
  const [fontSize, setFontSize] = usePersistedState<number>('books:fontsize', 17);
  const [night, setNight] = usePersistedState<boolean>('books:night', false);
  const [genre, setGenre] = useState('Todos');

  const book = BOOKS.find(b => b.id === bookId) ?? null;
  const chapterIdx = book ? Math.min(progress[book.id]?.chapter ?? 0, book.chapters.length - 1) : 0;
  const chapter = book?.chapters[chapterIdx];

  const filtered = genre === 'Todos' ? BOOKS : BOOKS.filter(b => b.genre === genre);

  const saveProgress = (idx: number) => {
    if (!book) return;
    setProgress(p => ({ ...p, [book.id]: { chapter: idx, scroll: 0 } }));
  };

  const theme = night
    ? { bg: '#111318', fg: '#D8D8DE', sub: '#8a8a93' }
    : { bg: '#fff', fg: '#111', sub: '#8E8E93' };

  if (book && chapter) {
    return (
      <div style={{ ...styles.container, background: theme.bg }}>
        <div style={styles.readHeader}>
          <button style={styles.iconBtn} onClick={() => setBookId(null)} aria-label="Volver">
            <ChevronLeft size={22} color="#007AFF" />
          </button>
          <span style={{ ...styles.readBrand, color: theme.fg }}>{book.title}</span>
          <button style={styles.iconBtn} onClick={() => setNight(n => !n)} aria-label="Modo noche">
            {night ? <Sun size={18} color="#FFD700" /> : <Moon size={18} color="#8E8E93" />}
          </button>
        </div>

        <div style={styles.chapterBar}>
          {book.chapters.map((_, i) => (
            <button
              key={i}
              style={{ ...styles.chp, ...(i === chapterIdx ? styles.chpActive : {}) }}
              onClick={() => { saveProgress(i); scrollTop(); }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div style={styles.readScroll} data-read-scroll>
          <div style={styles.chapterTitle}>{chapter.title}</div>
          {chapter.paragraphs.map((p, i) => (
            <p key={i} style={{ ...styles.para, color: theme.fg, fontSize }}>
              {p}
            </p>
          ))}

          <div style={styles.chapNav}>
            {chapterIdx > 0 && (
              <button style={styles.navBtn} onClick={() => saveProgress(chapterIdx - 1)}>
                ← Capítulo anterior
              </button>
            )}
            {chapterIdx < book.chapters.length - 1 && (
              <button style={styles.navBtn} onClick={() => saveProgress(chapterIdx + 1)}>
                Siguiente capítulo →
              </button>
            )}
          </div>
          <div style={{ height: 40 }} />
        </div>

        <div style={styles.readFooter}>
          <button style={styles.fontBtn} onClick={() => setFontSize(f => Math.max(13, f - 1))} aria-label="Reducir letra">
            <Minus size={16} color="#007AFF" />
          </button>
          <span style={{ ...styles.fontVal, color: theme.fg }}>{fontSize}</span>
          <button style={styles.fontBtn} onClick={() => setFontSize(f => Math.min(26, f + 1))} aria-label="Aumentar letra">
            <Plus size={16} color="#007AFF" />
          </button>
          <span style={styles.progressTxt}>
            <Bookmark size={13} color="#8E8E93" />
            {chapterIdx + 1}/{book.chapters.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <BookOpen size={20} color="#007AFF" />
        <span style={styles.title}>Libros</span>
      </div>
      <div style={styles.genreRow}>
        {GENRES.map(g => (
          <button
            key={g}
            style={{ ...styles.genreBtn, ...(genre === g ? styles.genreBtnActive : {}) }}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div style={styles.libList}>
        {filtered.map(b => (
          <button key={b.id} style={styles.bookCard} onClick={() => setBookId(b.id)}>
            <div style={styles.bookCover}>{b.emoji}</div>
            <div style={styles.bookMain}>
              <div style={styles.bookTitle}>{b.title}</div>
              <div style={styles.bookAuthor}>{b.author} · {b.genre}</div>
              <div style={styles.bookMeta}>
                {b.chapters.length} capítulos
                {progress[b.id] ? ` · Guardado en cap. ${(progress[b.id].chapter ?? 0) + 1}` : ''}
              </div>
            </div>
            <ChevronLeft size={18} color="#C7C7CC" style={{ transform: 'rotate(180deg)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function scrollTop() {
  requestAnimationFrame(() => {
    const el = document.querySelector('[data-read-scroll]');
    if (el) el.scrollTop = 0;
  });
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px 6px',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  genreRow: { display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto' },
  genreBtn: {
    padding: '7px 16px',
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'none',
    color: '#111',
    fontSize: 13,
    cursor: 'pointer',
    flexShrink: 0,
  },
  genreBtnActive: { background: '#007AFF', borderColor: '#007AFF', color: '#fff' },
  libList: { flex: 1, overflowY: 'auto', padding: '0 16px 20px' },
  bookCard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    textAlign: 'left' as const,
  },
  bookCover: {
    width: 56,
    height: 80,
    borderRadius: 8,
    background: 'linear-gradient(150deg, #5856D6 0%, #AF52DE 50%, #FF2D55 100%)',
    color: '#fff',
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
  },
  bookMain: { flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 16, fontWeight: 700, color: '#111' },
  bookAuthor: { fontSize: 13, color: '#8E8E93', marginTop: 3 },
  bookMeta: { fontSize: 12, color: '#007AFF', marginTop: 5 },
  readHeader: {
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
  readBrand: { fontSize: 14, fontWeight: 600, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  chapterBar: {
    display: 'flex',
    gap: 8,
    padding: '10px 16px',
    overflowX: 'auto',
  },
  chp: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'none',
    color: '#111',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  chpActive: { background: '#007AFF', borderColor: '#007AFF', color: '#fff' },
  readScroll: { flex: 1, overflowY: 'auto', padding: '8px 22px 0' },
  chapterTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 14,
    fontFamily: 'Georgia, serif',
  },
  para: {
    fontSize: 17,
    lineHeight: 1.65,
    marginBottom: 16,
    fontFamily: 'Georgia, serif',
    textAlign: 'justify' as const,
  },
  chapNav: { display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 8 },
  navBtn: {
    padding: '10px 14px',
    borderRadius: 20,
    border: '1px solid rgba(0,122,255,0.4)',
    background: 'none',
    color: '#007AFF',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  readFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '10px 16px',
    borderTop: '0.5px solid rgba(0,0,0,0.08)',
  },
  fontBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: 'rgba(0,122,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontVal: { fontSize: 13, fontWeight: 600, minWidth: 22, textAlign: 'center' as const },
  progressTxt: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 14,
  },
};