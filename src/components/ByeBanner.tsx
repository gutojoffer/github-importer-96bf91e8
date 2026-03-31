import { Player } from '@/types/tournament';

interface ByeBannerProps {
  player: Player;
}

export default function ByeBanner({ player }: ByeBannerProps) {
  return (
    <div className="w-full glass-panel neon-line-magenta px-4 py-3 font-heading text-sm tracking-wide anim-fade-up">
      <span className="text-secondary font-bold">BYE:</span>{' '}
      <span className="text-foreground font-bold italic">{player.nickname ? `${player.name} (@${player.nickname.replace(/^@/, '')})` : player.name}</span>{' '}
      <span className="text-secondary font-bold">[+1 WIN]</span>{' '}
      <span className="text-muted-foreground text-xs">(Número ímpar — vitória automática)</span>
    </div>
  );
}
