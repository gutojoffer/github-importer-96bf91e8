import { getEloFromXP } from '@/types/tournament';

interface EloBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function EloBadge({ xp, size = 'sm', showLabel = true }: EloBadgeProps) {
  const elo = getEloFromXP(xp);
  const sizeClasses = {
    sm: 'h-6 w-6 text-[8px]',
    md: 'h-8 w-8 text-[10px]',
    lg: 'h-12 w-12 text-xs',
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Shield badge */}
      <div
        className={`${sizeClasses[size]} flex items-center justify-center relative`}
        style={{ color: `hsl(${elo.tier.color})` }}
      >
        <svg viewBox="0 0 24 28" className="w-full h-full" fill="none">
          <path
            d="M12 1L2 6V14C2 20 6.5 25.5 12 27C17.5 25.5 22 20 22 14V6L12 1Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fill="currentColor"
            fontWeight="bold"
            fontSize={elo.division ? "8" : "7"}
            fontFamily="Rajdhani, sans-serif"
          >
            {elo.division ?? '★'}
          </text>
        </svg>
      </div>
      {showLabel && (
        <span
          className="font-heading font-bold tracking-wide truncate"
          style={{
            color: `hsl(${elo.tier.color})`,
            fontSize: size === 'lg' ? '0.875rem' : size === 'md' ? '0.75rem' : '0.625rem',
          }}
        >
          {elo.label}
        </span>
      )}
    </div>
  );
}
