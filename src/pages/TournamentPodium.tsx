import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompletedTournaments, getPlayers } from '@/lib/storage';
import { Tournament, Player, TournamentStanding } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Crown, ArrowLeft, Trophy, Medal } from 'lucide-react';

export default function TournamentPodium() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setPlayers(getPlayers());
    const all = getCompletedTournaments();
    const found = all.find(t => t.id === id);
    if (found) setTournament(found);
  }, [id]);

  const getPlayer = (pid: string) => players.find(p => p.id === pid);

  if (!tournament || !tournament.finalStandings) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="font-heading text-xl text-muted-foreground">Torneio não encontrado</p>
          <Link to="/history"><Button className="font-heading gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button></Link>
        </div>
      </div>
    );
  }

  const standings = tournament.finalStandings;
  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const placementConfig = [
    { border: 'border-gray-300', glow: '', label: '2º', size: 'h-20 w-20', textColor: 'text-gray-300' },
    { border: 'border-yellow-400', glow: 'shadow-[0_0_30px_hsl(45_100%_50%/0.4)]', label: '1º', size: 'h-28 w-28', textColor: 'text-yellow-400' },
    { border: 'border-orange-400', glow: '', label: '3º', size: 'h-20 w-20', textColor: 'text-orange-400' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      {/* Back */}
      <Link to="/history">
        <Button variant="ghost" size="sm" className="font-heading gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Histórico
        </Button>
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-[0.15em] text-primary text-glow-cyan">
          {tournament.name}
        </h1>
        <p className="text-sm text-muted-foreground font-body">
          {new Date(tournament.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Podium */}
      <div className="relative">
        {/* Radiant background for 1st */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-yellow-400/5 blur-3xl" />
        </div>

        <div className="flex items-end justify-center gap-6 sm:gap-10 pt-8 pb-4 relative z-10">
          {podiumOrder.map((standing, displayIdx) => {
            if (!standing) return null;
            const player = getPlayer(standing.playerId);
            if (!player) return null;
            const config = top3.length >= 3 ? placementConfig[displayIdx] : placementConfig[1]; // fallback to gold if < 3
            const isFirst = standing.placement === 1;

            return (
              <div key={standing.playerId} className={`flex flex-col items-center gap-2 ${isFirst ? '-mt-8' : 'mt-4'}`}>
                {/* Crown for 1st */}
                {isFirst && <Crown className="h-8 w-8 text-yellow-400 animate-pulse-glow" />}

                <div className={`relative ${config.glow} rounded-full`}>
                  <Avatar className={`${config.size} border-4 ${config.border}`}>
                    {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                      <AvatarImage src={player.avatar} alt={player.name} />
                    ) : (
                      <AvatarFallback className="bg-muted text-3xl">{player.avatar}</AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className="text-center">
                  <span className={`font-heading text-2xl font-bold ${config.textColor}`}>
                    {config.label}
                  </span>
                  <p className="font-heading font-bold text-foreground text-sm mt-1">{player.name}</p>
                  {player.nickname && (
                    <p className="text-[10px] text-muted-foreground">@{player.nickname.replace(/^@/, '')}</p>
                  )}
                  <p className="text-xs text-primary font-heading font-bold mt-1">
                    +{standing.circuitPoints} pts
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {standing.wins}W / {standing.losses}L
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Podium base bars */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 -mt-2">
          <div className="w-24 sm:w-28 h-16 glass-panel rounded-t-lg border-t-2 border-gray-300/30 flex items-center justify-center">
            <Medal className="h-5 w-5 text-gray-300" />
          </div>
          <div className="w-24 sm:w-28 h-24 glass-panel rounded-t-lg border-t-2 border-yellow-400/50 flex items-center justify-center glow-cyan">
            <Trophy className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="w-24 sm:w-28 h-12 glass-panel rounded-t-lg border-t-2 border-orange-400/30 flex items-center justify-center">
            <Medal className="h-5 w-5 text-orange-400" />
          </div>
        </div>
      )}

      {/* Other placements */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-bold tracking-wide text-muted-foreground">
            Outras Colocações
          </h2>
          <div className="space-y-2">
            {rest.map(s => {
              const player = getPlayer(s.playerId);
              if (!player) return null;
              return (
                <div key={s.playerId} className="glass-panel rounded-lg flex items-center gap-3 p-3">
                  <span className="font-heading text-lg font-bold w-8 text-center text-muted-foreground">
                    #{s.placement}
                  </span>
                  <Avatar className="h-8 w-8 border border-border">
                    {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                      <AvatarImage src={player.avatar} alt={player.name} />
                    ) : (
                      <AvatarFallback className="bg-muted text-sm">{player.avatar}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{player.name}</p>
                    {player.nickname && <p className="text-[10px] text-muted-foreground">@{player.nickname.replace(/^@/,'')}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground font-body">{s.wins}W/{s.losses}L</span>
                  <span className="text-primary font-heading font-bold text-sm">+{s.circuitPoints}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
