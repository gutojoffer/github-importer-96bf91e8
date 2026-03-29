import { FinishType, FINISH_POINTS } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Zap, RotateCcw, ArrowDown, Flame } from 'lucide-react';

interface ResultButtonsProps {
  playerName: string;
  side: 'left' | 'right';
  onResult: (finishType: FinishType) => void;
  disabled?: boolean;
}

const finishTypes: { type: FinishType; label: string; icon: React.ReactNode; accent?: string }[] = [
  { type: 'spin', label: 'SPIN FINISH', icon: <RotateCcw className="h-4 w-4" /> },
  { type: 'over', label: 'OVER FINISH', icon: <ArrowDown className="h-4 w-4" /> },
  { type: 'burst', label: 'BURST FINISH', icon: <Flame className="h-4 w-4" />, accent: 'border-primary/50 text-primary hover:bg-primary/10' },
  { type: 'extreme', label: 'XTREME FINISH', icon: <Zap className="h-4 w-4" />, accent: 'border-secondary/50 text-secondary hover:bg-secondary/10' },
];

export default function ResultButtons({ playerName, side, onResult, disabled }: ResultButtonsProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <p className={`font-heading text-[10px] font-bold tracking-[0.15em] mb-1 uppercase ${side === 'left' ? 'text-primary' : 'text-accent'}`}>
        {playerName}
      </p>
      {finishTypes.map(({ type, label, icon, accent }) => (
        <Button
          key={type}
          variant="outline"
          disabled={disabled}
          onClick={() => onResult(type)}
          className={`w-full justify-between gap-2 font-heading tracking-wider text-[10px] h-8
            ${accent || 'border-border hover:border-muted-foreground/30'}`}
        >
          <span className="flex items-center gap-1.5">{icon} {label}</span>
          <span className="font-bold opacity-70">+{FINISH_POINTS[type]}</span>
        </Button>
      ))}
    </div>
  );
}
