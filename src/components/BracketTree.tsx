import { memo, useMemo } from 'react';
import { Tournament, Player, TournamentRound } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BracketTreeProps {
  tournament: Tournament;
  getPlayer: (id: string) => Player | undefined;
  currentRoundHighlight?: number;
  onDropPlayer?: (playerId: string) => void;
}

function BracketTree({ tournament, getPlayer, currentRoundHighlight, onDropPlayer }: BracketTreeProps) {
  const rounds = tournament.rounds;
  const droppedIds = new Set(tournament.droppedPlayerIds || []);
  const isActive = tournament.status === 'active';

  if (rounds.length === 0) return null;

  return (
    <div className="glass-panel p-4 overflow-x-auto">
      <p className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-4 flex items-center gap-2">
        <svg viewBox="0 0 16 16" className="h-3 w-3 fill-primary"><path d="M2 2h4v4H2zm8 0h4v4h-4zM5 6v4h6V6M8 10v4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        ÁRVORE DE CHAVES
      </p>
      <div className="flex gap-6 min-w-max">
        {rounds.map((round, ri) => (
          <RoundColumn
            key={ri}
            round={round}
            roundIndex={ri}
            getPlayer={getPlayer}
            isHighlighted={currentRoundHighlight === ri}
            totalRounds={rounds.length}
            droppedIds={droppedIds}
            isActive={isActive}
            onDropPlayer={onDropPlayer}
          />
        ))}
      </div>
    </div>
  );
}

interface RoundColumnProps {
  round: TournamentRound;
  roundIndex: number;
  getPlayer: (id: string) => Player | undefined;
  isHighlighted: boolean;
  totalRounds: number;
}

const RoundColumn = memo(function RoundColumn({ round, roundIndex, getPlayer, isHighlighted, totalRounds }: RoundColumnProps) {
  const nonByeMatches = round.matches.filter(m => !m.isBye);

  return (
    <div className="flex flex-col gap-3 min-w-[180px]">
      <div className={`text-center font-heading text-[10px] tracking-[0.15em] uppercase pb-2 border-b ${isHighlighted ? 'text-primary border-primary/50' : 'text-muted-foreground border-border/30'}`}>
        RODADA {roundIndex + 1}
      </div>
      {nonByeMatches.map((match) => {
        const p1 = getPlayer(match.player1Id);
        const p2 = getPlayer(match.player2Id);
        const hasResult = !!match.result;
        const winnerId = match.result?.winnerId;

        return (
          <div
            key={match.id}
            className={`relative border rounded-lg overflow-hidden transition-all ${hasResult ? 'border-primary/30' : 'border-border/50'} ${isHighlighted && !hasResult ? 'ring-1 ring-primary/20' : ''}`}
          >
            {/* Connection line indicator */}
            {hasResult && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary/60 to-primary/20 rounded-l" />
            )}

            <MatchSlot
              player={p1}
              points={match.player1Points}
              isWinner={winnerId === match.player1Id}
              hasResult={hasResult}
              side="top"
            />
            <div className="h-px bg-border/30" />
            <MatchSlot
              player={p2}
              points={match.player2Points}
              isWinner={winnerId === match.player2Id}
              hasResult={hasResult}
              side="bottom"
            />
          </div>
        );
      })}
      {round.byePlayerId && (
        <div className="border border-dashed border-secondary/30 rounded-lg p-2 flex items-center gap-2">
          <span className="text-[9px] font-heading text-secondary tracking-wider">BYE</span>
          <span className="text-[10px] font-heading text-muted-foreground truncate">
            {getPlayer(round.byePlayerId)?.nickname || getPlayer(round.byePlayerId)?.name || '?'}
          </span>
        </div>
      )}
    </div>
  );
});

interface MatchSlotProps {
  player: Player | undefined;
  points: number;
  isWinner: boolean;
  hasResult: boolean;
  side: 'top' | 'bottom';
}

const MatchSlot = memo(function MatchSlot({ player, points, isWinner, hasResult, side }: MatchSlotProps) {
  if (!player) return <div className="h-8 bg-muted/20" />;

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 transition-all ${isWinner ? 'bg-primary/10' : hasResult ? 'opacity-50' : ''}`}>
      <Avatar className="h-5 w-5 border border-border/50 shrink-0">
        {player.avatar.startsWith('http') || player.avatar.startsWith('data:')
          ? <AvatarImage src={player.avatar} />
          : <AvatarFallback className="bg-muted text-[7px]">{player.avatar}</AvatarFallback>
        }
      </Avatar>
      <span className={`text-[10px] font-heading truncate flex-1 ${isWinner ? 'text-primary font-bold' : 'text-foreground'}`}>
        {player.nickname || player.name.split(' ')[0]}
      </span>
      {hasResult && (
        <span className={`text-[10px] font-heading font-bold ${isWinner ? 'text-primary' : 'text-muted-foreground'}`}>
          {points}
        </span>
      )}
      {isWinner && (
        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      )}
    </div>
  );
});

export default memo(BracketTree);
