import { FinishType, FINISH_POINTS } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Zap, RotateCcw, ArrowDown, Flame } from 'lucide-react';

interface ResultButtonsProps {
  playerName: string;
  side: 'left' | 'right';
  onResult: (finishType: FinishType) => void;
  disabled?: boolean;
}

const finishTypes: { type: FinishType; label: string; icon: React.ReactNode }[] = [
  { type: 'spin',    label: 'SPIN',   icon: <RotateCcw className="h-4 w-4" /> },
  { type: 'over',    label: 'OVER',   icon: <ArrowDown className="h-4 w-4" /> },
  { type: 'burst',   label: 'BURST',  icon: <Flame className="h-4 w-4" /> },
  { type: 'extreme', label: 'XTREME', icon: <Zap className="h-4 w-4" /> },
];

export default function ResultButtons({ playerName, side, onResult, disabled }: ResultButtonsProps) {
  const isLeft = side === 'left';

  return (
    <div className={`flex flex-col gap-2 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <p className="font-heading text-[10px] font-bold tracking-[0.15em] mb-0.5 uppercase text-muted-foreground">
        {playerName}
      </p>
      {finishTypes.map(({ type, label, icon }) => (
        <button
          key={type}
          disabled={disabled}
          onClick={() => onResult(type)}
          className={`
            w-full flex items-center justify-between gap-2 font-heading tracking-wider text-xs h-10 rounded-lg px-4
            transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
            ${isLeft
              ? 'arena-btn-left'
              : 'arena-btn-right'
            }
          `}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span className="flex items-center gap-2 arena-btn-label">{icon} {label}</span>
          <span
            className="font-bold text-xs px-2 py-0.5 rounded-md"
            style={{
              background: isLeft ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)',
              color: isLeft ? '#60a5fa' : '#f87171',
            }}
          >
            +{FINISH_POINTS[type]}
          </span>
        </button>
      ))}
    </div>
  );
}
