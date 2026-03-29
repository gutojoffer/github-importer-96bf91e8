import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import beybladeXLogo from '@/assets/beyblade-x-logo.png';

interface VersusScreenProps {
  player1: Player;
  player2: Player;
  arenaName: string;
  arenaColor?: 'red' | 'blue';
  player1Points?: number;
  player2Points?: number;
  pointsToWin?: number;
}

export default function VersusScreen({
  player1,
  player2,
  arenaName,
  arenaColor = 'blue',
  player1Points = 0,
  player2Points = 0,
  pointsToWin = 4,
}: VersusScreenProps) {
  const borderColor = arenaColor === 'red' ? 'border-accent' : 'border-primary';
  const textColor = arenaColor === 'red' ? 'text-accent' : 'text-primary';
  const bgGlow = arenaColor === 'red' ? 'bg-accent/5' : 'bg-primary/5';

  const renderPlayer = (player: Player, side: 'left' | 'right', points: number) => {
    const sideColor = side === 'left' ? textColor : (arenaColor === 'red' ? 'text-primary' : 'text-accent');
    const sideBorder = side === 'left' ? borderColor : (arenaColor === 'red' ? 'border-primary' : 'border-accent');

    return (
      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
        {/* Logo badge */}
        <div className="w-16 h-6 flex items-center justify-center">
          <img src={beybladeXLogo} alt="" className="h-5 w-auto opacity-60" />
        </div>

        {/* Avatar */}
        <div className="relative">
          <Avatar className={`h-20 w-20 sm:h-28 sm:w-28 border-[3px] ${sideBorder}`}>
            {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
              <AvatarImage src={player.avatar} alt={player.name} />
            ) : (
              <AvatarFallback className="bg-muted text-3xl sm:text-4xl">{player.avatar}</AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Name */}
        <div className="text-center min-w-0 w-full">
          <p className={`font-heading text-base sm:text-xl font-bold tracking-wide ${sideColor} truncate`}>
            {player.name}
          </p>
          {player.nickname && (
            <p className="text-xs text-muted-foreground font-body truncate">
              @{player.nickname.replace(/^@/, '')}
            </p>
          )}
        </div>

        {/* Points */}
        <div className="text-center">
          <p className={`font-heading text-2xl sm:text-3xl font-bold ${sideColor}`}>{points}</p>
          <p className="text-[10px] text-muted-foreground font-heading tracking-wider uppercase">
            POINTS: {points} / {pointsToWin}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative py-4 px-2 ${bgGlow} border ${borderColor}/30`}>
      <p className={`text-center text-xs font-heading tracking-[0.3em] uppercase mb-4 ${textColor}`}>
        {arenaName}
      </p>

      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {renderPlayer(player1, 'left', player1Points)}

        <div className="flex flex-col items-center shrink-0">
          <span className="font-heading text-3xl sm:text-5xl font-bold text-foreground/20 tracking-tighter">VS</span>
          <div className={`w-px h-8 ${arenaColor === 'red' ? 'bg-accent/30' : 'bg-primary/30'}`} />
        </div>

        {renderPlayer(player2, 'right', player2Points)}
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-heading mt-3 tracking-widest">
        POINTS TO WIN: {pointsToWin}
      </p>
    </div>
  );
}
