import { Tournament } from '@/types/tournament';
import { Trophy, Target, Zap } from 'lucide-react';

interface TournamentHUDProps {
  tournament: Tournament;
  pendingCount: number;
  totalMatches: number;
}

export default function TournamentHUD({ tournament, pendingCount, totalMatches }: TournamentHUDProps) {
  const completedCount = totalMatches - pendingCount;
  const progress = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0;
  const roundsLeft = tournament.totalRounds - tournament.currentRound - 1;

  return (
    <div className="glass-panel relative overflow-hidden glow-cyan">
      {/* Progress bar */}
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/10 to-primary/5 transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />

      <div className="relative flex items-center justify-between gap-4 px-4 py-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-heading text-sm font-bold tracking-wider text-foreground italic uppercase">
            {tournament.name}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading text-xs tracking-wider text-muted-foreground">RODADA:</span>
            <span className="font-heading text-sm font-bold text-primary">
              {tournament.currentRound + 1}
              <span className="text-muted-foreground font-normal"> / {tournament.totalRounds}</span>
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-secondary" />
            <span className="font-heading text-xs tracking-wider text-muted-foreground">PARTIDAS:</span>
            <span className="font-heading text-sm font-bold text-secondary">
              {completedCount}
              <span className="text-muted-foreground font-normal"> / {totalMatches}</span>
            </span>
          </div>

          {roundsLeft > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="font-heading text-[10px] tracking-[0.15em] text-accent font-bold">
                FALTAM {roundsLeft} RODADA{roundsLeft > 1 ? 'S' : ''}
              </span>
            </>
          )}

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
