import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';

interface VictorySplashProps {
  winner: Player;
  finishType?: string;
}

export default function VictorySplash({ winner, finishType }: VictorySplashProps) {
  const displayName = winner.nickname
    ? `@${winner.nickname.replace(/^@/, '')}`
    : winner.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center anim-victory-overlay">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

      {/* Radial glow behind winner */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full bg-primary/10 anim-glow-pulse" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-secondary/5 anim-glow-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 text-center anim-victory-card">
        {/* Crown */}
        <div className="mb-4 anim-crown-drop">
          <svg viewBox="0 0 48 32" className="h-10 w-14 mx-auto" fill="none">
            <path d="M4 28L8 10L16 18L24 4L32 18L40 10L44 28H4Z"
              fill="hsl(var(--accent))" fillOpacity="0.9"
              stroke="hsl(var(--accent))" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="2.5" fill="hsl(var(--accent))" />
            <circle cx="24" cy="2" r="2.5" fill="hsl(var(--accent))" />
            <circle cx="40" cy="8" r="2.5" fill="hsl(var(--accent))" />
          </svg>
        </div>

        {/* Avatar with glow ring */}
        <div className="relative inline-block mb-4">
          <div className="absolute -inset-3 rounded-full bg-primary/20 anim-glow-pulse" />
          <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-[3px] border-primary relative z-10">
            {winner.avatar.startsWith('http') || winner.avatar.startsWith('data:') ? (
              <AvatarImage src={winner.avatar} alt={winner.name} />
            ) : (
              <AvatarFallback className="bg-muted text-4xl sm:text-5xl">{winner.avatar}</AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="flex justify-center mb-3">
          <EloBadge xp={winner.xp || 0} size="lg" />
        </div>

        <p className="font-heading text-4xl sm:text-5xl font-bold text-primary tracking-widest italic anim-text-glow">
          {displayName}
        </p>

        <p className="font-heading text-xl sm:text-2xl text-foreground mt-2 tracking-[0.4em] font-bold italic">
          VITÓRIA!
        </p>

        {finishType && (
          <p className="font-heading text-xs text-muted-foreground mt-1 tracking-[0.3em] uppercase">
            {finishType} finish
          </p>
        )}

        <p className="font-heading text-[10px] text-muted-foreground/60 mt-4 tracking-[0.2em]">
          AVANÇANDO PARA A PRÓXIMA FASE...
        </p>
      </div>
    </div>
  );
}
