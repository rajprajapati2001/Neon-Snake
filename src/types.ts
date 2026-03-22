export type Point = { x: number; y: number };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
export type ControlsConfig = Record<Direction, { x: number; y: number; scale: number }>;

export const GRID_SIZE = 20;
export const INITIAL_SPEED = 120;

export const DEFAULT_CONTROLS_CONFIG: ControlsConfig = {
  UP: { x: 0, y: -50, scale: 1 },
  DOWN: { x: 0, y: 50, scale: 1 },
  LEFT: { x: -50, y: 0, scale: 1 },
  RIGHT: { x: 50, y: 0, scale: 1 }
};
