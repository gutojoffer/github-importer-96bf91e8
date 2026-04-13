import { useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EloBadge from '@/components/EloBadge';
import BracketTree from '@/components/BracketTree';
import LigaLogo from '@/components/LigaLogo';
import { useLiga } from '@/contexts/LigaContext';
import { ArrowLeft, Trophy } from 'lucide-react';

const CONFETTI_COLORS = ['#F59E0B', '#60A5FA', '#7C3AED', '#F97316', '#EC4899', '#10B981'];

function ConfettiLayer() {
  const pieces = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: `${3 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      shape: i % 2 === 0 ? 'podium-confetti-circle' : 'podium-confetti-square',
      size: 6 + Math.random() * 2,
    }))
  , []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {pieces.map(p => (
        <div
          key={p.id}
          className={`podium-confetti ${p.shape}`}
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            '--fall-duration': p.duration,
            '--fall-delay': p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

const PODIUM_COLORS = {
  1: { border: 'rgba(245,158,11,.4)', shadow: 'rgba(245,158,11,.12)', text: '#F59E0B', bg: 'linear-gradient(180deg, #2a2200, #1a1500)', topBorder: '#F59E0B', blockH: 80 },
  2: { border: 'rgba(156,163,175,.25)', shadow: 'rgba(156,163,175,.08)', text: '#9CA3AF', bg: 'linear-gradient(180deg, #1a1a1a, #111)', topBorder: '#9CA3AF', blockH: 56 },
  3: { border: 'rgba(205,124,63,.25)', shadow: 'rgba(205,124,63,.08)', text: '#CD7C3F', bg: 'linear-gradient(180deg, #1a0f08, #110a05)', topBorder: '#CD7C3F', blockH: 36 },
} as const;

export default function TournamentPodium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { nomeLiga } = useLiga();
  const players = usePlayerStore(s => s.players);
  const loadPlayers = usePlayerStore(s => s.load);
  const { tournaments, load: loadTournaments } = useTournamentStore();

  useEffect(() => {
    loadPlayers();
    if (!tournaments.length) loadTournaments();
  }, []);

  const tournament = useMemo(() =>
    tournaments.find(t => t.id === id && t.status === 'completed')
  , [tournaments, id]);

  const getPlayer = useCallback((pid: string) => players.find(p => p.id === pid), [players]);

  // Use location.state as primary data source for instant rendering
  const standings = useMemo(() => {
    const stateResults = (location.state as any)?.resultados;
    if (stateResults) return stateResults;
    return tournament?.finalStandings || null;
  }, [location.state, tournament]);

  if (!standings) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="font-heading text-xl" style={{ color: '#64748B' }}>Torneio não encontrado</p>
          <Link to="/history"><Button className="font-heading gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button></Link>
        </div>
      </div>
    );
  }

  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);
  // Display order: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3
    ? [{ s: top3[1], place: 2 }, { s: top3[0], place: 1 }, { s: top3[2], place: 3 }]
    : top3.map((s: any, i: number) => ({ s, place: i + 1 }));

  const delays = { 2: '0.2s', 1: '0s', 3: '0.35s' };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #060912 70%)' }}
    >
      <ConfettiLayer />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-8 pb-16 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <LigaLogo size={64} className="mx-auto" />
          <p className="font-body uppercase" style={{ fontSize: 12, color: '#64748B', letterSpacing: 2 }}>
            {nomeLiga}
          </p>
          <p className="font-heading font-bold uppercase" style={{ fontSize: 11, color: '#F59E0B', letterSpacing: 4 }}>
            CAMPEÃO DO TORNEIO
          </p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: 32 }}>
            {tournament?.name || 'Torneio'}
          </h1>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 pt-8">
          {podiumOrder.map(({ s: standing, place }) => {
            if (!standing) return null;
            const player = getPlayer(standing.playerId);
            if (!player) return null;
            const cfg = PODIUM_COLORS[place as 1 | 2 | 3];
            const isChampion = place === 1;
            const avatarSize = isChampion ? 72 : 58;

            return (
              <div
                key={standing.playerId}
                className="podium-block-rise flex flex-col items-center"
                style={{ '--rise-delay': delays[place as 1 | 2 | 3] } as React.CSSProperties}
              >
                {/* Player card */}
                <div
                  className="flex flex-col items-center gap-2"
                  style={{
                    background: '#111827',
                    borderRadius: 14,
                    padding: '20px 16px',
                    border: `1px solid ${cfg.border}`,
                    boxShadow: isChampion ? `0 0 30px ${cfg.shadow}` : undefined,
                    minWidth: isChampion ? 160 : 140,
                  }}
                >
                  {isChampion && (
                    <span className="animate-frame-float" style={{ fontSize: 24, lineHeight: 1 }}>👑</span>
                  )}
                  <Avatar
                    className="border-[3px]"
                    style={{ width: avatarSize, height: avatarSize, borderColor: cfg.text }}
                  >
                    {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                      <AvatarImage src={player.avatar} alt={player.name} />
                    ) : (
                      <AvatarFallback className="bg-muted text-2xl">{player.avatar}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-heading font-bold" style={{ fontSize: place === 1 ? 36 : 28, color: cfg.text }}>
                    {place}º
                  </span>
                  <span className="font-heading font-bold text-white text-center" style={{ fontSize: 16 }}>
                    {player.name}
                  </span>
                  <div className="flex items-center gap-1" style={{ color: cfg.text, fontSize: 13 }}>
                    <Trophy size={13} />
                    <span className="font-heading font-bold">{standing.wins} vitória{standing.wins !== 1 ? 's' : ''}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    {standing.losses} derrota{standing.losses !== 1 ? 's' : ''}
                  </span>
                  <span className="font-heading font-bold" style={{ fontSize: 13, color: '#60A5FA' }}>
                    +{standing.xpAwarded} XP
                  </span>
                </div>

                {/* Physical podium block */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '100%',
                    height: cfg.blockH,
                    background: cfg.bg,
                    borderTop: `2px solid ${cfg.topBorder}`,
                    borderRadius: '0 0 8px 8px',
                  }}
                >
                  <span className="font-heading font-bold" style={{ fontSize: 32, opacity: 0.15, color: cfg.text }}>
                    {place}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 pt-6">
          <Link to="/rankings">
            <Button
              variant="outline"
              className="font-heading tracking-wider gap-2"
              style={{ borderColor: 'rgba(37,99,235,.5)', color: '#60A5FA' }}
            >
              <Trophy className="h-4 w-4" /> Ver ranking atualizado
            </Button>
          </Link>
          <Link to="/tournament">
            <Button className="font-heading tracking-wider gap-2 bg-[#2563EB] hover:bg-[#2563EB]/80 text-white">
              Novo torneio
            </Button>
          </Link>
        </div>

        {/* Bracket Tree */}
        {tournament && tournament.rounds.length > 0 && (
          <BracketTree tournament={tournament} getPlayer={getPlayer} />
        )}

        {/* Rest of standings */}
        {rest.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading font-bold tracking-wider" style={{ fontSize: 18, color: '#64748B' }}>
              OUTRAS COLOCAÇÕES
            </h2>
            <div className="space-y-2">
              {rest.map((s: any) => {
                const player = getPlayer(s.playerId);
                if (!player) return null;
                return (
                  <div
                    key={s.playerId}
                    className={`glass-panel flex items-center gap-3 p-3 ${s.dropped ? 'opacity-50' : ''}`}
                  >
                    <span className="font-heading font-bold w-8 text-center" style={{ fontSize: 18, color: '#64748B' }}>
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
                      <p className={`font-heading font-bold text-sm truncate ${s.dropped ? 'line-through text-muted-foreground' : ''}`}>
                        {player.name}
                      </p>
                      {s.dropped && <span className="font-heading tracking-wider" style={{ fontSize: 9, color: '#EF4444' }}>DESISTENTE</span>}
                    </div>
                    <EloBadge xp={player.xp || 0} size="sm" />
                    <span className="font-body" style={{ fontSize: 12, color: '#64748B' }}>{s.wins}V/{s.losses}D</span>
                    <span className="font-heading font-bold" style={{ fontSize: 14, color: '#60A5FA' }}>
                      {s.dropped ? '-' : `+${s.xpAwarded} XP`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
