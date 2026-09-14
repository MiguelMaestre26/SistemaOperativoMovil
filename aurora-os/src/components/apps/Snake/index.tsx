import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { Screen } from '../../ui';

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';
type GameStatus = 'idle' | 'playing' | 'paused' | 'over';

interface SnakeState {
  snake: Point[];
  food: Point;
  dir: Direction;
  queue: Direction[];
  score: number;
  status: GameStatus;
}

const COLS = 17;
const ROWS = 20;
const CELL = 18;

const DIR_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function same(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  );
}

function spawnFood(snake: Point[]): Point {
  const occupied = new Set(snake.map(p => p.y * COLS + p.x));
  const free: Point[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!occupied.has(y * COLS + x)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
  return free[Math.floor(Math.random() * free.length)];
}

function fresh(d?: Direction): SnakeState {
  const leftFacing = d === 'left';
  const snake: Point[] = leftFacing
    ? [{ x: 4, y: 10 }, { x: 5, y: 10 }, { x: 6, y: 10 }]
    : [{ x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }];
  const dir: Direction = leftFacing ? 'left' : d ?? 'right';
  return {
    snake,
    food: spawnFood(snake),
    dir,
    queue: [],
    score: 0,
    status: 'playing',
  };
}

function step(s: SnakeState): SnakeState {
  const dir = s.queue[0] ?? s.dir;
  const queue = s.queue.slice(1);
  const v = DIR_VECTORS[dir];
  const head = s.snake[0];
  const nh = { x: head.x + v.x, y: head.y + v.y };

  if (nh.x < 0 || nh.x >= COLS || nh.y < 0 || nh.y >= ROWS) {
    return { ...s, dir, queue: [], status: 'over' };
  }

  const eating = same(nh, s.food);
  const bodyCheck = eating ? s.snake : s.snake.slice(0, -1);
  if (bodyCheck.some(p => same(p, nh))) {
    return { ...s, dir, queue: [], status: 'over' };
  }

  const snake = [nh, ...s.snake];
  let food = s.food;
  let score = s.score;
  if (eating) {
    score = s.score + 1;
    food = spawnFood(snake);
  } else {
    snake.pop();
  }

  return { snake, food, dir, queue, score, status: 'playing' };
}

export default function SnakeGame() {
  const [game, setGame] = useState<SnakeState>(fresh);
  const [best, setBest] = usePersistedState<number>('snake:best', 0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const { snake, food, score, status } = game;
  const speed = Math.max(70, 160 - score * 4);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => setGame(prev => step(prev)), speed);
    return () => clearInterval(id);
  }, [status, speed]);

  useEffect(() => {
    if (status === 'over' && score > best) {
      const t = setTimeout(() => setBest(score), 0);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, score, best]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        enqueue(d);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enqueue = (next: Direction) => {
    setGame(prev => {
      if (prev.status === 'idle' || prev.status === 'over') return fresh(next);
      if (prev.status !== 'playing') return prev;
      const last = prev.queue.length > 0 ? prev.queue[prev.queue.length - 1] : prev.dir;
      if (next === last || isOpposite(last, next)) return prev;
      if (prev.queue.length >= 2) return prev;
      return { ...prev, queue: [...prev.queue, next] };
    });
  };

  const togglePause = () => {
    setGame(prev => {
      if (prev.status === 'playing') return { ...prev, status: 'paused' };
      if (prev.status === 'paused') return { ...prev, status: 'playing' };
      return prev;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    enqueue(horizontal ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  };

  const clearPointer = () => {
    pointerRef.current = null;
  };

  const startGame = () => setGame(fresh());

  return (
    <Screen scroll={false} padding="0">
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <SnakeIcon size={20} />
          <span style={styles.topTitle}>Snake</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.scorePill}>Puntos {score}</span>
          {best > 0 && <span style={styles.bestPill}>Récord {best}</span>}
          {(status === 'playing' || status === 'paused') && (
            <button
              className="pressable"
              style={styles.iconBtn}
              onClick={togglePause}
              aria-label={status === 'paused' ? 'Reanudar' : 'Pausar'}
              title={status === 'paused' ? 'Reanudar' : 'Pausar'}
            >
              {status === 'paused' ? <Play size={18} color="var(--primary)" /> : <Pause size={18} color="var(--primary)" />}
            </button>
          )}
        </div>
      </div>

      <div style={styles.boardWrap}>
        <div style={styles.boardStage}>
          <div
            style={{
              ...styles.board,
              gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
              gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
            }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={clearPointer}
            onPointerCancel={clearPointer}
          >
            {Array.from({ length: ROWS * COLS }, (_, i) => {
              const x = i % COLS;
              const y = Math.floor(i / COLS);
              const p = { x, y };
              const isHead = snake.length > 0 && same(snake[0], p);
              const isBody = snake.some((seg, idx) => idx > 0 && same(seg, p));
              const isFood = same(food, p);
              return (
                <div
                  key={i}
                  style={{
                    width: CELL,
                    height: CELL,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isHead
                      ? '#34C759'
                      : isBody
                        ? '#2E9E4F'
                        : (x + y) % 2 === 0
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.02)',
                    borderRadius: isHead ? 6 : isBody ? 4 : 0,
                    boxShadow: isHead ? '0 0 8px rgba(52,199,89,0.55)' : undefined,
                  }}
                >
                  {isFood && <span style={styles.foodEmoji}>🍎</span>}
                </div>
              );
            })}
          </div>

          {(status === 'idle' || status === 'over' || status === 'paused') && (
            <div style={styles.overlay}>
              {status === 'paused' ? (
                <>
                  <span style={styles.overlayEmoji}>⏸️</span>
                  <div style={styles.overlayTitle}>Pausa</div>
                  <button className="pressable" style={styles.startBtn} onClick={togglePause}>
                    <Play size={18} color="#fff" /> Continuar
                  </button>
                </>
              ) : status === 'over' ? (
                <>
                  <span style={styles.overlayEmoji}>💥</span>
                  <div style={styles.overlayTitle}>¡Juego terminado!</div>
                  <div style={styles.overlayScore}>
                    Puntos: {score}
                    {score > 0 && score >= best && best > 0 ? ' · ¡Nuevo récord!' : ''}
                  </div>
                  <button className="pressable" style={styles.startBtn} onClick={startGame}>
                    <RotateCcw size={18} color="#fff" /> Jugar de nuevo
                  </button>
                </>
              ) : (
                <>
                  <span style={styles.overlayEmoji}>🐍</span>
                  <div style={styles.overlayTitle}>Snake</div>
                  <div style={styles.overlayHint}>Desliza sobre el tablero o usa las flechas.</div>
                  <button className="pressable" style={styles.startBtn} onClick={startGame}>
                    <Play size={18} color="#fff" /> Jugar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={styles.dpad}>
        <div style={styles.dpadGrid}>
          <div />
          <button className="pressable" style={styles.dpadBtn} onClick={() => enqueue('up')} aria-label="Arriba" title="Arriba">
            <ChevronUp size={22} color="var(--text-primary)" />
          </button>
          <div />
          <button className="pressable" style={styles.dpadBtn} onClick={() => enqueue('left')} aria-label="Izquierda" title="Izquierda">
            <ChevronLeft size={22} color="var(--text-primary)" />
          </button>
          <div style={styles.dpadCenter}>
            <span style={{ fontSize: 16 }}>🐍</span>
          </div>
          <button className="pressable" style={styles.dpadBtn} onClick={() => enqueue('right')} aria-label="Derecha" title="Derecha">
            <ChevronRight size={22} color="var(--text-primary)" />
          </button>
          <div />
          <button className="pressable" style={styles.dpadBtn} onClick={() => enqueue('down')} aria-label="Abajo" title="Abajo">
            <ChevronDown size={22} color="var(--text-primary)" />
          </button>
          <div />
        </div>
      </div>
    </Screen>
  );
}

export function SnakeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 5c3.4-2.6 7.4-1.8 8.4 1.4 1.3 4.3-3.4 4.4-3.4 7.2 0 2.7 2.3 4.4 4.9 3.9"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14.3" cy="17.5" r="1.5" fill="#34C759" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '10px 16px',
    flexShrink: 0,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  topTitle: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  scorePill: {
    padding: '5px 12px',
    borderRadius: 14,
    background: 'rgba(52,199,89,0.15)',
    color: '#34C759',
    fontSize: 12,
    fontWeight: 700,
  },
  bestPill: {
    padding: '5px 12px',
    borderRadius: 14,
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 700,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'var(--bg-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  boardWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    padding: '4px 16px',
  },
  boardStage: {
    position: 'relative' as const,
    padding: 8,
    borderRadius: 14,
    background: '#10151a',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)',
  },
  board: {
    display: 'grid',
    overflow: 'hidden',
    borderRadius: 8,
    touchAction: 'none' as const,
  },
  foodEmoji: { fontSize: 14, lineHeight: 1 },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    background: 'rgba(6,10,14,0.82)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
    padding: 16,
  },
  overlayEmoji: { fontSize: 40 },
  overlayTitle: { fontSize: 26, fontWeight: 800, color: '#fff' },
  overlayHint: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' as const, lineHeight: 1.4 },
  overlayScore: { fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  startBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    padding: '13px 26px',
    borderRadius: 24,
    border: 'none',
    background: '#34C759',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(52,199,89,0.4)',
  },
  dpad: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '4px 0 18px',
  },
  dpadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 54px)',
    gridTemplateRows: 'repeat(3, 54px)',
    gap: 6,
  },
  dpadBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    border: '1px solid var(--separator-cell)',
    background: 'var(--bg-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};