import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  onClick?: () => void;
  showElo?: boolean;
}

export default function PlayerCard({ player, selected, onClick, showElo = true }: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 transition-all cursor-pointer glass-panel anim-fade-up
        ${selected ? 'border-primary bg-primary/5 anim-pulse' : 'hover:border-primary/40'}`}
    >
      <Avatar className="h-11 w-11 border-2 border-muted">
        {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
          <AvatarImage src={player.avatar} alt={player.name} />
        ) : (
          <AvatarFallback className="bg-muted text-xl">{player.avatar}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-foreground truncate">{player.name}</p>
        {player.nickname && (
          <p className="text-[10px] text-muted-foreground truncate font-body">@{player.nickname.replace(/^@/, '')}</p>
        )}
      </div>
      {showElo && <EloBadge xp={player.xp || 0} />}
    </div>
  );
}
