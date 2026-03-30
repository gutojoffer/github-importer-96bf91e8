import { Tournament } from '@/types/tournament';
import { Swords, Target, Zap } from 'lucide-react';

interface TournamentHUDProps {
  tournament: Tournament;
  pendingCount: number;
  totalMatches: number;
}

export default function TournamentHUD({ tournament, pendingCount, totalMatches }: TournamentHUDProps) {
  const completedCount = totalMatches - pendingCount;
  const progress = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0;

  return (
    <div className="dark-panel border-primary/30 relative overflow-hidden">
      {/* Progress bar background */}
      <div
        className="absolute inset-0 bg-primary/5 transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />

      <div className="relative flex items-center justify-between gap-4 px-4 py-3 flex-wrap">
        {/* Tournament name */}
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <span className="font-heading text-sm font-bold tracking-wider text-foreground italic uppercase">
            {tournament.name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-accent" />
            <span className="font-heading text-xs tracking-wider text-muted-foreground">
              RODADA:
            </span>
            <span className="font-heading text-sm font-bold text-accent">
              {tournament.currentRound + 1}
              <span className="text-muted-foreground font-normal"> / {tournament.totalRounds}</span>
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-secondary" />
            <span className="font-heading text-xs tracking-wider text-muted-foreground">
              PARTIDAS:
            </span>
            <span className="font-heading text-sm font-bold text-secondary">
              {completedCount}
              <span className="text-muted-foreground font-normal"> / {totalMatches}</span>
            </span>
          </div>

          {pendingCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="font-heading text-[10px] tracking-[0.15em] text-primary anim-pulse font-bold">
                {pendingCount} PENDENTE{pendingCount > 1 ? 'S' : ''}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
