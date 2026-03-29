import { Match, Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ArenaMiniaturesProps {
  pendingMatches: Match[];
  getPlayer: (id: string) => Player | undefined;
  arenaNames: string[];
}

export default function ArenaMiniatures({ pendingMatches, getPlayer, arenaNames }: ArenaMiniaturesProps) {
  if (pendingMatches.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="font-heading text-xs text-muted-foreground tracking-widest uppercase">Partidas Pendentes</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {pendingMatches.map((m) => {
          const p1 = getPlayer(m.player1Id);
          const p2 = getPlayer(m.player2Id);
          if (!p1 || !p2) return null;
          return (
            <div key={m.id} className="paper-panel p-2 flex items-center gap-1.5 text-[10px]">
              <Avatar className="h-5 w-5 border border-secondary/40">
                {p1.avatar.startsWith('http') || p1.avatar.startsWith('data:') ? (
                  <AvatarImage src={p1.avatar} alt={p1.name} />
                ) : (
                  <AvatarFallback className="bg-muted text-[8px]">{p1.avatar}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-muted-foreground font-heading">VS</span>
              <Avatar className="h-5 w-5 border border-accent/40">
                {p2.avatar.startsWith('http') || p2.avatar.startsWith('data:') ? (
                  <AvatarImage src={p2.avatar} alt={p2.name} />
                ) : (
                  <AvatarFallback className="bg-muted text-[8px]">{p2.avatar}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-muted-foreground font-heading ml-auto">{arenaNames[m.arenaIndex] || ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
