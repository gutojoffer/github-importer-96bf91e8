import { useEffect, useMemo } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { getEloFromXP, ELO_TIERS } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';
import { Crown, Shield } from 'lucide-react';

export default function Rankings() {
  const players = usePlayerStore(s => s.players);
  const load = usePlayerStore(s => s.load);

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() =>
    [...players].sort((a, b) => (b.xp || 0) - (a.xp || 0))
  , [players]);

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-cyan pl-3 flex items-center gap-2">
        <Crown className="h-7 w-7 text-primary" /> RANKINGS
      </h1>

      <div className="glass-panel p-4">
        <p className="font-heading text-xs text-muted-foreground tracking-[0.2em] mb-3 uppercase">Hierarquia de Elos</p>
        <div className="flex flex-wrap gap-3">
          {ELO_TIERS.map(tier => (
            <div key={tier.name} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ background: `hsl(${tier.color})` }} />
              <span className="text-[10px] font-heading" style={{ color: `hsl(${tier.color})` }}>{tier.name}</span>
              {tier.divisions > 0 && <span className="text-[8px] text-muted-foreground">(3-1)</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 font-body">
          +100 XP = sobe 1 divisão · 1º = +50XP · 2º = +30XP · 3º = +15XP · Demais = +5XP
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-body text-sm">Nenhum blader cadastrado. Encerre torneios para gerar XP!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((player, i) => {
            const elo = getEloFromXP(player.xp || 0);
            return (
              <div key={player.id}
                className={`glass-panel flex items-center gap-3 p-4 anim-fade-up ${i < 3 ? 'neon-line-cyan' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}>
                <span className={`font-heading text-xl font-bold w-8 text-center italic ${i === 0 ? 'text-accent' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-secondary' : 'text-muted-foreground/50'}`}>
                  {i === 0 ? <Crown className="h-5 w-5 inline text-accent" /> : `#${i + 1}`}
                </span>
                <Avatar className="h-10 w-10 border-2" style={{ borderColor: `hsl(${elo.tier.color} / 0.5)` }}>
                  {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? <AvatarImage src={player.avatar} alt={player.name} /> : <AvatarFallback className="bg-muted text-lg">{player.avatar}</AvatarFallback>}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold truncate text-foreground">{player.name}</p>
                  {player.nickname && <p className="text-[10px] text-muted-foreground">@{player.nickname.replace(/^@/,'')}</p>}
                </div>
                <EloBadge xp={player.xp || 0} size="md" />
                <span className="font-heading text-lg font-bold text-muted-foreground">{player.xp || 0} XP</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
