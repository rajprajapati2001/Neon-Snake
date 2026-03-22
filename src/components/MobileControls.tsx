import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  Maximize2,
  RotateCcw
} from 'lucide-react';
import { ControlsConfig, Direction, GameStatus } from '../types';

type MobileControlsProps = {
  status: GameStatus;
  isEditingControls: boolean;
  controlsConfig: ControlsConfig;
  setControlsConfig: Dispatch<SetStateAction<ControlsConfig>>;
  onDirection: (direction: Direction) => void;
  onToggleEdit: () => void;
  onResetControls: () => void;
};

export const MobileControls = ({
  status,
  isEditingControls,
  controlsConfig,
  setControlsConfig,
  onDirection,
  onToggleEdit,
  onResetControls
}: MobileControlsProps) => {
  const dragStateRef = useRef<{
    pointerId: number;
    dir: Direction;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resizeStateRef = useRef<{
    pointerId: number;
    dir: Direction;
    startY: number;
    startScale: number;
  } | null>(null);

  return (
    <>
      <div className="mt-8 md:hidden flex justify-center items-center pointer-events-none">
        <div className="relative mt-13 w-30 h-30 bg-zinc-900/40 rounded-full border border-white/5 pointer-events-auto shadow-inner">
          {(['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).map(dir => {
            const config = controlsConfig[dir];
            const Icon = { UP: ChevronUp, DOWN: ChevronDown, LEFT: ChevronLeft, RIGHT: ChevronRight }[dir];

            const basePos = {
              UP: 'top-1 left-1/2 -translate-x-1/2',
              DOWN: 'bottom-1 left-1/2 -translate-x-1/2',
              LEFT: 'left-1 top-1/2 -translate-y-1/2',
              RIGHT: 'right-1 top-1/2 -translate-y-1/2'
            }[dir];

            return (
              <div
                key={dir}
                className={`absolute ${basePos} z-40 ${
                  isEditingControls ? 'ring-2 ring-emerald-500 rounded-xl bg-zinc-800/90 cursor-move' : ''
                }`}
                style={{
                  transform: `translate(${config.x}px, ${config.y}px) scale(${config.scale})`,
                  touchAction: 'none'
                }}
                onPointerDown={e => {
                  if (!isEditingControls) return;
                  if ((e.target as HTMLElement).closest('[data-resize-handle="true"]')) return;
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  dragStateRef.current = {
                    pointerId: e.pointerId,
                    dir,
                    startX: e.clientX,
                    startY: e.clientY,
                    originX: config.x,
                    originY: config.y
                  };
                }}
                onPointerMove={e => {
                  const dragState = dragStateRef.current;
                  if (!dragState || dragState.pointerId !== e.pointerId || dragState.dir !== dir) return;
                  const dx = e.clientX - dragState.startX;
                  const dy = e.clientY - dragState.startY;
                  setControlsConfig(prev => ({
                    ...prev,
                    [dir]: { ...prev[dir], x: dragState.originX + dx, y: dragState.originY + dy }
                  }));
                }}
                onPointerUp={e => {
                  if (dragStateRef.current?.pointerId === e.pointerId) dragStateRef.current = null;
                }}
              >
                {isEditingControls && (
                  <div
                    data-resize-handle="true"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center cursor-nwse-resize shadow-lg z-50"
                    onPointerDown={e => {
                      e.stopPropagation();
                      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                      resizeStateRef.current = {
                        pointerId: e.pointerId,
                        dir,
                        startY: e.clientY,
                        startScale: config.scale
                      };
                    }}
                    onPointerMove={e => {
                      const resizeState = resizeStateRef.current;
                      if (!resizeState || resizeState.pointerId !== e.pointerId || resizeState.dir !== dir) return;
                      const delta = resizeState.startY - e.clientY;
                      const newScale = Math.max(0.5, Math.min(2.5, resizeState.startScale + delta / 50));
                      setControlsConfig(prev => ({ ...prev, [dir]: { ...prev[dir], scale: newScale } }));
                    }}
                    onPointerUp={() => {
                      resizeStateRef.current = null;
                    }}
                  >
                    <Maximize2 className="w-3 h-3 text-black" />
                  </div>
                )}

                <button
                  onPointerDown={() => !isEditingControls && status === 'PLAYING' && onDirection(dir)}
                  className="w-15 h-15 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 active:bg-emerald-500/20 active:text-emerald-400 active:scale-95 transition-all shadow-xl"
                >
                  <Icon className="w-7 h-7" />
                </button>
              </div>
            );
          })}
          <div className="absolute inset-0 m-auto w-5 h-5 bg-zinc-800/40 rounded-full border border-white/5 pointer-events-none" />
        </div>
      </div>

      <div className="fixed justify-center items-center bottom-4 right-4 md:hidden z-50 flex flex-col gap-2">
        {isEditingControls && (
          <button
            onClick={onResetControls}
            className="w-8 h-8 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center transition-all active:scale-90"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onToggleEdit}
          className={`w-8 h-8 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 ${
            isEditingControls ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
          }`}
        >
          {isEditingControls ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
};
