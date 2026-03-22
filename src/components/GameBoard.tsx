import { Play, RotateCcw } from 'lucide-react';
import { GRID_SIZE, GameStatus, Point } from '../types';

type GameBoardProps = {
  snake: Point[];
  food: Point;
  status: GameStatus;
  score: number;
  highScore: number;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
};

export const GameBoard = ({
  snake,
  food,
  status,
  score,
  highScore,
  onStart,
  onResume,
  onRestart
}: GameBoardProps) => {
  return (
    <div className="relative p-1 md:mt-0 mt-2 bg-zinc-900 rounded-xl border-4 border-zinc-850 shadow-2xl shadow-emerald-500/10">
      <div
        className="relative bg-zinc-950 overflow-hidden rounded-lg w-[min(90vw,400px)] h-[min(90vw,400px)] md:w-[min(75vh,500px)] md:h-[min(75vh,500px)]"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
        }}
      >
        {/* Food */}
        <div
          className="bg-rose-500 rounded-full scale-75 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
          style={{
            gridColumn: food.x + 1,
            gridRow: food.y + 1
          }}
        />

        {/* Snake Body */}
        {snake.slice(1).map((segment, i) => (
          <div
            key={`body-${i}`}
            className="bg-emerald-600/80 scale-95 rounded-sm"
            style={{
              gridColumn: segment.x + 1,
              gridRow: segment.y + 1
            }}
          />
        ))}

        {/* Snake Head */}
        <div
          className="bg-emerald-400 shadow-[0_0_15px_#34d399] z-10 scale-110 rounded-sm"
          style={{
            gridColumn: snake[0].x + 1,
            gridRow: snake[0].y + 1
          }}
        />
      </div>

      {status === 'START' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">NEON SNAKE</h1>
          <p className="text-zinc-400 text-sm mb-8 font-medium">Ready to play?</p>
          <button
            onClick={onStart}
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
            onClick={onResume}
            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
          >
            RESUME
          </button>
        </div>
      )}

      {status === 'GAME_OVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-rose-950/30 backdrop-blur-md rounded-lg p-6 text-center">
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
            onClick={onRestart}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors active:scale-95"
          >
            <RotateCcw className="w-5 h-5" /> PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};
