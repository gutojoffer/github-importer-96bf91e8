import { Player } from '@/types/tournament';

interface ByeBannerProps {
  player: Player;
}

export default function ByeBanner({ player }: ByeBannerProps) {
  return (
    <div className="w-full border border-secondary/40 bg-secondary/10 px-4 py-3 font-heading text-sm tracking-wide">
      <span className="text-secondary font-bold">BYE NOTIFICATION:</span>{' '}
      <span className="text-foreground font-bold">{player.nickname ? `${player.name} (@${player.nickname.replace(/^@/, '')})` : player.name}</span>{' '}
      <span className="text-secondary font-bold">[+1 WIN]</span>{' '}
      <span className="text-muted-foreground text-xs">
        (BYE LOGIC: Odd number of players, random player awarded point)
      </span>
    </div>
  );
}
