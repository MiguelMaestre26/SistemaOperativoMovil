import { useState, useEffect, useRef } from 'react';
import { Gamepad2, X, Circle, Sparkles, Brain, RefreshCw } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { tonePlayer } from '../../../core/audio';

/* ---------- Main menu ---------- */

const GAMES = [
  { id: 'ttt', name: 'Tres en línea', desc: 'Reto a la máquina', emoji: '❌⭕' },
  { id: 'mem', name: 'El comerciante', desc: 'Parejas de memoria', emoji: '🃏' },
  { id: 'simon', name: 'Simón dice', desc: 'Repite la secuencia', emoji: '🎵' },
];

export default function Games() {
  const [game, setGame] = useState<string | null>(null);

  if (game === 'ttt') return <TicTacToe onExit={() => setGame(null)} />;
  if (game === 'mem') return <MemoryGame onExit={() => setGame(null)} />;
  if (game === 'simon') return <SimonGame onExit={() => setGame(null)} />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>Juegos</div>
      <div style={styles.gameList}>
        {GAMES.map(g => (
          <button key={g.id} style={styles.gameCard} onClick={() => setGame(g.id)}>
            <span style={styles.gameEmoji}>{g.emoji}</span>
            <div style={styles.gameMain}>
              <div style={styles.gameName}>{g.name}</div>
              <div style={styles.gameDesc}>{g.desc}</div>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>
    </div>
  );
}

function ChevronRight() {
  return <Gamepad2 size={18} color="#C7C7CC" />;
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
      <div style={{ ...styles.scoreRow, color: '#111' }}>
        <span>Tú {score.X}</span>
        <span>{score.O} Aurora</span>
      </div>
      <div style={styles.grid3}>
        {board.map((c, i) => (
          <button key={i} style={styles.cell3} onClick={() => play(i)}>
            {c === 'X' ? <X size={40} color="#FF3B30" strokeWidth={3} /> : c === 'O' ? <Circle size={36} color="#007AFF" strokeWidth={3} /> : null}
          </button>
        ))}
      </div>
      <div style={styles.status}>
        {done
          ? w ? (w === 'X' ? '¡Ganaste!' : 'Ganó Aurora') : 'Empate'
          : turn === 'X' ? 'Tu turno' : 'Aurora piensa…'}
      </div>
      <button style={styles.resetBtn} onClick={reset}>
        <RefreshCw size={16} color="#007AFF" /> Nueva partida
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
      <div style={{ ...styles.scoreRow, color: '#111' }}>
        <span>Movimientos: {moves}</span>
        <span>{best > 0 ? `Récord: ${best}` : 'Récord: –'}</span>
      </div>
      <div style={styles.grid4}>
        {cards.map((c, i) => (
          <button
            key={c.id}
            style={{
              ...styles.memCell,
              background: c.up || c.matched ? '#fff' : '#5856D6',
              borderColor: c.matched ? '#34C759' : 'rgba(0,0,0,0.1)',
            }}
            onClick={() => flip(i)}
          >
            {c.up || c.matched ? <span style={styles.memEmoji}>{c.emoji}</span> : <Sparkles size={18} color="rgba(255,255,255,0.7)" />}
          </button>
        ))}
      </div>
      <button style={styles.resetBtn} onClick={restart}>
        <RefreshCw size={16} color="#007AFF" /> Reiniciar
      </button>
    </GameShell>
  );
}

/* ---------- Simon ---------- */

const SIMON_COLORS = ['#FF3B30', '#34C759', '#FFD60A', '#0A84FF'];
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
      <div style={{ ...styles.scoreRow, color: '#111' }}>
        <span>{score === 0 ? 'Listo' : `Racha: ${score}`}</span>
        <span>{best > 0 ? `Récord: ${best}` : 'Récord: –'}</span>
      </div>
      <div style={styles.simonBoard}>
        {SIMON_COLORS.map((c, i) => (
          <button
            key={i}
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
      <button style={styles.resetBtn} onClick={startGame}>
        <Brain size={16} color="#007AFF" /> {stage === 'idle' || stage === 'over' || stage === 'win' ? 'Jugar' : 'Repetir'}
      </button>
    </GameShell>
  );
}

/* ---------- Shell ---------- */

function GameShell({ title, children, onExit }: { title: string; children: React.ReactNode; onExit: () => void }) {
  return (
    <div style={styles.container}>
      <div style={styles.shellHeader}>
        <span style={styles.shellTitle}>{title}</span>
        <button style={styles.shellExit} onClick={onExit}>✕</button>
      </div>
      <div style={styles.shellBody}>
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: { padding: '12px 16px 6px', fontSize: 22, fontWeight: 700, color: '#111' },
  gameList: { flex: 1, overflowY: 'auto', padding: '10px 16px' },
  shellHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  },
  shellTitle: { fontSize: 18, fontWeight: 700, color: '#111' },
  shellExit: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: 'none',
    background: 'rgba(0,0,0,0.06)',
    cursor: 'pointer',
    color: '#8E8E93',
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
  gameCard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px',
    marginBottom: 12,
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.07)',
    background: '#F9F9FB',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  gameEmoji: { fontSize: 30 },
  gameMain: { flex: 1 },
  gameName: { fontSize: 16, fontWeight: 700, color: '#111' },
  gameDesc: { fontSize: 13, color: '#8E8E93', marginTop: 3 },
  scoreRow: { display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 13, fontWeight: 600 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 88px)', gap: 8 },
  cell3: {
    width: 88,
    height: 88,
    borderRadius: 14,
    border: '2px solid rgba(0,0,0,0.08)',
    background: '#F7F7F9',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { fontSize: 15, fontWeight: 600, color: '#111' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%', maxWidth: 320 },
  memCell: {
    aspectRatio: '1/1',
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.1)',
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
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};