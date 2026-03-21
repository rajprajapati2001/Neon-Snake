import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Edit3, Check, Maximize2 } from 'lucide-react';

// Constants
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type ControlsConfig = Record<Direction, { x: number; y: number; scale: number }>;

const DEFAULT_CONTROLS_CONFIG: ControlsConfig = {
  UP: { x: 0, y: -50, scale: 1 },
  DOWN: { x: 0, y: 50, scale: 1 },
  LEFT: { x: -50, y: 0, scale: 1 },
  RIGHT: { x: 50, y: 0, scale: 1 }
};

const parseSafeJSON = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

// Sound Utility
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }
  return sharedAudioContext;
};

const playSound = (type: 'food' | 'pause' | 'resume' | 'highscore' | 'gameover') => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case 'food':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    case 'pause':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'resume':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'highscore':
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    case 'gameover':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
  }

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

export default function App() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [displayDirection, setDisplayDirection] = useState<Direction>('UP');
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    const parsed = saved ? Number.parseInt(saved, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [time, setTime] = useState(0);

  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const directionRef = useRef<Direction>('UP');
  const lastProcessedDirectionRef = useRef<Direction>('UP');
  const touchStartRef = useRef<Point | null>(null);
  const hasPlayedHighScoreSoundRef = useRef(false);
  const dragStateRef = useRef<{ pointerId: number; dir: Direction; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resizeStateRef = useRef<{ pointerId: number; dir: Direction; startY: number; startScale: number } | null>(null);

  const [isEditingControls, setIsEditingControls] = useState(false);
  const [controlsConfig, setControlsConfig] = useState<ControlsConfig>(() => {
    return parseSafeJSON(localStorage.getItem('snakeControlsConfigV3'), DEFAULT_CONTROLS_CONFIG);
  });

  const resetControls = () => {
    const freshConfig = JSON.parse(JSON.stringify(DEFAULT_CONTROLS_CONFIG));
    setControlsConfig(freshConfig);
    localStorage.setItem('snakeControlsConfigV3', JSON.stringify(freshConfig));
  };

  useEffect(() => {
    localStorage.setItem('snakeControlsConfigV3', JSON.stringify(controlsConfig));
  }, [controlsConfig]);

  // Generate random food
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDisplayDirection('UP');
    directionRef.current = 'UP';
    lastProcessedDirectionRef.current = 'UP';
    setScore(0);
    setTime(0);
    setStatus('PLAYING');
    hasPlayedHighScoreSoundRef.current = false;
    playSound('resume');
  }, [generateFood]);

  // Move Snake Logic
  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };
      const currentDir = directionRef.current;

      switch (currentDir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Wrap Around Logic
      if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
      if (newHead.x >= GRID_SIZE) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
      if (newHead.y >= GRID_SIZE) newHead.y = 0;

      const isFoodCollision = newHead.x === food.x && newHead.y === food.y;

      // Ignore the tail segment when it moves away in the same tick.
      const collisionBody = isFoodCollision ? prevSnake : prevSnake.slice(0, -1);
      if (collisionBody.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setStatus('GAME_OVER');
        playSound('gameover');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check Food Collision
      if (isFoodCollision) {
        setScore(s => {
          const newScore = s + 10;
          // Only play highscore sound once when the record is first broken in the session
          if (newScore > highScore && !hasPlayedHighScoreSoundRef.current) {
            playSound('highscore');
            hasPlayedHighScoreSoundRef.current = true;
          } else {
            // Normal eat sound
            playSound('food');
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      lastProcessedDirectionRef.current = currentDir;
      return newSnake;
    });
  }, [food, generateFood, highScore]);

  // Smooth Game Loop using requestAnimationFrame
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (status === 'PLAYING') {
        if (!lastUpdateTimeRef.current) lastUpdateTimeRef.current = timestamp;
        const elapsed = timestamp - lastUpdateTimeRef.current;

        if (elapsed > INITIAL_SPEED) {
          moveSnake();
          lastUpdateTimeRef.current = timestamp;
        }
        gameLoopRef.current = requestAnimationFrame(loop);
      }
    };

    if (status === 'PLAYING') {
      gameLoopRef.current = requestAnimationFrame(loop);
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      lastUpdateTimeRef.current = 0;
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, moveSnake]);

  // High Score Update
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  // Input Handling
  const changeDirection = useCallback((newDir: Direction) => {
    const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (newDir !== opposites[lastProcessedDirectionRef.current]) {
      directionRef.current = newDir;
      setDisplayDirection(newDir);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (status === 'START' || status === 'GAME_OVER') {
          resetGame();
        } else {
          setStatus(prev => {
            const next = prev === 'PLAYING' ? 'PAUSED' : 'PLAYING';
            playSound(next === 'PLAYING' ? 'resume' : 'pause');
            return next;
          });
        }
        return;
      }

      if (status !== 'PLAYING') return;
      switch (e.key) {
        case 'ArrowUp': changeDirection('UP'); break;
        case 'ArrowDown': changeDirection('DOWN'); break;
        case 'ArrowLeft': changeDirection('LEFT'); break;
        case 'ArrowRight': changeDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, resetGame, changeDirection]);

  // Swipe Controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || status !== 'PLAYING' || isEditingControls) return;
    
    const touchMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const dx = touchMove.x - touchStartRef.current.x;
    const dy = touchMove.y - touchStartRef.current.y;

    const threshold = 30;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
      // Reset start point to allow multiple swipes in one continuous touch
      touchStartRef.current = touchMove;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
 <div 
      className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-[#0a0a0a] font-sans p-2 sm:p-4 md:p-12 md:gap-16 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* HUD */}
      <div className="w-full max-w-[400px] md:max-w-none md:w-auto flex md:flex-col justify-between md:justify-center items-center mb-2 md:mb-0 md:gap-12 px-2">
        <div className="flex flex-col md:items-center">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Score</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">{score.toString().padStart(4, '0')}</span>
        </div>
        
        <div className="flex items-center gap-4 md:flex-col md:gap-6">
          <div className="flex flex-col items-center">
            <Timer className="w-4 h-4 text-zinc-500 mb-1" />
            <span className="text-sm font-mono text-zinc-300">{formatTime(time)}</span>
          </div>
          <button 
            onClick={() => {
              setStatus(prev => {
                const next = prev === 'PLAYING' ? 'PAUSED' : 'PLAYING';
                playSound(next === 'PLAYING' ? 'resume' : 'pause');
                return next;
              });
            }}
            className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
          >
            {status === 'PLAYING' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-col items-end md:items-center">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Best</span>
          <span className="text-2xl font-mono font-bold text-amber-400">{highScore.toString().padStart(4, '0')}</span>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative p-1 md:mt-0 mt-2 bg-zinc-900 rounded-xl border-4 border-zinc-800 shadow-2xl shadow-emerald-500/10">
        <div 
          className="grid gap-px bg-zinc-950 overflow-hidden rounded-lg w-[min(90vw,400px)] h-[min(90vw,400px)] md:w-[min(75vh,500px)] md:h-[min(75vh,500px)]"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnakeHead = snake[0].x === x && snake[0].y === y;
            const isSnakeBody = snake.slice(1).some(s => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div 
                key={i} 
                className={`relative aspect-square rounded-sm transition-all duration-200 border-[0.5px] border-white/5 ${
                  isSnakeHead ? 'bg-emerald-400 shadow-[0_0_15px_#34d399] z-10 scale-110' :
                  isSnakeBody ? 'bg-emerald-600/80 scale-95' :
                  isFood ? 'bg-rose-500 rounded-full scale-75' :
                  'bg-zinc-900/10'
                }`}
              >
                {/* Snake Head (No Eyes) */}
                {isSnakeHead && (
                  <div className="absolute inset-0 bg-emerald-400 rounded-md shadow-[0_0_15px_#34d399]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Modals */}
        {status === 'START' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">NEON SNAKE</h1>
              <p className="text-zinc-400 text-sm mb-8 font-medium">Ready to play?</p>
              <button 
                onClick={resetGame}
                className="group relative px-12 py-4 bg-emerald-500 text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative flex items-center gap-2 text-lg">
                  <Play className="w-6 h-6 fill-current" /> PLAY NOW
                </span>
              </button>
          </div>
        )}

        {status === 'PAUSED' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
              <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">PAUSED</h2>
              <button 
                onClick={() => {
                  setStatus('PLAYING');
                  playSound('resume');
                }}
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
              >
                RESUME
              </button>
          </div>
        )}

        {status === 'GAME_OVER' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-rose-950/90 backdrop-blur-md rounded-lg p-6 text-center">
              <h2 className="text-4xl font-bold text-white mb-2 tracking-tighter">GAME OVER</h2>
              <p className="text-rose-200/60 text-sm mb-8 font-medium">Better luck next time!</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Final Score</span>
                  <span className="text-2xl font-mono font-bold text-white">{score}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Best Score</span>
                  <span className="text-2xl font-mono font-bold text-amber-400">{highScore}</span>
                </div>
              </div>

              <button 
                onClick={resetGame}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors active:scale-95"
              >
                <RotateCcw className="w-5 h-5" /> PLAY AGAIN
              </button>
          </div>
        )}
      </div>

      {/* Mobile Controls (D-Pad Container) */}
{/* Ultra-Compact D-Pad Container */}
<div className="mt-8 md:hidden flex justify-center items-center pointer-events-none">
  <div className="relative mt-15 w-30 h-30 bg-zinc-900/40 rounded-full border border-white/5 pointer-events-auto shadow-inner">
    {(['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).map((dir) => {
      const config = controlsConfig[dir];
      const Icon = { UP: ChevronUp, DOWN: ChevronDown, LEFT: ChevronLeft, RIGHT: ChevronRight }[dir];
      
      // Forces buttons into a tight cross-cluster
      const basePos = {
        UP: 'top-1 left-1/2 -translate-x-1/2',
        DOWN: 'bottom-1 left-1/2 -translate-x-1/2',
        LEFT: 'left-1 top-1/2 -translate-y-1/2',
        RIGHT: 'right-1 top-1/2 -translate-y-1/2',
      }[dir];

      return (
        <div
          key={dir}
          className={`absolute ${basePos} z-40 ${
            isEditingControls ? 'ring-2 ring-emerald-500 rounded-xl bg-zinc-800/90 cursor-move' : ''
          }`}
          style={{
            transform: `translate(${config.x}px, ${config.y}px) scale(${config.scale})`,
            touchAction: 'none',
          }}
          onPointerDown={(e) => {
            if (!isEditingControls) return;
            if ((e.target as HTMLElement).closest('[data-resize-handle="true"]')) return;
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            dragStateRef.current = {
              pointerId: e.pointerId, dir, startX: e.clientX, startY: e.clientY,
              originX: config.x, originY: config.y,
            };
          }}
          onPointerMove={(e) => {
            const dragState = dragStateRef.current;
            if (!dragState || dragState.pointerId !== e.pointerId || dragState.dir !== dir) return;
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;
            setControlsConfig(prev => ({
              ...prev, [dir]: { ...prev[dir], x: dragState.originX + dx, y: dragState.originY + dy },
            }));
          }}
          onPointerUp={(e) => { if (dragStateRef.current?.pointerId === e.pointerId) dragStateRef.current = null; }}
        >
          {/* Resize Handle */}
          {isEditingControls && (
            <div
              data-resize-handle="true"
              className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center cursor-nwse-resize shadow-lg z-50"
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                resizeStateRef.current = { pointerId: e.pointerId, dir, startY: e.clientY, startScale: config.scale };
              }}
              onPointerMove={(e) => {
                const resizeState = resizeStateRef.current;
                if (!resizeState || resizeState.pointerId !== e.pointerId || resizeState.dir !== dir) return;
                const delta = resizeState.startY - e.clientY;
                const newScale = Math.max(0.5, Math.min(2.5, resizeState.startScale + delta / 50));
                setControlsConfig(prev => ({ ...prev, [dir]: { ...prev[dir], scale: newScale } }));
              }}
              onPointerUp={() => { resizeStateRef.current = null; }}
            >
              <Maximize2 className="w-3 h-3 text-black" />
            </div>
          )}
          
          <button 
            onPointerDown={() => !isEditingControls && status === 'PLAYING' && changeDirection(dir)}
            className="w-15 h-15 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 active:bg-emerald-500/20 active:text-emerald-400 active:scale-95 transition-all shadow-xl"
          >
            <Icon className="w-7 h-7" />
          </button>
        </div>
      );
    })}
    {/* Center visual cap to hide overlap edges */}
    <div className="absolute inset-0 m-auto w-5 h-5 bg-zinc-800/40 rounded-full border border-white/5 pointer-events-none" />
  </div>
</div>

{/* Actions (Reset & Edit) */}
<div className="fixed justify-center items-center  bottom-6 right-6 md:hidden z-50 flex flex-col gap-2">
  {isEditingControls && (
    <button
      onClick={() => { resetControls(); playSound('resume'); }}
      className="w-10 h-10 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center transition-all active:scale-90"
    >
      <RotateCcw className="w-4 h-4" />
    </button>
  )}
  <button
    onClick={() => {
      setIsEditingControls(!isEditingControls);
      if (status === 'PLAYING') setStatus('PAUSED');
      playSound('pause');
    }}
    className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 ${
      isEditingControls ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
    }`}
  >
    {isEditingControls ? <Check className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
  </button>
</div>


    </div>
  );
}
