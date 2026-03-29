import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  onClick?: () => void;
  stats?: { wins: number; losses: number; points: number };
}

export default function PlayerCard({ player, selected, onClick, stats }: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer glass-panel
        ${selected
          ? 'border-primary bg-primary/10 glow-cyan'
          : 'hover:border-primary/40'
        }`}
    >
      <Avatar className="h-12 w-12 border-2 border-primary/30">
        {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
          <AvatarImage src={player.avatar} alt={player.name} />
        ) : (
          <AvatarFallback className="bg-muted text-2xl">{player.avatar}</AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-foreground truncate">{player.name}</p>
        {player.nickname && (
          <p className="text-xs text-muted-foreground truncate font-body">@{player.nickname.replace(/^@/, '')}</p>
        )}
      </div>

      {stats && (
        <div className="text-right text-xs font-heading">
          <p className="text-primary font-bold">{stats.points} pts</p>
          <p className="text-muted-foreground">{stats.wins}W / {stats.losses}L</p>
        </div>
      )}
    </div>
  );
}
