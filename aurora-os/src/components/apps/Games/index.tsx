import { useState, useEffect, useRef } from 'react';
import { X, Circle, Sparkles, Brain, RefreshCw, Loader2 } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { tonePlayer } from '../../../core/audio';
import { fetchTrivia, decodeHtml, type TriviaQuestion } from '../../../core/trivia';
import { Screen, AppHeader, ListGroup, ListRow } from '../../ui';

/* ---------- Main menu ---------- */

const GAMES = [
  { id: 'ttt', name: 'Tres en línea', desc: 'Reta a la máquina', emoji: '❌⭕' },
  { id: 'mem', name: 'El comerciante', desc: 'Parejas de memoria', emoji: '🃏' },
  { id: 'simon', name: 'Simón dice', desc: 'Repite la secuencia', emoji: '🎵' },
  { id: 'trivia', name: 'Trivia', desc: 'Preguntas reales en línea', emoji: '🧠' },
];

export default function Games() {
  const [game, setGame] = useState<string | null>(null);

  if (game === 'ttt') return <TicTacToe onExit={() => setGame(null)} />;
  if (game === 'mem') return <MemoryGame onExit={() => setGame(null)} />;
  if (game === 'simon') return <SimonGame onExit={() => setGame(null)} />;
  if (game === 'trivia') return <TriviaGame onExit={() => setGame(null)} />;

  return (
    <Screen scroll={false} padding="0">
      <AppHeader title="Juegos" />
      <div style={styles.gameList}>
        <ListGroup>
          {GAMES.map((g, i) => (
            <ListRow
              key={g.id}
              showSeparator={i < GAMES.length - 1}
              icon={<span style={styles.gameEmoji}>{g.emoji}</span>}
              label={g.name}
              sublabel={g.desc}
              onClick={() => setGame(g.id)}
            />
          ))}
        </ListGroup>
      </div>
    </Screen>
  );
}

/* ---------- Tic-tac-toe ---------- */

type Cell = 'X' | 'O' | null;

function winnerOf(b: Cell[]): Cell {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

function isFull(b: Cell[]): boolean {
  return b.every(c => c !== null);
}

function minimax(b: Cell[], isX: boolean): { score: number; move: number } {
  const w = winnerOf(b);
  if (w === 'X') return { score: 10, move: -1 };
  if (w === 'O') return { score: -10, move: -1 };
  if (isFull(b)) return { score: 0, move: -1 };
  let best = isX ? -Infinity : Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = isX ? 'X' : 'O';
      const { score } = minimax(b, !isX);
      if ((isX && score > best) || (!isX && score < best)) {
        best = score;
        bestMove = i;
      }
      b[i] = null;
    }
  }
  return { score: best, move: bestMove };
}

