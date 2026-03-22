import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEventHandler, TouchEventHandler } from 'react';
import { GRID_SIZE, INITIAL_SPEED, Direction, GameStatus, Point } from '../types';
import { playSound } from '../utils/sound';

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 }
];

type UseSnakeGameArgs = {
  isEditingControls: boolean;
};

export const useSnakeGame = ({ isEditingControls }: UseSnakeGameArgs) => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    const parsed = saved ? Number.parseInt(saved, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [time, setTime] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const directionRef = useRef<Direction>('UP');
  const lastProcessedDirectionRef = useRef<Direction>('UP');
  const touchStartRef = useRef<Point | null>(null);
  const hasPlayedHighScoreSoundRef = useRef(false);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let nextFood: Point;
    while (true) {
      nextFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const isOnSnake = currentSnake.some(
        segment => segment.x === nextFood.x && segment.y === nextFood.y
      );
      if (!isOnSnake) break;
    }
    return nextFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood(INITIAL_SNAKE));
    directionRef.current = 'UP';
    lastProcessedDirectionRef.current = 'UP';
    setScore(0);
    setTime(0);
    setStatus('PLAYING');
    hasPlayedHighScoreSoundRef.current = false;
    playSound('resume');
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };
      const currentDir = directionRef.current;

      switch (currentDir) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
      }

      if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
      if (newHead.x >= GRID_SIZE) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
      if (newHead.y >= GRID_SIZE) newHead.y = 0;

      const isFoodCollision = newHead.x === food.x && newHead.y === food.y;
      const collisionBody = isFoodCollision ? prevSnake : prevSnake.slice(0, -1);

      if (collisionBody.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setStatus('GAME_OVER');
        playSound('gameover');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (isFoodCollision) {
        setScore(prev => {
          const nextScore = prev + 10;
          if (nextScore > highScore && !hasPlayedHighScoreSoundRef.current) {
            playSound('highscore');
            hasPlayedHighScoreSoundRef.current = true;
          } else {
            playSound('food');
          }
          return nextScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      lastProcessedDirectionRef.current = currentDir;
      return newSnake;
    });
  }, [food, generateFood, highScore]);

  const moveSnakeRef = useRef(moveSnake);
  useEffect(() => {
    moveSnakeRef.current = moveSnake;
  }, [moveSnake]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (status === 'PLAYING') {
        if (!lastUpdateTimeRef.current) lastUpdateTimeRef.current = timestamp;
        const elapsed = timestamp - lastUpdateTimeRef.current;

        if (elapsed > INITIAL_SPEED) {
          moveSnakeRef.current();
          lastUpdateTimeRef.current = timestamp;
        }
        gameLoopRef.current = requestAnimationFrame(loop);
      }
    };

    if (status === 'PLAYING') {
      gameLoopRef.current = requestAnimationFrame(loop);
      timerRef.current = setInterval(() => setTime(prev => prev + 1), 1000);
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      lastUpdateTimeRef.current = 0;
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  const changeDirection = useCallback((newDir: Direction) => {
    const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (newDir !== opposites[lastProcessedDirectionRef.current]) {
      directionRef.current = newDir;
    }
  }, []);

  const togglePause = useCallback(() => {
    setStatus(prev => {
      const next = prev === 'PLAYING' ? 'PAUSED' : 'PLAYING';
      playSound(next === 'PLAYING' ? 'resume' : 'pause');
      return next;
    });
  }, []);

  const resumeGame = useCallback(() => {
    setStatus('PLAYING');
    playSound('resume');
  }, []);

  const pauseGame = useCallback(() => {
    setStatus(prev => (prev === 'PLAYING' ? 'PAUSED' : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (status === 'START' || status === 'GAME_OVER') {
          resetGame();
        } else {
          togglePause();
        }
        return;
      }

      if (status !== 'PLAYING') return;
      switch (e.key) {
        case 'ArrowUp':
          changeDirection('UP');
          break;
        case 'ArrowDown':
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
          changeDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, resetGame, togglePause, changeDirection]);

  const onTouchStart: TouchEventHandler<HTMLDivElement> = e => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchMove: TouchEventHandler<HTMLDivElement> = e => {
    if (!touchStartRef.current || status !== 'PLAYING' || isEditingControls) return;

    const touchMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const dx = touchMove.x - touchStartRef.current.x;
    const dy = touchMove.y - touchStartRef.current.y;
    const threshold = 30;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (!hasSwiped) setHasSwiped(true);
      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
      touchStartRef.current = touchMove;
    }
  };

  const onTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
    touchStartRef.current = null;
  };

  const onMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove: MouseEventHandler<HTMLDivElement> = e => {
    if (!touchStartRef.current || status !== 'PLAYING' || isEditingControls) return;

    const mouseMove = { x: e.clientX, y: e.clientY };
    const dx = mouseMove.x - touchStartRef.current.x;
    const dy = mouseMove.y - touchStartRef.current.y;
    const threshold = 30;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (!hasSwiped) setHasSwiped(true);
      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
      touchStartRef.current = mouseMove;
    }
  };

  const onMouseUp: MouseEventHandler<HTMLDivElement> = () => {
    touchStartRef.current = null;
  };

  return {
    snake,
    food,
    status,
    score,
    highScore,
    time,
    hasSwiped,
    resetGame,
    changeDirection,
    togglePause,
    resumeGame,
    pauseGame,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp
  };
};
