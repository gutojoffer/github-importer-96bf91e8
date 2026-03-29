import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompletedTournaments, getPlayers } from '@/lib/storage';
import { Tournament, Player } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EloBadge from '@/components/EloBadge';
import { Crown, ArrowLeft, Trophy, Medal } from 'lucide-react';

export default function TournamentPodium() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setPlayers(getPlayers());
    const found = getCompletedTournaments().find(t => t.id === id);
    if (found) setTournament(found);
  }, [id]);

  const getPlayer = (pid: string) => players.find(p => p.id === pid);

  if (!tournament || !tournament.finalStandings) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="font-heading text-xl text-muted-foreground italic">Torneio não encontrado</p>
          <Link to="/history"><Button className="font-heading gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button></Link>
        </div>
      </div>
    );
  }

  const standings = tournament.finalStandings;
  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const configs = [
    { border: 'border-muted-foreground', label: '2º', size: 'h-20 w-20', color: '210 10% 70%' },
    { border: 'border-secondary', label: '1º', size: 'h-28 w-28', color: '45 80% 55%' },
    { border: 'border-accent', label: '3º', size: 'h-20 w-20', color: '25 60% 50%' },
  ];

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-8">
      <Link to="/history">
        <Button variant="ghost" size="sm" className="font-heading gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Histórico
        </Button>
      </Link>

      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-[0.15em] text-foreground italic">{tournament.name}</h1>
        <p className="text-sm text-muted-foreground font-body">
          {new Date(tournament.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-6 sm:gap-10 pt-8 pb-4">
        {podiumOrder.map((standing, displayIdx) => {
          if (!standing) return null;
          const player = getPlayer(standing.playerId);
          if (!player) return null;
          const config = top3.length >= 3 ? configs[displayIdx] : configs[1];
          const isFirst = standing.placement === 1;

          return (
            <div key={standing.playerId} className={`flex flex-col items-center gap-2 ${isFirst ? '-mt-8' : 'mt-4'} anim-fade-up`}
              style={{ animationDelay: `${displayIdx * 150}ms` }}>
              {isFirst && <Crown className="h-8 w-8 text-secondary" />}
              <Avatar className={`${config.size} border-4 ${config.border}`}>
                {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                  <AvatarImage src={player.avatar} alt={player.name} />
                ) : (
                  <AvatarFallback className="bg-muted text-3xl">{player.avatar}</AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <span className="font-heading text-2xl font-bold italic" style={{ color: `hsl(${config.color})` }}>{config.label}</span>
                <p className="font-heading font-bold text-foreground text-sm mt-1">{player.name}</p>
                {player.nickname && <p className="text-[10px] text-muted-foreground">@{player.nickname.replace(/^@/, '')}</p>}
                <EloBadge xp={player.xp || 0} size="sm" />
                <p className="text-xs text-secondary font-heading font-bold mt-1">+{standing.xpAwarded} XP</p>
                <p className="text-[10px] text-muted-foreground">{standing.wins}W / {standing.losses}L</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Podium bases */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 -mt-2">
          <div className="w-24 sm:w-28 h-16 dark-panel rounded-t border-t-2 border-muted-foreground/30 flex items-center justify-center">
            <Medal className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="w-24 sm:w-28 h-24 dark-panel rounded-t border-t-2 border-secondary/50 flex items-center justify-center anim-pulse">
            <Trophy className="h-6 w-6 text-secondary" />
          </div>
          <div className="w-24 sm:w-28 h-12 dark-panel rounded-t border-t-2 border-accent/30 flex items-center justify-center">
            <Medal className="h-5 w-5 text-accent" />
          </div>
        </div>
      )}

      {/* Other placements */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-bold tracking-wider text-muted-foreground italic">OUTRAS COLOCAÇÕES</h2>
          <div className="space-y-2">
            {rest.map(s => {
              const player = getPlayer(s.playerId);
              if (!player) return null;
              return (
                <div key={s.playerId} className="dark-panel flex items-center gap-3 p-3">
                  <span className="font-heading text-lg font-bold w-8 text-center text-muted-foreground italic">#{s.placement}</span>
                  <Avatar className="h-8 w-8 border border-border">
                    {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                      <AvatarImage src={player.avatar} alt={player.name} />
                    ) : (
                      <AvatarFallback className="bg-muted text-sm">{player.avatar}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{player.name}</p>
                  </div>
                  <EloBadge xp={player.xp || 0} size="sm" />
                  <span className="text-xs text-muted-foreground font-body">{s.wins}W/{s.losses}L</span>
                  <span className="text-secondary font-heading font-bold text-sm">+{s.xpAwarded} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
