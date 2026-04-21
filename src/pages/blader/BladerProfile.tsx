import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { MapPin, Trophy, Zap, Target, Award, ArrowLeft, Calendar, Flame } from 'lucide-react';
import { computeAchievements } from '@/lib/achievements';
import BladerAvatar from '@/components/BladerAvatar';
import { getBladerHeaderGradient, getBladerPalette } from '@/lib/bladerColors';

interface ProfileRow {
  id: string;
  nome_liga: string | null;
  nome_blader: string | null;
  cidade: string | null;
  cidade_blader: string | null;
  beyblade_favorita: string | null;
  avatar_url: string | null;
  avatar_blader_url: string | null;
  bio: string | null;
  bio_blader: string | null;
  tipo_conta: string;
  tem_perfil_blader: boolean;
  cor_perfil?: string | null;
}

interface TournamentRow {
  id: string;
  name: string;
  date: string;
  status: string;
  player_ids: string[];
  final_standings: unknown;
  rounds: unknown;
}

const SELECT_COLS = 'id, nome_liga, nome_blader, cidade, cidade_blader, beyblade_favorita, avatar_url, avatar_blader_url, bio, bio_blader, tipo_conta, tem_perfil_blader, cor_perfil';

export default function BladerProfile() {
  const { userId, name: nameParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: ownProfile } = useUserProfile();

  // Resolve qual perfil mostrar
  const isOwn = !userId && !nameParam;
  const targetUserId = userId || (isOwn ? user?.id : undefined);
  const targetName = nameParam ? decodeURIComponent(nameParam) : undefined;

  const { data: targetProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['blader-profile', targetUserId, targetName],
    queryFn: async () => {
      if (targetUserId) {
        const { data } = await supabase.from('profiles').select(SELECT_COLS).eq('id', targetUserId).maybeSingle();
        return data as ProfileRow | null;
      }
      if (targetName) {
        // Search by blader name first, then by liga name
        let { data } = await supabase.from('profiles').select(SELECT_COLS).eq('nome_blader', targetName).maybeSingle();
        if (!data) {
          const res = await supabase.from('profiles').select(SELECT_COLS).eq('nome_liga', targetName).maybeSingle();
          data = res.data;
        }
        return data as ProfileRow | null;
      }
      return null;
    },
    enabled: !!(targetUserId || targetName),
  });

  const correlationName = targetProfile?.nome_blader || targetProfile?.nome_liga || targetName || ownProfile?.nomeBlader || ownProfile?.nome || null;

  const { data: playerIds = [] } = useQuery({
    queryKey: ['blader-profile-player-ids', correlationName],
    queryFn: async () => {
      if (!correlationName) return [];
      const { data } = await supabase.from('players').select('id').eq('name', correlationName);
      return (data ?? []).map(p => p.id);
    },
    enabled: !!correlationName,
  });

  const { data: tournaments = [], isLoading: tournLoading } = useQuery({
    queryKey: ['blader-profile-tournaments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, date, status, player_ids, final_standings, rounds')
        .order('date', { ascending: false });
      return (data ?? []) as TournamentRow[];
    },
  });

  const { history, stats } = useMemo(() => {
    const myTournaments = tournaments.filter(t => t.player_ids.some(pid => playerIds.includes(pid)));
    const completed = myTournaments.filter(t => t.status === 'completed');

    let totalWins = 0, totalLosses = 0, podiums = 0, championships = 0;
    let bestPlacement = Infinity;
    let longestStreak = 0;

    const enriched = myTournaments.map(t => {
      const standings = (t.final_standings as Array<{ playerId: string; placement: number; wins: number; losses: number }> | null) || [];
      const mine = standings.find(s => playerIds.includes(s.playerId));
      if (mine) {
        totalWins += mine.wins || 0;
        totalLosses += mine.losses || 0;
        if (mine.placement <= 3) podiums++;
        if (mine.placement === 1) championships++;
        if (mine.placement < bestPlacement) bestPlacement = mine.placement;
      }

      const rounds = (t.rounds as Array<{ matches: Array<{ player1Id: string; player2Id: string; result?: { winnerId?: string } }> }> | null) || [];
      let cur = 0, max = 0;
      for (const r of rounds) {
        for (const m of r.matches || []) {
          const involves = playerIds.includes(m.player1Id) || playerIds.includes(m.player2Id);
          if (!involves || !m.result?.winnerId) continue;
          if (playerIds.includes(m.result.winnerId)) { cur++; if (cur > max) max = cur; }
          else { cur = 0; }
        }
      }
      if (max > longestStreak) longestStreak = max;

      return { ...t, _placement: mine?.placement, _wins: mine?.wins ?? 0, _losses: mine?.losses ?? 0 };
    });

    const totalGames = totalWins + totalLosses;
    const winrate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    return {
      history: enriched,
      stats: {
        tournamentsPlayed: completed.length,
        totalWins, totalLosses, winrate,
        podiums, championships,
        bestPlacement: bestPlacement === Infinity ? 0 : bestPlacement,
        longestStreak,
      },
    };
  }, [tournaments, playerIds]);

  const achievements = useMemo(() => computeAchievements({
    tournamentsPlayed: stats.tournamentsPlayed,
    totalWins: stats.totalWins,
    totalLosses: stats.totalLosses,
    podiums: stats.podiums,
    championships: stats.championships,
    bestPlacement: stats.bestPlacement || 999,
    longestStreak: stats.longestStreak,
  }), [stats]);

  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  const displayName = targetProfile?.nome_blader || targetProfile?.nome_liga || correlationName || 'Blader';
  const displayCidade = targetProfile?.cidade_blader || targetProfile?.cidade;
  const displayBey = targetProfile?.beyblade_favorita;
  const displayAvatar = targetProfile?.avatar_blader_url || targetProfile?.avatar_url;
  const displayBio = targetProfile?.bio_blader || targetProfile?.bio;
  const colorKey = targetProfile?.cor_perfil || (isOwn ? ownProfile?.corPerfil : 'blue') || 'blue';
  const palette = getBladerPalette(colorKey);

  if (profileLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="rounded-2xl h-48 animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />
      </div>
    );
  }

  if (!targetProfile && !isOwn) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <p className="font-body text-muted-foreground">Blader não encontrado.</p>
        <button onClick={() => navigate(-1)} className="mt-4 font-body text-sm" style={{ color: palette.accent }}>
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {!isOwn && (
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 font-body text-xs" style={{ color: '#9CA3AF' }}>
          <ArrowLeft size={14} /> Voltar
        </button>
      )}

      {/* Header com gradiente personalizado */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{ background: getBladerHeaderGradient(colorKey), border: `1px solid ${palette.border}` }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,.3) 0%, transparent 40%)',
          }}
        />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-5">
          <BladerAvatar
            url={displayAvatar}
            name={displayName}
            colorKey={colorKey}
            size={96}
            borderWidth={3}
            glow
            style={{ borderColor: 'rgba(255,255,255,.7)' }}
          />
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h1 className="font-heading font-bold text-white" style={{ fontSize: 28, lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 mt-2">
              {displayCidade && (
                <span className="flex items-center gap-1 font-body text-white/90" style={{ fontSize: 13 }}>
                  <MapPin size={13} /> {displayCidade}
                </span>
              )}
              {displayBey && (
                <span
                  className="font-body inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ fontSize: 12, background: 'rgba(0,0,0,.25)', color: '#fff', backdropFilter: 'blur(4px)' }}
                >
                  ⚡ {displayBey}
                </span>
              )}
            </div>
            {displayBio && (
              <p className="font-body text-white/85 mt-3 max-w-xl" style={{ fontSize: 13, lineHeight: 1.5 }}>
                {displayBio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats em linha — todos usam a accent color */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={<Zap size={16} />} label="Vitórias"   value={stats.totalWins}        color={palette.accent} />
        <StatBox icon={<Trophy size={16} />} label="Torneios" value={stats.tournamentsPlayed} color={palette.accent} />
        <StatBox icon={<Flame size={16} />} label="Streak máx" value={stats.longestStreak}    color={palette.accent} />
        <StatBox icon={<Target size={16} />} label="Winrate"  value={`${stats.winrate}%`}     color={palette.accent} />
      </div>

      {/* Conquistas */}
      <section>
        <h2 className="font-heading font-bold uppercase text-foreground mb-3 flex items-center gap-2" style={{ fontSize: 14, letterSpacing: 1.5 }}>
          <Award size={16} style={{ color: palette.accent }} />
          Conquistas
          <span className="font-body normal-case font-normal" style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: 0 }}>
            {earned.length}/{achievements.length}
          </span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {earned.map(a => (
            <div
              key={a.id}
              className="rounded-xl p-3 flex flex-col items-center text-center gap-2"
              style={{ background: `${palette.accent}14`, border: `1px solid ${palette.accent}40` }}
            >
              <div
                className="rounded-lg flex items-center justify-center"
                style={{ width: 44, height: 44, background: `${palette.accent}25`, fontSize: 22 }}
              >
                {a.icon}
              </div>
              <p className="font-heading font-bold" style={{ fontSize: 12, color: palette.accent, lineHeight: 1.2 }}>
                {a.title}
              </p>
            </div>
          ))}

          {locked.map(a => (
            <div
              key={a.id}
              className="rounded-xl p-3 flex flex-col items-center text-center gap-2"
              style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', opacity: 0.35 }}
              title={a.hint || a.description}
            >
              <div
                className="rounded-lg flex items-center justify-center grayscale"
                style={{ width: 44, height: 44, background: 'rgba(255,255,255,.04)', fontSize: 22 }}
              >
                🔒
              </div>
              <p className="font-heading font-bold" style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.2 }}>
                {a.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico */}
      <section>
        <h2 className="font-heading font-bold uppercase text-foreground mb-3" style={{ fontSize: 14, letterSpacing: 1.5 }}>
          Histórico
        </h2>

        {tournLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}>
            <p className="text-sm text-muted-foreground font-body">Nenhum torneio no histórico ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(t => {
              const placement = t._placement;
              const podiumColor = placement === 1 ? '#FBBF24'
                : placement === 2 ? '#9CA3AF'
                : placement === 3 ? '#B45309'
                : t.status === 'upcoming' ? palette.accent
                : '#4B5563';
              const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : null;
              return (
                <div
                  key={t.id}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: '#111827', border: `1px solid ${podiumColor}33`, borderLeft: `3px solid ${podiumColor}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-foreground truncate" style={{ fontSize: 14 }}>{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs font-body" style={{ color: '#9CA3AF' }}>
                      <Calendar size={11} />
                      <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                      {t.status === 'completed' && (<><span>•</span><span>{t._wins}V · {t._losses}D</span></>)}
                      {t.status !== 'completed' && (<><span>•</span><span style={{ color: podiumColor }}>{t.status === 'upcoming' ? 'Inscrito' : 'Em andamento'}</span></>)}
                    </div>
                  </div>
                  {placement && (
                    <div className="shrink-0 text-right">
                      <div className="font-heading font-bold" style={{ fontSize: 18, color: podiumColor }}>{medal} #{placement}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#111827', border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className="font-body uppercase font-medium" style={{ fontSize: 10, letterSpacing: 1.5, color: '#9CA3AF' }}>
          {label}
        </span>
      </div>
      <div className="font-heading font-bold" style={{ fontSize: 26, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
