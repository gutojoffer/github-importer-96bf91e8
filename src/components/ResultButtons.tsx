import { FinishType } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Zap, RotateCcw, ArrowDown, Flame } from 'lucide-react';

interface ResultButtonsProps {
  playerName: string;
  side: 'left' | 'right';
  onResult: (finishType: FinishType) => void;
  disabled?: boolean;
}

const finishTypes: { type: FinishType; label: string; icon: React.ReactNode; points: string }[] = [
  { type: 'spin', label: 'Spin Finish', icon: <RotateCcw className="h-5 w-5" />, points: '+1' },
  { type: 'over', label: 'Over Finish', icon: <ArrowDown className="h-5 w-5" />, points: '+1' },
  { type: 'burst', label: 'Burst Finish', icon: <Flame className="h-5 w-5" />, points: '+1' },
  { type: 'extreme', label: 'Xtreme Finish', icon: <Zap className="h-5 w-5" />, points: '+3' },
];

export default function ResultButtons({ playerName, side, onResult, disabled }: ResultButtonsProps) {
  return (
    <div className={`flex flex-col gap-2 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <p className={`font-heading text-sm font-bold tracking-wide mb-1 ${side === 'left' ? 'text-primary' : 'text-accent'}`}>
        Vitória de {playerName}
      </p>
      {finishTypes.map(({ type, label, icon, points }) => (
        <Button
          key={type}
          variant={type === 'extreme' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onResult(type)}
          className={`w-full justify-between gap-2 font-heading tracking-wide text-sm
            ${type === 'extreme'
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary'
              : 'border-border hover:border-primary/50'
            }`}
        >
          <span className="flex items-center gap-2">{icon} {label}</span>
          <span className="text-xs opacity-70">{points}</span>
        </Button>
      ))}
    </div>
  );
}
