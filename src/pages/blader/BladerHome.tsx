import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Trophy, Zap, Flame, Target, MapPin, Calendar, ArrowRight } from 'lucide-react';

interface TournamentRow {
  id: string;
  name: string;
  date: string;
  status: string;
  liga_id: string | null;
  player_ids: string[];
  max_players: number | null;
  final_standings: unknown;
}

export default function BladerHome() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['blader-all-tournaments', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, date, status, liga_id, player_ids, max_players, final_standings')
        .order('date', { ascending: false });
      return (data ?? []) as TournamentRow[];
    },
    enabled: !!user,
  });

  // Encontra os players associados a este blader (mesmo nome) para calcular stats
  const { data: myPlayerIds = [] } = useQuery({
    queryKey: ['blader-player-ids', user?.id, profile?.nome],
    queryFn: async () => {
      if (!profile?.nome) return [];
      const { data } = await supabase
        .from('players')
        .select('id')
        .eq('name', profile.nome);
      return (data ?? []).map(p => p.id);
    },
    enabled: !!profile?.nome,
  });

  const myTournaments = tournaments.filter(t => t.player_ids.some(pid => myPlayerIds.includes(pid)));
  const completed = myTournaments.filter(t => t.status === 'completed');

  // Stats
  let totalWins = 0;
  let totalLosses = 0;
  let topPlacement = Infinity;
  completed.forEach(t => {
    const standings = (t.final_standings as Array<{ playerId: string; placement: number; wins: number; losses: number }> | null) || [];
    const mine = standings.find(s => myPlayerIds.includes(s.playerId));
    if (mine) {
      totalWins += mine.wins || 0;
      totalLosses += mine.losses || 0;
      if (mine.placement < topPlacement) topPlacement = mine.placement;
    }
  });
  const totalGames = totalWins + totalLosses;
  const winrate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const bestPlace = topPlacement === Infinity ? '—' : `#${topPlacement}`;

  // Próximos torneios (upcoming, não inscrito)
  const upcoming = tournaments
    .filter(t => t.status === 'upcoming')
    .filter(t => !t.player_ids.some(pid => myPlayerIds.includes(pid)))
    .slice(0, 5);

  // Meus torneios recentes
  const myRecent = myTournaments.slice(0, 3);

  const initials = (profile?.nome || 'BL').slice(0, 2).toUpperCase();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div
        className="rounded-2xl p-5 md:p-6 flex items-center gap-4 md:gap-5"
        style={{
          background: 'linear-gradient(135deg, #1a1208 0%, #111827 60%)',
          border: '1px solid rgba(245,158,11,.15)',
        }}
      >
        <div className="shrink-0">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.nome || 'Blader'}
              className="rounded-full object-cover"
              style={{ width: 64, height: 64, border: '2px solid rgba(245,158,11,.5)' }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center"
              style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #B45309, #EF4444)', border: '2px solid rgba(245,158,11,.5)' }}
            >
              <span className="font-heading font-bold text-white" style={{ fontSize: 22 }}>{initials}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-foreground" style={{ fontSize: 20, lineHeight: 1.2 }}>
            Olá, {profile?.nome || 'Blader'}!
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {profile?.cidade && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                <MapPin size={12} /> {profile.cidade}
              </span>
            )}
            {profile?.beybladeFavorita && (
              <span className="text-xs font-body" style={{ color: '#FBBF24' }}>
                ⚡ {profile.beybladeFavorita}
              </span>
            )}
          </div>
          {profile?.bio && (
            <p className="text-xs text-muted-foreground font-body mt-2 line-clamp-2">{profile.bio}</p>
          )}
        </div>
        <div className="hidden md:flex flex-col items-end shrink-0">
          <span className="font-heading font-bold" style={{ fontSize: 28, color: '#FBBF24' }}>
            {myTournaments.length}
          </span>
          <span className="font-body uppercase" style={{ fontSize: 9, letterSpacing: 1.5, color: '#9CA3AF' }}>
            torneios
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Trophy size={16} />} label="Torneios" value={myTournaments.length} color="#60A5FA" />
        <StatCard icon={<Zap size={16} />} label="Vitórias" value={totalWins} color="#10B981" />
        <StatCard icon={<Flame size={16} />} label="Melhor coloc." value={bestPlace} color="#F59E0B" />
        <StatCard icon={<Target size={16} />} label="Winrate" value={`${winrate}%`} color="#A78BFA" />
      </div>

      {/* Próximos torneios */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold uppercase text-foreground" style={{ fontSize: 14, letterSpacing: 1.5 }}>
            Próximos torneios
          </h2>
          <button
            onClick={() => navigate('/blader/tournaments')}
            className="text-xs font-body flex items-center gap-1"
            style={{ color: '#FBBF24' }}
          >
            Ver todos <ArrowRight size={12} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState message="Nenhum torneio aberto no momento." />
        ) : (
          <div className="space-y-2">
            {upcoming.map(t => (
              <TournamentRowCard
                key={t.id}
                tournament={t}
                onSignup={() => navigate(`/signup/${t.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Meus torneios recentes */}
      <section>
        <h2 className="font-heading font-bold uppercase text-foreground mb-3" style={{ fontSize: 14, letterSpacing: 1.5 }}>
          Meus torneios recentes
        </h2>
        {myRecent.length === 0 ? (
          <EmptyState message="Você ainda não participou de nenhum torneio." />
        ) : (
          <div className="space-y-2">
            {myRecent.map(t => {
              const standings = (t.final_standings as Array<{ playerId: string; placement: number; wins: number; losses: number }> | null) || [];
              const mine = standings.find(s => myPlayerIds.includes(s.playerId));
              return <RecentTournamentCard key={t.id} tournament={t} placement={mine?.placement} wins={mine?.wins ?? 0} losses={mine?.losses ?? 0} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)' }}
    >
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className="font-body uppercase font-medium" style={{ fontSize: 10, letterSpacing: 1.5, color: '#9CA3AF' }}>
          {label}
        </span>
      </div>
      <div className="font-heading font-bold" style={{ fontSize: 26, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function TournamentRowCard({ tournament, onSignup }: { tournament: TournamentRow; onSignup: () => void }) {
  const isFull = tournament.max_players != null && tournament.player_ids.length >= tournament.max_players;
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)' }}
    >
      <div
        className="shrink-0 rounded-lg flex items-center justify-center"
        style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)' }}
      >
        <Trophy size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-foreground truncate" style={{ fontSize: 14 }}>
          {tournament.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-body">
          <Calendar size={11} />
          <span>{new Date(tournament.date).toLocaleDateString('pt-BR')}</span>
          <span>•</span>
          <span>{tournament.player_ids.length}{tournament.max_players ? `/${tournament.max_players}` : ''} inscritos</span>
        </div>
      </div>
      {isFull ? (
        <span className="text-xs font-body shrink-0" style={{ color: '#EF4444' }}>Esgotado</span>
      ) : (
        <button
          onClick={onSignup}
          className="shrink-0 rounded-lg px-3 py-1.5 font-body font-medium text-xs transition-all"
          style={{ background: '#F59E0B', color: '#0a0d18' }}
        >
          Inscrever-se
        </button>
      )}
    </div>
  );
}

function RecentTournamentCard({ tournament, placement, wins, losses }: { tournament: TournamentRow; placement?: number; wins: number; losses: number }) {
  const podiumColor = placement === 1 ? '#FBBF24' : placement === 2 ? '#9CA3AF' : placement === 3 ? '#B45309' : '#60A5FA';
  const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : null;
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: '#111827', border: `1px solid ${podiumColor}33`, borderLeft: `3px solid ${podiumColor}` }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-foreground truncate" style={{ fontSize: 14 }}>
          {tournament.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs font-body" style={{ color: '#9CA3AF' }}>
          <span>{new Date(tournament.date).toLocaleDateString('pt-BR')}</span>
          <span>•</span>
          <span>{wins}V · {losses}D</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-heading font-bold" style={{ fontSize: 18, color: podiumColor }}>
          {medal} {placement ? `#${placement}` : '—'}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}
    >
      <p className="text-sm text-muted-foreground font-body">{message}</p>
    </div>
  );
}
