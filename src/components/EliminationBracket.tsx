import { memo, useMemo } from 'react';
import { Tournament, TournamentRound, Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Swords } from 'lucide-react';
import StreakFrame from '@/components/StreakFrame';

interface EliminationBracketProps {
  rounds: TournamentRound[];
  getPlayer: (id: string) => Player | undefined;
  currentRound?: number;
  champion?: string;
}

function EliminationBracketView({ rounds, getPlayer, currentRound, champion }: EliminationBracketProps) {
  if (rounds.length === 0) return null;

  return (
    <div className="glass-panel p-4 overflow-x-auto">
      <p className="font-heading text-[10px] tracking-[0.2em] text-accent uppercase mb-4 flex items-center gap-2">
        <Swords className="h-3 w-3 text-accent" />
        CHAVE ELIMINATÓRIA
      </p>
      <div className="flex gap-8 min-w-max items-center">
        {rounds.map((round, ri) => (
          <EliminationRoundColumn
            key={ri}
            round={round}
            roundIndex={ri}
            getPlayer={getPlayer}
            isHighlighted={currentRound === ri}
            totalRounds={rounds.length}
          />
        ))}
        {/* Champion display */}
        {champion && (
          <div className="flex flex-col items-center gap-2 min-w-[120px]">
            <div className="text-center font-heading text-[10px] tracking-[0.15em] uppercase pb-2 border-b text-accent border-accent/50">
              CAMPEÃO
            </div>
            <div className="flex flex-col items-center gap-2 py-4">
              <StreakFrame streak={0} size={64} rankPosition={1}>
                <Avatar className="h-16 w-16 border-2 border-accent">
                  {(() => {
                    const p = getPlayer(champion);
                    if (!p) return <AvatarFallback className="bg-muted">?</AvatarFallback>;
                    return p.avatar.startsWith('http') || p.avatar.startsWith('data:')
                      ? <AvatarImage src={p.avatar} />
                      : <AvatarFallback className="bg-muted text-2xl">{p.avatar}</AvatarFallback>;
                  })()}
                </Avatar>
              </StreakFrame>
              <span className="font-heading text-sm font-bold text-accent italic">
                {getPlayer(champion)?.nickname || getPlayer(champion)?.name || '?'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const EliminationRoundColumn = memo(function EliminationRoundColumn({
  round, roundIndex, getPlayer, isHighlighted, totalRounds,
}: {
  round: TournamentRound;
  roundIndex: number;
  getPlayer: (id: string) => Player | undefined;
  isHighlighted: boolean;
  totalRounds: number;
}) {
  const nonByeMatches = round.matches.filter(m => !m.isBye);
  const spacing = Math.pow(2, roundIndex);

  return (
    <div className="flex flex-col gap-3 min-w-[200px]" style={{ gap: `${spacing * 12}px` }}>
      <div className={`text-center font-heading text-[10px] tracking-[0.15em] uppercase pb-2 border-b ${isHighlighted ? 'text-accent border-accent/50' : 'text-muted-foreground border-border/30'}`}>
        {round.label || `RODADA ${roundIndex + 1}`}
      </div>
      {nonByeMatches.map((match) => {
        const p1 = getPlayer(match.player1Id);
        const p2 = getPlayer(match.player2Id);
        const hasResult = !!match.result;
        const winnerId = match.result?.winnerId;

        return (
          <div
            key={match.id}
            className={`relative border rounded-lg overflow-hidden transition-all ${hasResult ? 'border-accent/30' : 'border-border/50'} ${isHighlighted && !hasResult ? 'ring-1 ring-accent/30' : ''}`}
          >
            {hasResult && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-accent/60 to-accent/20 rounded-l" />
            )}
            <EliminationSlot player={p1} points={match.player1Points} isWinner={winnerId === match.player1Id} hasResult={hasResult} />
            <div className="h-px bg-border/30" />
            <EliminationSlot player={p2} points={match.player2Points} isWinner={winnerId === match.player2Id} hasResult={hasResult} />
          </div>
        );
      })}
      {round.matches.filter(m => m.isBye).map(m => (
        <div key={m.id} className="border border-dashed border-accent/30 rounded-lg p-2 flex items-center gap-2">
          <span className="text-[9px] font-heading text-accent tracking-wider">BYE</span>
          <span className="text-[10px] font-heading text-muted-foreground truncate">
            {getPlayer(m.player1Id)?.nickname || getPlayer(m.player1Id)?.name || '?'}
          </span>
        </div>
      ))}
    </div>
  );
});

const EliminationSlot = memo(function EliminationSlot({ player, points, isWinner, hasResult }: {
  player: Player | undefined;
  points: number;
  isWinner: boolean;
  hasResult: boolean;
}) {
  if (!player) return <div className="h-8 bg-muted/20" />;

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 transition-all ${isWinner ? 'bg-accent/10' : hasResult ? 'opacity-50' : ''}`}>
      <StreakFrame streak={0} size={20} showBadge={false} animated={false}>
        <Avatar className="h-5 w-5 border border-border/50 shrink-0">
          {player.avatar.startsWith('http') || player.avatar.startsWith('data:')
            ? <AvatarImage src={player.avatar} />
            : <AvatarFallback className="bg-muted text-[7px]">{player.avatar}</AvatarFallback>}
        </Avatar>
      </StreakFrame>
      <span className={`text-[10px] font-heading truncate flex-1 ${isWinner ? 'text-accent font-bold' : 'text-foreground'}`}>
        {player.nickname || player.name.split(' ')[0]}
      </span>
      {hasResult && (
        <span className={`text-[10px] font-heading font-bold ${isWinner ? 'text-accent' : 'text-muted-foreground'}`}>
          {points}
        </span>
      )}
      {isWinner && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
    </div>
  );
});

export default memo(EliminationBracketView);
