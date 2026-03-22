import { Pause, Play, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameStatus } from '../types';
// @ts-ignore
import swipeIcon from '../assets/swipleicon.png';

type HudProps = {
  score: number;
  highScore: number;
  time: number;
  status: GameStatus;
  hasSwiped: boolean;
  onTogglePause: () => void;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Hud = ({ score, highScore, time, status, hasSwiped, onTogglePause }: HudProps) => {
  return (
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
          onClick={onTogglePause}
          className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
        >
          {status === 'PLAYING' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <motion.div
          animate={!hasSwiped ? { rotate: [0, 45, 0] } : { rotate: 0 }}
          transition={!hasSwiped ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-full p-1"
          title="Swipe to move"
        >
          <img src={swipeIcon} alt="Swipe" className="w-full h-full object-contain invert opacity-70" />
        </motion.div>
      </div>

      <div className="flex flex-col items-end md:items-center">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Best</span>
        <span className="text-2xl font-mono font-bold text-amber-400">{highScore.toString().padStart(4, '0')}</span>
      </div>
    </div>
  );
};
