import { useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EloBadge from '@/components/EloBadge';
import BracketTree from '@/components/BracketTree';
import LigaLogo from '@/components/LigaLogo';
import { useLiga } from '@/contexts/LigaContext';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

const CONFETTI_COLORS = ['#4F8EF7', '#7B5CF6', '#F5A623', '#ffffff', '#EF4444', '#39FF14'];

function ConfettiLayer() {
  const pieces = useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: `${3 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      shape: i % 2 === 0 ? 'podium-confetti-circle' : 'podium-confetti-square',
      size: 6 + Math.random() * 6,
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

export default function TournamentPodium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const podiumConfig = [
    { placement: 2, height: 160, avatarSize: 56, color: '#9CA3AF', delay: '0.2s', label: '2º' },
    { placement: 1, height: 220, avatarSize: 72, color: '#F5A623', delay: '0s', label: '1º' },
    { placement: 3, height: 120, avatarSize: 56, color: '#CD7C3F', delay: '0.4s', label: '3º' },
  ];

  // Reorder: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #090b12 70%)' }}>
      <ConfettiLayer />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-8 pb-16 space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <LigaLogo size={80} className="mx-auto" />
          <p className="font-heading text-sm font-semibold tracking-[0.15em] text-muted-foreground uppercase">{nomeLiga}</p>
          <p className="font-heading text-[13px] font-bold tracking-[0.3em] uppercase" style={{ color: '#F5A623', letterSpacing: '4px' }}>
            CAMPEÃO DO TORNEIO
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider text-foreground">
            {tournament.name}
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            {new Date(tournament.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 pt-8">
          {podiumOrder.map((standing, displayIdx) => {
            if (!standing) return null;
            const player = getPlayer(standing.playerId);
            if (!player) return null;
            const config = top3.length >= 3 ? podiumConfig[displayIdx] : podiumConfig[1];
            const isChampion = standing.placement === 1;

            return (
              <div
                key={standing.playerId}
                className="podium-block-rise flex flex-col items-center"
                style={{ '--rise-delay': config.delay } as React.CSSProperties}
              >
                {/* Trophy for champion */}
                {isChampion && (
                  <div className="mb-2">
                    <svg viewBox="0 0 48 48" className="h-8 w-8 mx-auto" fill="none">
                      <path d="M14 8h20v4c0 6-4 14-10 16-6-2-10-10-10-16V8z" fill="#F5A623" fillOpacity="0.9" />
                      <path d="M10 8H6c0 6 2 10 6 12v-4C10 14 10 10 10 8z" fill="#F5A623" fillOpacity="0.6" />
                      <path d="M38 8h4c0 6-2 10-6 12v-4c2-2 2-6 2-8z" fill="#F5A623" fillOpacity="0.6" />
                      <rect x="20" y="28" width="8" height="6" rx="1" fill="#F5A623" fillOpacity="0.7" />
                      <rect x="16" y="34" width="16" height="4" rx="2" fill="#F5A623" fillOpacity="0.5" />
                    </svg>
                  </div>
                )}

                {/* Avatar */}
                <div className={`relative mb-3 ${isChampion ? 'podium-champion-glow rounded-full' : ''}`}>
                  <Avatar
                    className="border-[3px]"
                    style={{
                      width: config.avatarSize,
                      height: config.avatarSize,
                      borderColor: config.color,
                    }}
                  >
                    {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                      <AvatarImage src={player.avatar} alt={player.name} />
                    ) : (
                      <AvatarFallback className="bg-muted text-2xl">{player.avatar}</AvatarFallback>
                    )}
                  </Avatar>
                </div>

                {/* Podium block */}
                <div
                  className="w-24 sm:w-32 rounded-t-xl flex flex-col items-center justify-start pt-4 gap-1"
                  style={{
                    height: config.height,
                    background: '#1a2035',
                    borderTop: `3px solid ${config.color}`,
                  }}
                >
                  <span className="font-heading text-3xl font-bold italic" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <p className="font-heading font-bold text-foreground text-sm text-center truncate w-full px-2">
                    {player.name}
                  </p>
                  {player.nickname && (
                    <p className="text-[10px] text-muted-foreground truncate w-full text-center px-2">
                      @{player.nickname.replace(/^@/, '')}
                    </p>
                  )}
                  <EloBadge xp={player.xp || 0} size="sm" />
                  <p className="text-sm font-heading font-bold mt-1" style={{ color: config.color }}>
                    🏆 {standing.wins} vitória{standing.wins !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{standing.losses} derrota{standing.losses !== 1 ? 's' : ''}</p>
                  <p className="text-xs font-heading font-bold mt-1" style={{ color: config.color }}>
                    +{standing.xpAwarded} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 pt-6">
          <Link to="/rankings">
            <Button variant="outline" className="font-heading tracking-wider gap-2 border-[#4F8EF7]/50 text-[#4F8EF7] hover:bg-[#4F8EF7]/10">
              <Trophy className="h-4 w-4" /> Ver ranking atualizado
            </Button>
          </Link>
          <Link to="/tournament">
            <Button className="font-heading tracking-wider gap-2 bg-[#4F8EF7] hover:bg-[#4F8EF7]/80 text-white">
              Novo torneio
            </Button>
          </Link>
        </div>

        {/* Bracket Tree */}
        {tournament.rounds.length > 0 && (
          <BracketTree tournament={tournament} getPlayer={getPlayer} />
        )}

        {/* Rest of standings */}
        {rest.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-bold tracking-wider text-muted-foreground italic">OUTRAS COLOCAÇÕES</h2>
            <div className="space-y-2">
              {rest.map(s => {
                const player = getPlayer(s.playerId);
                if (!player) return null;
                return (
                  <div key={s.playerId} className={`glass-panel flex items-center gap-3 p-3 ${s.dropped ? 'opacity-50' : ''}`}>
                    <span className="font-heading text-lg font-bold w-8 text-center text-muted-foreground italic">#{s.placement}</span>
                    <Avatar className="h-8 w-8 border border-border">
                      {player.avatar.startsWith('http') || player.avatar.startsWith('data:') ? (
                        <AvatarImage src={player.avatar} alt={player.name} />
                      ) : (
                        <AvatarFallback className="bg-muted text-sm">{player.avatar}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`font-heading font-bold text-sm truncate ${s.dropped ? 'line-through text-muted-foreground' : ''}`}>{player.name}</p>
                      {s.dropped && <span className="text-[9px] font-heading text-destructive tracking-wider">DESISTENTE</span>}
                    </div>
                    <EloBadge xp={player.xp || 0} size="sm" />
                    <span className="text-xs text-muted-foreground font-body">{s.wins}V/{s.losses}D</span>
                    <span className="font-heading font-bold text-sm" style={{ color: '#4F8EF7' }}>
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
