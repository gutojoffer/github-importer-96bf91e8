import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';

interface VersusScreenProps {
  player1: Player;
  player2: Player;
  arenaName: string;
  arenaColor?: 'red' | 'blue';
  player1Points?: number;
  player2Points?: number;
  pointsToWin?: number;
  animate?: boolean;
}

export default function VersusScreen({
  player1, player2, arenaName,
  player1Points = 0, player2Points = 0, pointsToWin = 4,
  animate = true,
}: VersusScreenProps) {
  const renderPlayer = (player: Player, side: 'left' | 'right', points: number) => {
    const animClass = animate ? (side === 'left' ? 'anim-slide-left' : 'anim-slide-right') : '';
    const sideColor = side === 'left' ? 'text-primary' : 'text-accent';
    const sideBorder = side === 'left' ? 'border-primary/50' : 'border-accent/50';

    return (
      <div className={`flex flex-col items-center gap-2 flex-1 min-w-0 ${animClass}`}>
        <Avatar className={`h-20 w-20 sm:h-28 sm:w-28 border-[3px] ${sideBorder}`}>
          {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
            <AvatarImage src={player.avatar} alt={player.name} />
          ) : (
            <AvatarFallback className="bg-muted text-3xl sm:text-4xl">{player.avatar}</AvatarFallback>
          )}
        </Avatar>

        <EloBadge xp={player.xp || 0} size="md" />

        <div className="text-center min-w-0 w-full">
          <p className={`font-heading text-base sm:text-xl font-bold tracking-wide ${sideColor} truncate italic`}>
            {player.name}
          </p>
          {player.nickname && (
            <p className="text-xs text-muted-foreground font-body truncate">@{player.nickname.replace(/^@/, '')}</p>
          )}
        </div>

        <div className="text-center">
          <p className={`font-heading text-3xl sm:text-4xl font-bold ${sideColor}`}>{points}</p>
          <p className="text-[10px] text-muted-foreground font-heading tracking-wider">
            POINTS: {points} / {pointsToWin}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative py-6 px-3 dark-panel">
      <p className="text-center text-xs font-heading tracking-[0.3em] uppercase mb-5 text-muted-foreground">{arenaName}</p>
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {renderPlayer(player1, 'left', player1Points)}

        <div className={`flex flex-col items-center shrink-0 ${animate ? 'anim-vs-flash' : ''}`}>
          <span className="font-heading text-4xl sm:text-6xl font-bold text-primary/80 tracking-tighter italic">VS</span>
          <div className="w-[2px] h-8 bg-primary/30 mt-1" />
        </div>

        {renderPlayer(player2, 'right', player2Points)}
      </div>
      <p className="text-center text-[10px] text-muted-foreground font-heading mt-4 tracking-widest">
        POINTS TO WIN: {pointsToWin}
      </p>
    </div>
  );
}