function TicTacToe({ onExit }: { onExit: () => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [score, setScore] = useState({ X: 0, O: 0 });
  const thinking = useRef(false);

  const w = winnerOf(board);
  const done = w !== null || isFull(board);

  useEffect(() => {
    if (done || turn === 'O') {
      if (!thinking.current && turn === 'O' && !done) {
        thinking.current = true;
        const t = setTimeout(() => {
          const { move } = minimax([...board], false);
          if (move >= 0) {
            setBoard(b => b.map((c, i) => (i === move ? 'O' : c)));
            setTurn('X');
          }
          thinking.current = false;
        }, 450);
        return () => clearTimeout(t);
      }
    }
  }, [turn, board, done]);

  const play = (i: number) => {
    if (done || turn !== 'X' || board[i] || thinking.current) return;
    const next = [...board];
    next[i] = 'X';
    setBoard(next);
    setTurn('O');
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    if (w === 'X') setScore(s => ({ ...s, X: s.X + 1 }));
    if (w === 'O') setScore(s => ({ ...s, O: s.O + 1 }));
  };

  return (
    <GameShell title="Tres en línea" onExit={onExit}>
      <div style={{ ...styles.scoreRow, color: 'var(--text-primary)' }}>
        <span>Tú {score.X}</span>
        <span>{score.O} Aurora</span>
      </div>
      <div style={styles.grid3}>
        {board.map((c, i) => (
          <button key={i} className="pressable" style={styles.cell3} onClick={() => play(i)}>
            {c === 'X' ? <X size={40} color="#FF3B30" strokeWidth={3} /> : c === 'O' ? <Circle size={36} color="var(--primary)" strokeWidth={3} /> : null}
          </button>
        ))}
      </div>
      <div style={styles.status}>
        {done
          ? w ? (w === 'X' ? '¡Ganaste!' : 'Ganó Aurora') : 'Empate'
          : turn === 'X' ? 'Tu turno' : 'Aurora piensa…'}
      </div>
      <button className="pressable" style={styles.resetBtn} onClick={reset}>
        <RefreshCw size={16} color="var(--primary)" /> Nueva partida
      </button>
    </GameShell>
  );
}

/* ---------- Memory ---------- */

const PAIRS = ['🍎', '🍌', '🍇', '🍓', '🍍', '🥥', '🫐', '🍒'];

interface MemCard { id: number; emoji: string; up: boolean; matched: boolean; }

const CARDS: MemCard[] = [...PAIRS, ...PAIRS].map((emoji, id) => ({ id, emoji, up: false, matched: false })).sort(() => Math.random() - 0.5);

function MemoryGame({ onExit }: { onExit: () => void }) {
  const [cards, setCards] = useState<MemCard[]>(CARDS);
  const [picks, setPicks] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = usePersistedState<number>('games:mem:best', 0);
  const lock = useRef(false);

  useEffect(() => {
    if (picks.length !== 2) return;
    lock.current = true;
    const [a, b] = picks;
    const ca = cards[a];
    const cb = cards[b];
    const t = setTimeout(() => {
      if (ca.emoji === cb.emoji) {
        setCards(cs => cs.map(c => (c.id === ca.id || c.id === cb.id ? { ...c, matched: true } : c)));
        tonePlayer.setVolume(0.2);
        tonePlayer.setTempo(140);
        tonePlayer.load([1318.51]);
        tonePlayer.resume();
        setTimeout(() => tonePlayer.pause(), 250);
      } else {
        setCards(cs => cs.map(c => (c.id === ca.id || c.id === cb.id ? { ...c, up: false } : c)));
      }
      setPicks([]);
      lock.current = false;
    }, 650);
    return () => clearTimeout(t);
  }, [picks, cards]);

  const won = cards.every(c => c.matched);

  useEffect(() => {
    if (won && best === 0) setBest(moves);
    else if (won && moves < best) setBest(moves);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const flip = (i: number) => {
    if (lock.current || picks.length >= 2 || cards[i].up || cards[i].matched) return;
    setCards(cs => cs.map((c, idx) => (idx === i ? { ...c, up: true } : c)));
    setPicks(p => [...p, i]);
    setMoves(m => m + 1);
  };

  const restart = () => {
    setCards([...CARDS].sort(() => Math.random() - 0.5));
    setPicks([]);
    setMoves(0);
  };

  return (
    <GameShell title={won ? '¡Completado!' : 'El comerciante'} onExit={onExit}>
      <div style={{ ...styles.scoreRow, color: 'var(--text-primary)' }}>
        <span>Movimientos: {moves}</span>
        <span>{best > 0 ? `Récord: ${best}` : 'Récord: –'}</span>
      </div>
      <div style={styles.grid4}>
        {cards.map((c, i) => (
          <button
            key={c.id}
            className="pressable"
            style={{
              ...styles.memCell,
              background: c.up || c.matched ? 'var(--surface-card)' : 'var(--tertiary)',
              borderColor: c.matched ? 'var(--success)' : 'var(--separator-cell)',
            }}
            onClick={() => flip(i)}
          >
            {c.up || c.matched ? <span style={styles.memEmoji}>{c.emoji}</span> : <Sparkles size={18} color="rgba(255,255,255,0.7)" />}
          </button>
        ))}
      </div>
      <button className="pressable" style={styles.resetBtn} onClick={restart}>
        <RefreshCw size={16} color="var(--primary)" /> Reiniciar
      </button>
    </GameShell>
  );
}

/* ---------- Simon ---------- */

const SIMON_COLORS = ['#FF3B30', 'var(--success)', '#FFD60A', 'var(--primary)'];
const SIMON_NOTES = [261.63, 329.63, 392.0, 523.25];

function SimonGame({ onExit }: { onExit: () => void }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [stage, setStage] = useState<'idle' | 'show' | 'input' | 'over' | 'win'>('idle');
  const [active, setActive] = useState<number | null>(null);
  const [best, setBest] = usePersistedState<number>('games:simon:best', 0);
  const seqRef = useRef<number[]>([]);
  const posRef = useRef(0);

  const playNote = (i: number, dur = 400) => {
    tonePlayer.setVolume(0.3);
    tonePlayer.setTempo(120);
    tonePlayer.load([SIMON_NOTES[i]]);
    tonePlayer.resume();
    setTimeout(() => tonePlayer.pause(), dur);
  };

  const startGame = () => {
    const first = Math.floor(Math.random() * 4);
    seqRef.current = [first];
    setSeq(seqRef.current);
    posRef.current = 0;
    setStage('show');
  };

  useEffect(() => {
    if (stage !== 'show') return;
    let i = 0;
    const iv = setInterval(() => {
      if (i < seqRef.current.length) {
        setActive(seqRef.current[i]);
        playNote(seqRef.current[i]);
        setTimeout(() => setActive(null), 300);
        i++;
      } else {
        clearInterval(iv);
        setStage('input');
        posRef.current = 0;
      }
    }, 700);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const press = (i: number) => {
    if (stage !== 'input') return;
    playNote(i, 250);
    setActive(i);
    setTimeout(() => setActive(null), 250);
    if (i !== seqRef.current[posRef.current]) {
      setStage('over');
      if (seqRef.current.length - 1 > 0 && best === 0) setBest(seqRef.current.length - 1);
      else if (seqRef.current.length - 1 > best) setBest(seqRef.current.length - 1);
      return;
    }
    posRef.current++;
    if (posRef.current >= seqRef.current.length) {
      const next = [...seqRef.current, Math.floor(Math.random() * 4)];
      if (next.length >= 12) {
        setStage('win');
      } else {
        seqRef.current = next;
        setSeq(next);
        setTimeout(() => setStage('show'), 500);
      }
    }
  };

  const score = seq.length - 1;

  return (
    <GameShell title="Simón dice" onExit={onExit}>
      <div style={{ ...styles.scoreRow, color: 'var(--text-primary)' }}>
        <span>{score === 0 ? 'Listo' : `Racha: ${score}`}</span>
        <span>{best > 0 ? `Récord: ${best}` : 'Récord: –'}</span>
      </div>
      <div style={styles.simonBoard}>
        {SIMON_COLORS.map((c, i) => (
          <button
            key={i}
            className="pressable"
            style={{
              ...styles.simonPad,
              background: c,
              opacity: active === i ? 1 : stage === 'over' ? 0.35 : 0.9,
            }}
            disabled={stage !== 'input'}
            onClick={() => press(i)}
          />
        ))}
      </div>
      <button className="pressable" style={styles.resetBtn} onClick={startGame}>
        <Brain size={16} color="var(--primary)" /> {stage === 'idle' || stage === 'over' || stage === 'win' ? 'Jugar' : 'Repetir'}
      </button>
    </GameShell>
  );
}

/* ---------- Trivia ---------- */

const DIFFS = [
  { id: '', label: 'Cualquiera' },
  { id: 'easy', label: 'Fácil' },
  { id: 'medium', label: 'Media' },
  { id: 'hard', label: 'Difícil' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const DIFF_COLOR: Record<string, string> = {};
DIFF_COLOR.easy = 'var(--success)';
DIFF_COLOR.medium = '#FF9500';
DIFF_COLOR.hard = '#FF3B30';

function TriviaGame({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'setup' | 'play' | 'done'>('setup');
  const [diff, setDiff] = useState('');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const qs = await fetchTrivia(10, diff);
      setQuestions(qs);
      setIndex(0);
      setPicked(null);
      setScore(0);
      setPhase(qs.length > 0 ? 'play' : 'setup');
    } catch {
      setPhase('setup');
    }
    setLoading(false);
  };

  const q = questions[index];
  const options = q ? shuffle([q.correctAnswer, ...q.incorrectAnswers].map(decodeHtml)) : [];

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === decodeHtml(q.correctAnswer)) setScore(s => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) setPhase('done');
    else {
      setIndex(i => i + 1);
      setPicked(null);
    }
  };

  if (phase === 'setup' || phase === 'done') {
    return (
      <GameShell title={phase === 'done' ? 'Resultado' : 'Trivia'} onExit={onExit}>
        {loading ? (
          <>
            <Loader2 size={34} color="var(--accent)" className="spin" />
            <div style={styles.triviaHint}>Descargando preguntas…</div>
          </>
        ) : phase === 'done' ? (
          <>
            <div style={styles.triviaScore}>{score} / {questions.length}</div>
            <div style={styles.triviaHint}>
              {score === questions.length
                ? '¡Perfecto, eres un genio!'
                : score >= 5
                  ? '¡Bien hecho, buena memoria!'
                  : 'Sigue practicando.'}
            </div>
            <button className="pressable" style={styles.resetBtn} onClick={start}>
              <RefreshCw size={16} color="var(--primary)" /> Jugar de nuevo
            </button>
          </>
        ) : (
          <>
            <div style={styles.diffRow}>
              {DIFFS.map(d => (
                <button
                  key={d.id || 'any'}
                  className="pressable"
                  style={{ ...styles.diffBtn, ...(diff === d.id ? styles.diffActive : {}) }}
                  onClick={() => setDiff(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button className="pressable" style={styles.resetBtn} onClick={() => void start()}>
              <Brain size={16} color="var(--primary)" /> Empezar
            </button>
            {diff !== '' && (
              <div style={styles.triviaHint}>Nivel: {DIFFS.find(d => d.id === diff)?.label}</div>
            )}
          </>
        )}
      </GameShell>
    );
  }

  if (!q) return <GameShell title="Trivia" onExit={onExit}><div style={styles.triviaHint}>Sin datos</div></GameShell>;

  return (
    <GameShell title={`Pregunta ${index + 1} / ${questions.length}`} onExit={onExit}>
      <div style={styles.triviaTopRow}>
        <span style={styles.triviaCat}>{decodeHtml(q.category)}</span>
        <span style={{ ...styles.triviaDiff, color: DIFF_COLOR[q.difficulty] || 'var(--text-secondary)' }}>
          {q.difficulty === 'easy' ? 'Fácil' : q.difficulty === 'medium' ? 'Media' : 'Difícil'}
        </span>
      </div>
      <div style={styles.triviaQ}>{decodeHtml(q.question)}</div>
      <div style={styles.optList}>
        {options.map(o => {
          const isCorrect = picked !== null && o === decodeHtml(q.correctAnswer);
          const isWrongPick = picked === o && o !== decodeHtml(q.correctAnswer);
          return (
            <button
              key={o}
              className="pressable"
              style={{
                ...styles.opt,
                ...(isCorrect ? styles.optCorrect : {}),
                ...(isWrongPick ? styles.optWrong : {}),
              }}
              disabled={picked !== null}
              onClick={() => pick(o)}
            >
              <span>{o}</span>
              {picked && isCorrect && <span style={styles.optMark}>✓</span>}
              {picked && isWrongPick && <span style={styles.optMark}>✕</span>}
            </button>
          );
        })}
      </div>
      <div style={styles.triviaFoot}>
        {picked ? (
          <>
            <span style={styles.triviaScoreSmall}>
              {picked === decodeHtml(q.correctAnswer) ? '¡Correcto!' : 'Incorrecto'} · {score} pts
            </span>
            <button className="pressable" style={styles.resetBtn} onClick={next}>
              {index + 1 >= questions.length ? 'Ver resultado' : 'Siguiente'}
            </button>
          </>
        ) : (
          <span style={styles.triviaHint}>Toca la respuesta correcta</span>
        )}
      </div>
    </GameShell>
  );
}

/* ---------- Shell ---------- */

function GameShell({ title, children, onExit }: { title: string; children: React.ReactNode; onExit: () => void }) {
  return (
    <div style={styles.container}>
      <div style={styles.shellHeader}>
        <span style={styles.shellTitle}>{title}</span>
        <button className="pressable" style={styles.shellExit} onClick={onExit} aria-label="Cerrar" >✕</button>
      </div>
      <div style={styles.shellBody}>
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' },
  gameList: { flex: 1, overflowY: 'auto', paddingTop: 4 },
  shellHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '0.5px solid var(--separator-cell)',
    flexShrink: 0,
  },
  shellTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' },
  shellExit: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: 'none',
    background: 'var(--bg-tertiary)',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
  shellBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 16,
  },
  gameEmoji: { fontSize: 18 },
  scoreRow: { display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 13, fontWeight: 600 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 88px)', gap: 8 },
  cell3: {
    width: 88,
    height: 88,
    borderRadius: 14,
    border: '2px solid var(--separator-cell)',
    background: 'var(--bg-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%', maxWidth: 320 },
  memCell: {
    aspectRatio: '1/1',
    borderRadius: 10,
    border: '1px solid var(--separator-cell)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
  },
  memEmoji: { fontSize: 26 },
  simonBoard: { display: 'grid', gridTemplateColumns: 'repeat(2, 122px)', gap: 10 },
  simonPad: {
    width: 122,
    height: 122,
    borderRadius: 18,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 22px',
    borderRadius: 24,
    border: 'none',
    background: 'rgba(0,122,255,0.1)',
    color: 'var(--accent)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  triviaHint: { fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' as const },
  triviaScore: { fontSize: 44, fontWeight: 700, color: 'var(--text-primary)' },
  triviaScoreSmall: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  diffRow: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' },
  diffBtn: {
    padding: '10px 16px',
    borderRadius: 20,
    border: '1px solid var(--separator-cell)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  diffActive: { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff' },
  triviaTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  triviaCat: { fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' as const },
  triviaDiff: { fontSize: 12, fontWeight: 700 },
  triviaQ: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    lineHeight: 1.35,
  },
  optList: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 330 },
  opt: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '13px 16px',
    borderRadius: 12,
    border: '1px solid var(--separator-cell)',
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  optCorrect: { background: 'var(--success)', borderColor: 'var(--success)', color: '#fff' },
  optWrong: { background: '#FF3B30', borderColor: '#FF3B30', color: '#fff' },
  optMark: { fontSize: 16, fontWeight: 700 },
  triviaFoot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
};