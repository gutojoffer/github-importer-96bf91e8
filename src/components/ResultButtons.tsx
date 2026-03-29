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
  { type: 'spin', label: 'FINISH (SPIN)', icon: <RotateCcw className="h-5 w-5" /> },
  { type: 'over', label: 'FINISH (OVER)', icon: <ArrowDown className="h-5 w-5" /> },
  { type: 'burst', label: 'BURST', icon: <Flame className="h-5 w-5" /> },
  { type: 'extreme', label: 'EXTREME', icon: <Zap className="h-5 w-5" /> },
];

export default function ResultButtons({ playerName, side, onResult, disabled }: ResultButtonsProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <p className={`font-heading text-xs font-bold tracking-wider mb-1 uppercase ${side === 'left' ? 'text-primary' : 'text-accent'}`}>
        {playerName}
      </p>
      {finishTypes.map(({ type, label, icon }) => (
        <Button
          key={type}
          variant="outline"
          disabled={disabled}
          onClick={() => onResult(type)}
          className={`w-full justify-between gap-2 font-heading tracking-wide text-xs h-9
            ${type === 'burst'
              ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
              : type === 'extreme'
                ? 'border-accent/40 text-accent-foreground hover:bg-accent/15'
                : 'border-border hover:border-primary/40 hover:bg-primary/5'
            }`}
        >
          <span className="flex items-center gap-2">{icon} {label}</span>
          <span className="text-[10px] opacity-70 font-bold">+{FINISH_POINTS[type]}</span>
        </Button>
      ))}
    </div>
  );
}
