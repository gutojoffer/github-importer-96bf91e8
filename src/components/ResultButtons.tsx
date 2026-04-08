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
  const borderColor = isLeft ? 'border-[#4F8EF7]/40' : 'border-[#EF4444]/40';
  const hoverBg = isLeft ? 'hover:bg-[#4F8EF7]/10' : 'hover:bg-[#EF4444]/10';
  const textColor = isLeft ? 'text-[#4F8EF7]' : 'text-[#EF4444]';
  const labelColor = isLeft ? 'text-[#4F8EF7]' : 'text-[#EF4444]';

  return (
    <div className={`flex flex-col gap-2 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <p className={`font-heading text-[10px] font-bold tracking-[0.15em] mb-0.5 uppercase ${labelColor}`}>
        {playerName}
      </p>
      {finishTypes.map(({ type, label, icon }) => (
        <Button
          key={type}
          variant="outline"
          disabled={disabled}
          onClick={() => onResult(type)}
          className={`w-full justify-between gap-2 font-heading tracking-wider text-xs h-10 rounded-xl px-4
            ${borderColor} ${hoverBg} ${textColor} transition-all duration-200
            hover:scale-[1.02] active:scale-95`}
        >
          <span className="flex items-center gap-2">{icon} {label}</span>
          <span className="font-bold text-xs opacity-70 bg-white/5 px-2 py-0.5 rounded-md">+{FINISH_POINTS[type]}</span>
        </Button>
      ))}
    </div>
  );
}
