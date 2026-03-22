import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { Hud } from './components/Hud';
import { MobileControls } from './components/MobileControls';
import { useSnakeGame } from './hooks/useSnakeGame';
import { ControlsConfig, DEFAULT_CONTROLS_CONFIG } from './types';
import { parseSafeJSON } from './utils/json';
import { getSoundEnabled, playSound, setSoundEnabled } from './utils/sound';

export default function App() {
  const [isEditingControls, setIsEditingControls] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(getSoundEnabled());
  const [controlsConfig, setControlsConfig] = useState<ControlsConfig>(() => {
    return parseSafeJSON(localStorage.getItem('snakeControlsConfigV3'), DEFAULT_CONTROLS_CONFIG);
  });

  const game = useSnakeGame({ isEditingControls });

  const resetControls = () => {
    const freshConfig = JSON.parse(JSON.stringify(DEFAULT_CONTROLS_CONFIG));
    setControlsConfig(freshConfig);
    localStorage.setItem('snakeControlsConfigV3', JSON.stringify(freshConfig));
  };

  useEffect(() => {
    localStorage.setItem('snakeControlsConfigV3', JSON.stringify(controlsConfig));
  }, [controlsConfig]);

  const handleToggleControlsEdit = () => {
    setIsEditingControls(prev => !prev);
    if (game.status === 'PLAYING') {
      game.pauseGame();
    }
    playSound('pause');
  };
  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playSound('resume');
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row items-center md:justify-center justify-top md:mt-0 mt-2 min-h-screen bg-[#0a0a0a] font-sans p-2 sm:p-4 md:p-12 md:gap-16 select-none touch-none"
      onTouchStart={game.onTouchStart}
      onTouchMove={game.onTouchMove}
      onTouchEnd={game.onTouchEnd}
      onMouseDown={game.onMouseDown}
      onMouseMove={game.onMouseMove}
      onMouseUp={game.onMouseUp}
      onMouseLeave={game.onMouseUp}
    >
      <Hud
        score={game.score}
        highScore={game.highScore}
        time={game.time}
        status={game.status}
        hasSwiped={game.hasSwiped}
        onTogglePause={game.togglePause}
      />

      <GameBoard
        snake={game.snake}
        food={game.food}
        status={game.status}
        score={game.score}
        highScore={game.highScore}
        onStart={game.resetGame}
        onResume={game.resumeGame}
        onRestart={game.resetGame}
      />

      <MobileControls
        status={game.status}
        isEditingControls={isEditingControls}
        controlsConfig={controlsConfig}
        setControlsConfig={setControlsConfig}
        onDirection={game.changeDirection}
        onToggleEdit={handleToggleControlsEdit}
        onResetControls={() => {
          resetControls();
          playSound('resume');
        }}
      />

      {/* Sound Toggle (Bottom Left) */}
      <div className="fixed bottom-4 left-4 z-50 md:hidden">
        <button
          onClick={handleToggleSound}
          className={`w-8 h-8 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 border border-zinc-800 ${
            isSoundOn ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
          }`}
        >
          {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
