import { useEffect, useMemo, useState } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { getAllStats } from '@/lib/storage';
import { getEloFromXP, ELO_TIERS, PlayerStats } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EloBadge from '@/components/EloBadge';
import { Crown, Shield, Trophy, Swords, Medal } from 'lucide-react';

interface RankingEntry {
  playerId: string;
  name: string;
  nickname: string;
  avatar: string;
  xp: number;
  totalPoints: number;
  totalWins: number;
  totalLosses: number;
  tournamentsPlayed: number;
}

export default function Rankings() {
  const players = usePlayerStore(s => s.players);
  const load = usePlayerStore(s => s.load);
  const { tournaments, load: loadTournaments } = useTournamentStore();
  const [stats, setStats] = useState<PlayerStats[]>([]);

  useEffect(() => {
    load();
    loadTournaments();
    getAllStats().then(setStats);
  }, []);

  const rankings = useMemo(() => {
    // Aggregate stats per player
    const pointsMap = new Map<string, { points: number; wins: number; losses: number; tournaments: number }>();

    for (const s of stats) {
      const cur = pointsMap.get(s.playerId) || { points: 0, wins: 0, losses: 0, tournaments: 0 };
      cur.points += s.points;
      cur.wins += s.wins;
      cur.losses += s.losses;
      pointsMap.set(s.playerId, cur);
    }

    // Count tournaments played per player from completed tournaments
    const tournamentCounts = new Map<string, number>();
    for (const t of tournaments.filter(t => t.status === 'completed')) {
      for (const pid of t.playerIds) {
        tournamentCounts.set(pid, (tournamentCounts.get(pid) || 0) + 1);
      }
    }

    const entries: RankingEntry[] = players.map(p => {
      const s = pointsMap.get(p.id);
      return {
        playerId: p.id,
        name: p.name,
        nickname: p.nickname,
        avatar: p.avatar,
        xp: p.xp || 0,
        totalPoints: s?.points || 0,
        totalWins: s?.wins || 0,
        totalLosses: s?.losses || 0,
        tournamentsPlayed: tournamentCounts.get(p.id) || 0,
      };
    });

    // Sort by points desc, then wins desc
    return entries
      .filter(e => e.totalPoints > 0 || e.tournamentsPlayed > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWins - a.totalWins);
  }, [players, stats, tournaments]);

  const positionColors = ['text-gold', 'text-muted-foreground', 'text-secondary'];

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 relative">
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-cyan pl-3 flex items-center gap-2">
        <Crown className="h-7 w-7 text-primary" /> RANKINGS
      </h1>

      {/* Elo tiers */}
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
      </div>

      {/* Points table */}
      <div className="glass-panel p-4">
        <p className="font-heading text-xs text-muted-foreground tracking-[0.2em] mb-3 uppercase">Pontuação por Colocação</p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
          {[
            { label: '1º', pts: 100 },
            { label: '2º', pts: 70 },
            { label: '3º', pts: 50 },
            { label: '4º', pts: 35 },
            { label: '5º-8º', pts: 20 },
            { label: '9º-16º', pts: 10 },
            { label: 'Participação', pts: 5 },
          ].map(item => (
            <div key={item.label} className="dark-panel p-2 rounded-lg">
              <p className="text-[10px] font-heading text-muted-foreground">{item.label}</p>
              <p className="font-heading font-bold text-primary text-sm">{item.pts}</p>
            </div>
          ))}
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-body text-sm">Nenhum blader ranqueado ainda. Encerre torneios para gerar pontos!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 px-4 py-2 text-[10px] font-heading text-muted-foreground tracking-[0.15em] uppercase">
            <span>#</span>
            <span>Blader</span>
            <span className="text-right">Pontos</span>
            <span className="text-right">Vitórias</span>
            <span className="text-right">Torneios</span>
            <span className="text-right">Elo</span>
          </div>

          {rankings.map((entry, i) => {
            const elo = getEloFromXP(entry.xp);
            return (
              <div key={entry.playerId}
                className={`glass-panel flex items-center gap-3 p-4 anim-fade-up ${i < 3 ? 'neon-line-cyan' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}>
                
                {/* Desktop grid */}
                <div className="hidden sm:grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 items-center w-full">
                  <span className={`font-heading text-xl font-bold text-center italic ${i < 3 ? positionColors[i] : 'text-muted-foreground/50'}`}>
                    {i === 0 ? <Crown className="h-5 w-5 inline text-gold" /> : `#${i + 1}`}
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 border-2 shrink-0" style={{ borderColor: `hsl(${elo.tier.color} / 0.5)` }}>
                      {entry.avatar.startsWith('http') || entry.avatar.startsWith('data:') ? <AvatarImage src={entry.avatar} alt={entry.name} /> : <AvatarFallback className="bg-muted text-lg">{entry.avatar}</AvatarFallback>}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-heading font-bold truncate text-foreground">{entry.name}</p>
                      {entry.nickname && <p className="text-[10px] text-muted-foreground">@{entry.nickname.replace(/^@/,'')}</p>}
                    </div>
                  </div>
                  <span className="font-heading text-lg font-bold text-primary text-right">{entry.totalPoints}</span>
                  <span className="font-heading text-sm text-foreground text-right">{entry.totalWins}</span>
                  <span className="font-heading text-sm text-muted-foreground text-right">{entry.tournamentsPlayed}</span>
                  <div className="flex justify-end"><EloBadge xp={entry.xp} size="sm" /></div>
                </div>

                {/* Mobile layout */}
                <div className="sm:hidden flex items-center gap-3 w-full">
                  <span className={`font-heading text-xl font-bold w-8 text-center italic ${i < 3 ? positionColors[i] : 'text-muted-foreground/50'}`}>
                    {i === 0 ? <Crown className="h-5 w-5 inline text-gold" /> : `#${i + 1}`}
                  </span>
                  <Avatar className="h-10 w-10 border-2 shrink-0" style={{ borderColor: `hsl(${elo.tier.color} / 0.5)` }}>
                    {entry.avatar.startsWith('http') || entry.avatar.startsWith('data:') ? <AvatarImage src={entry.avatar} alt={entry.name} /> : <AvatarFallback className="bg-muted text-lg">{entry.avatar}</AvatarFallback>}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold truncate text-foreground">{entry.name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5"><Trophy className="h-3 w-3" />{entry.totalWins}W</span>
                      <span className="flex items-center gap-0.5"><Medal className="h-3 w-3" />{entry.tournamentsPlayed}T</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-heading text-lg font-bold text-primary">{entry.totalPoints}</span>
                    <div className="mt-0.5"><EloBadge xp={entry.xp} size="sm" /></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
