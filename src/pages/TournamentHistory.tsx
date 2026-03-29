import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCompletedTournaments, getPlayers, seedMockTournaments } from '@/lib/storage';
import { Tournament, Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, Eye, Crown } from 'lucide-react';

export default function TournamentHistory() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setPlayers(getPlayers());
    seedMockTournaments();
    setTournaments(getCompletedTournaments());
  }, []);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return iso; }
  };

  if (tournaments.length === 0) {
    return (
      <div className="p-5 max-w-4xl mx-auto space-y-6">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-foreground">Histórico de Torneios</h1>
        <div className="paper-panel text-center py-16">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-body text-sm">Nenhum torneio finalizado ainda.</p>
          <Link to="/tournament" className="mt-4 inline-block">
            <Button className="font-heading tracking-wide gap-2 mt-4 bg-primary text-primary-foreground">
              <Trophy className="h-4 w-4" /> Criar Torneio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-foreground">Histórico de Torneios</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tournaments.map(t => {
          const top3 = (t.finalStandings || []).slice(0, 3);
          return (
            <div key={t.id} className="paper-panel p-5 space-y-4 hover:soft-glow transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{t.name}</h3>
                  <p className="text-xs text-muted-foreground font-body">{formatDate(t.createdAt)}</p>
                </div>
                <span className="text-xs font-heading tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {t.playerIds.length} bladers
                </span>
              </div>

              {top3.length > 0 && (
                <div className="flex items-center justify-center gap-4">
                  {top3.map((s, i) => {
                    const player = getPlayer(s.playerId);
                    if (!player) return null;
                    const borderColor = i === 0 ? 'border-accent' : i === 1 ? 'border-secondary' : 'border-primary';
                    return (
                      <div key={s.playerId} className="flex flex-col items-center gap-1">
                        <div className="relative">
                          {i === 0 && <Crown className="h-4 w-4 text-accent absolute -top-3 left-1/2 -translate-x-1/2" />}
                          <Avatar className={`h-10 w-10 border-2 ${borderColor}`}>
                            {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                              <AvatarImage src={player.avatar} alt={player.name} />
                            ) : (
                              <AvatarFallback className="bg-muted text-sm">{player.avatar}</AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                        <span className="text-[10px] font-heading text-muted-foreground">#{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full font-heading tracking-wide gap-2 border-primary/30 text-foreground hover:bg-primary/10"
                onClick={() => navigate(`/history/${t.id}`)}
              >
                <Eye className="h-4 w-4" /> Ver Detalhes
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
