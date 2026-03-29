import { Player } from '@/types/tournament';

interface ByeBannerProps {
  player: Player;
}

export default function ByeBanner({ player }: ByeBannerProps) {
  return (
    <div className="w-full dark-panel border-l-4 border-secondary px-4 py-3 font-heading text-sm tracking-wide anim-fade-up">
      <span className="text-secondary font-bold">BYE NOTIFICATION:</span>{' '}
      <span className="text-foreground font-bold italic">{player.nickname ? `${player.name} (@${player.nickname.replace(/^@/, '')})` : player.name}</span>{' '}
      <span className="text-secondary font-bold">[+1 WIN]</span>{' '}
      <span className="text-muted-foreground text-xs">(Odd number of players, random player awarded point)</span>
    </div>
  );
}
