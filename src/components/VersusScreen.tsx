import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VersusScreenProps {
  player1: Player;
  player2: Player;
  arenaName: string;
}

export default function VersusScreen({ player1, player2, arenaName }: VersusScreenProps) {
  const renderAvatar = (player: Player, side: 'left' | 'right') => (
    <div className={`flex flex-col items-center gap-3 ${side === 'left' ? 'animate-slide-in' : 'animate-slide-in'}`}>
      <div className="relative">
        <div className={`absolute inset-0 rounded-full ${side === 'left' ? 'bg-primary/20' : 'bg-accent/20'} animate-pulse-glow`} />
        <Avatar className={`h-24 w-24 sm:h-32 sm:w-32 border-4 ${side === 'left' ? 'border-primary' : 'border-accent'} relative`}>
          {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
            <AvatarImage src={player.avatar} alt={player.name} />
          ) : (
            <AvatarFallback className="bg-muted text-4xl">{player.avatar}</AvatarFallback>
          )}
        </Avatar>
      </div>
      <p className={`font-heading text-xl sm:text-2xl font-bold tracking-wide ${side === 'left' ? 'text-primary' : 'text-accent'}`}>
        {player.nickname || player.name}
      </p>
    </div>
  );

  return (
    <div className="relative py-8">
      <p className="text-center text-xs font-heading text-muted-foreground tracking-widest uppercase mb-6">
        {arenaName}
      </p>

      <div className="flex items-center justify-center gap-6 sm:gap-12">
        {renderAvatar(player1, 'left')}

        <div className="flex flex-col items-center">
          <span className="font-heading text-4xl sm:text-6xl font-bold text-foreground/20">VS</span>
        </div>

        {renderAvatar(player2, 'right')}
      </div>
    </div>
  );
}
