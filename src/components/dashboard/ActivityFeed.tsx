import React, { useMemo } from 'react';
import { Tournament, Player } from '@/types/tournament';

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  color: string;
}

const ActivityFeed = React.memo(({ tournaments, players }: { tournaments: Tournament[]; players: Player[] }) => {
  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Recent tournaments as activity
    const sorted = [...tournaments].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const t of sorted.slice(0, 10)) {
      if (t.status === 'completed') {
        const winner = t.finalStandings?.[0];
        const p = winner ? players.find(pl => pl.id === winner.playerId) : null;
        items.push({
          id: `${t.id}-win`,
          text: p ? `${p.name} venceu "${t.name}"` : `Torneio "${t.name}" finalizado`,
          time: new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          color: 'bg-gold',
        });
      } else if (t.status === 'active') {
        items.push({
          id: `${t.id}-active`,
          text: `"${t.name}" em andamento`,
          time: 'Agora',
          color: 'bg-success',
        });
      } else {
        items.push({
          id: `${t.id}-upcoming`,
          text: `"${t.name}" aberto para inscrições`,
          time: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          color: 'bg-primary',
        });
      }
    }

    // Recent player registrations
    const recentPlayers = [...players]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    for (const p of recentPlayers) {
      items.push({
        id: `player-${p.id}`,
        text: `${p.name} se cadastrou`,
        time: new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        color: 'bg-secondary',
      });
    }

    return items.slice(0, 8);
  }, [tournaments, players]);

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
        <div className="w-[3px] h-4 rounded-full bg-secondary" />
        <h3 className="font-heading text-base font-bold tracking-wider text-foreground">ATIVIDADE RECENTE</h3>
      </div>

      <div>
        {activities.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground font-body">
            Nenhuma atividade registrada
          </div>
        ) : (
          activities.map(a => (
            <div
              key={a.id}
              className="flex items-start gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0 hover:bg-[hsl(var(--surface2))] transition-colors"
            >
              <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${a.color}`} />
              <p className="text-sm text-foreground font-body flex-1 min-w-0 truncate">{a.text}</p>
              <span className="text-[10px] text-muted-foreground font-body shrink-0">{a.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default ActivityFeed;
