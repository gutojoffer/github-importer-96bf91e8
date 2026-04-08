import React, { useMemo } from 'react';
import { Player, getEloFromXP } from '@/types/tournament';
import { Crown } from 'lucide-react';

const positionColors = ['text-gold', 'text-[hsl(210,10%,70%)]', 'text-[hsl(30,50%,45%)]'];

const TopBladers = React.memo(({ players }: { players: Player[] }) => {
  const top = useMemo(() =>
    [...players].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 8),
    [players]
  );

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
        <div className="w-[3px] h-4 rounded-full bg-gold" />
        <h3 className="font-heading text-base font-bold tracking-wider text-foreground">TOP BLADERS</h3>
      </div>

      <div>
        {top.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground font-body">
            Nenhum blader cadastrado
          </div>
        ) : (
          top.map((p, i) => {
            const elo = getEloFromXP(p.xp || 0);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[hsl(var(--surface2))] transition-colors"
              >
                <span className={`font-heading text-lg font-bold w-6 text-center ${i < 3 ? positionColors[i] : 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: `hsl(${elo.tier.color} / 0.2)`, color: `hsl(${elo.tier.color})` }}
                >
                  {p.avatar?.startsWith('http') || p.avatar?.startsWith('data:')
                    ? <img src={p.avatar} className="h-full w-full rounded-full object-cover" alt="" />
                    : (p.avatar || p.name.charAt(0))
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate font-body">{p.name}</p>
                </div>
                <span className="text-sm font-heading font-bold text-primary">{p.xp || 0}</span>
                <span className="text-[10px] text-muted-foreground font-body hidden sm:inline">pts</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default TopBladers;
