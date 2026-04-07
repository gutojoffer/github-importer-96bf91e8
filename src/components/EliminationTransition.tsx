import { useState, useEffect } from 'react';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';
import { Zap, Swords } from 'lucide-react';

interface EliminationTransitionProps {
  topN: number;
  qualifiedPlayers: Player[];
  onComplete: () => void;
}

export default function EliminationTransition({ topN, qualifiedPlayers, onComplete }: EliminationTransitionProps) {
  const [phase, setPhase] = useState<'flash' | 'announce' | 'players' | 'countdown'>('flash');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('announce'), 400));
    timers.push(setTimeout(() => setPhase('players'), 2000));
    timers.push(setTimeout(() => setPhase('countdown'), 4000));
    timers.push(setTimeout(() => setCountdown(2), 5000));
    timers.push(setTimeout(() => setCountdown(1), 6000));
    timers.push(setTimeout(() => onComplete(), 7000));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className={`absolute inset-0 transition-all duration-500 ${phase === 'flash' ? 'bg-primary/30' : 'bg-background/95 backdrop-blur-xl'}`} />

      {/* Radial effects */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/5 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-secondary/5 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
        {/* Flash phase */}
        {phase === 'flash' && (
          <div className="anim-fade-up">
            <Zap className="h-20 w-20 mx-auto text-primary animate-pulse" />
          </div>
        )}

        {/* Announce phase */}
        {phase === 'announce' && (
          <div className="anim-fade-up space-y-4">
            <Swords className="h-16 w-16 mx-auto text-accent" />
            <h1 className="font-heading text-5xl sm:text-7xl font-bold text-primary tracking-[0.2em] italic anim-text-glow">
              TOP {topN}
            </h1>
            <p className="font-heading text-xl text-foreground tracking-[0.3em] uppercase">
              FASE ELIMINATÓRIA
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </div>
        )}

        {/* Players phase */}
        {phase === 'players' && (
          <div className="anim-fade-up space-y-6">
            <h2 className="font-heading text-2xl font-bold text-primary tracking-[0.15em] italic">
              CLASSIFICADOS
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {qualifiedPlayers.slice(0, topN).map((p, i) => (
                <div key={p.id} className="flex flex-col items-center gap-1 anim-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/50">
                      {p.avatar.startsWith('http') || p.avatar.startsWith('data:')
                        ? <AvatarImage src={p.avatar} />
                        : <AvatarFallback className="bg-muted text-lg">{p.avatar}</AvatarFallback>}
                    </Avatar>
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-heading font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <span className="font-heading text-[10px] text-foreground truncate max-w-[80px]">
                    {p.nickname || p.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown phase */}
        {phase === 'countdown' && (
          <div className="anim-fade-up space-y-4">
            <p className="font-heading text-lg text-muted-foreground tracking-[0.3em] uppercase">
              INICIANDO EM
            </p>
            <span className="font-heading text-8xl font-bold text-primary anim-text-glow">
              {countdown}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
