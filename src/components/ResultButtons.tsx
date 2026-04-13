import { FinishType, FINISH_POINTS } from '@/types/tournament';
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
      {/* Column label */}
      <p
        className="font-heading font-bold uppercase w-full"
        style={{
          fontSize: 11,
          letterSpacing: 1.5,
          color: 'rgba(255,255,255,.6)',
          padding: '0 2px 6px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          marginBottom: 2,
        }}
      >
        {playerName}
      </p>
      {finishTypes.map(({ type, label, icon }) => (
        <button
          key={type}
          disabled={disabled}
          onClick={() => onResult(type)}
          className="w-full flex items-center justify-between gap-2 font-heading tracking-wider text-xs rounded-[9px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            padding: '10px 14px',
            background: '#111827',
            border: `1px solid ${isLeft ? 'rgba(37,99,235,.2)' : 'rgba(220,38,38,.2)'}`,
          }}
          onMouseEnter={e => {
            if (!disabled) {
              e.currentTarget.style.background = isLeft ? 'rgba(37,99,235,.09)' : 'rgba(220,38,38,.09)';
              e.currentTarget.style.borderColor = isLeft ? 'rgba(37,99,235,.4)' : 'rgba(220,38,38,.4)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#111827';
            e.currentTarget.style.borderColor = isLeft ? 'rgba(37,99,235,.2)' : 'rgba(220,38,38,.2)';
          }}
        >
          <span className="flex items-center gap-2" style={{ color: isLeft ? '#93C5FD' : '#FCA5A5' }}>
            {icon} {label}
          </span>
          <span
            className="font-bold text-xs px-2 py-0.5 rounded-md"
            style={{
              background: isLeft ? 'rgba(37,99,235,.12)' : 'rgba(220,38,38,.12)',
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
