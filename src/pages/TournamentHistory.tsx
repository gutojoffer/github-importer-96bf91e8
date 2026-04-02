import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, Eye, Crown } from 'lucide-react';

export default function TournamentHistory() {
  const players = usePlayerStore(s => s.players);
  const loadPlayers = usePlayerStore(s => s.load);
  const { tournaments, load: loadTournaments } = useTournamentStore();
  const navigate = useNavigate();

  useEffect(() => { loadPlayers(); loadTournaments(); }, []);

  const completed = useMemo(() =>
    tournaments.filter(t => t.status === 'completed')
  , [tournaments]);

  const getPlayer = useCallback((id: string) => players.find(p => p.id === id), [players]);

  if (completed.length === 0) {
    return (
      <div className="p-5 max-w-4xl mx-auto space-y-6">
        <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-cyan pl-3">HISTÓRICO</h1>
        <div className="glass-panel text-center py-16">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-body text-sm">Nenhum torneio finalizado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-cyan pl-3">HISTÓRICO</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {completed.map((t, i) => {
          const top3 = (t.finalStandings || []).slice(0, 3);
          return (
            <div key={t.id} className="glass-panel p-5 space-y-4 anim-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground italic">{t.name}</h3>
                  <p className="text-xs text-muted-foreground font-body">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="text-[10px] font-heading tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">{t.playerIds.length} bladers</span>
              </div>
              {top3.length > 0 && (
                <div className="flex items-center justify-center gap-4">
                  {top3.map((s, idx) => {
                    const player = getPlayer(s.playerId);
                    if (!player) return null;
                    const bc = idx === 0 ? 'border-accent' : idx === 1 ? 'border-muted-foreground' : 'border-secondary';
                    return (
                      <div key={s.playerId} className="flex flex-col items-center gap-1">
                        {idx === 0 && <Crown className="h-4 w-4 text-accent" />}
                        <Avatar className={`h-10 w-10 border-2 ${bc}`}>
                          {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? <AvatarImage src={player.avatar} alt={player.name} /> : <AvatarFallback className="bg-muted text-sm">{player.avatar}</AvatarFallback>}
                        </Avatar>
                        <span className="text-[10px] font-heading text-muted-foreground">#{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full font-heading tracking-wider gap-2 border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate(`/history/${t.id}`)}>
                <Eye className="h-4 w-4" /> Ver Pódio
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
