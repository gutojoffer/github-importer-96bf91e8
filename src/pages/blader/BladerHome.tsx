import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { MapPin, Calendar, ArrowRight, Trophy } from 'lucide-react';
import BladerAvatar from '@/components/BladerAvatar';
import { getBladerPalette } from '@/lib/bladerColors';
import { useEffect, useState, useMemo } from 'react';
import BladerTournamentModal from '@/components/blader/BladerTournamentModal';
import { toast } from 'sonner';
import { verificarEExecutarMatch } from '@/lib/bladerMatch';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface TournamentRow {
  id: string;
  name: string;
  date: string;
  status: string;
  liga_id: string | null;
  player_ids: string[];
  max_players: number | null;
  final_standings: unknown;
  local_nome: string | null;
  local_endereco: string | null;
  local_cidade: string | null;
  local_estado: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  descricao: string | null;
  imagem_url: string | null;
  premio: string | null;
  regras: string | null;
}

const NIVEIS = [
  { nome: 'Rookie',     xpMin: 0,     xpMax: 99 },
  { nome: 'Challenger', xpMin: 100,   xpMax: 299 },
  { nome: 'Fighter',    xpMin: 300,   xpMax: 699 },
  { nome: 'Warrior',    xpMin: 700,   xpMax: 1499 },
  { nome: 'Champion',   xpMin: 1500,  xpMax: 2999 },
  { nome: 'Legend',     xpMin: 3000,  xpMax: 9999 },
  { nome: 'Mythic',     xpMin: 10000, xpMax: Infinity },
];

function calcularNivel(xp: number) {
  const idx = NIVEIS.findIndex(n => xp >= n.xpMin && xp <= n.xpMax);
  const atual = NIVEIS[idx] ?? NIVEIS[0];
  const proximo = NIVEIS[idx + 1] ?? null;
  const xpBase = atual.xpMin;
  const xpTopo = proximo ? proximo.xpMin : atual.xpMin + 1;
  const progresso = proximo
    ? Math.min(100, Math.round(((xp - xpBase) / (xpTopo - xpBase)) * 100))
    : 100;
  return {
    atual,
    proximo,
    progresso,
    xpParaProximo: proximo ? Math.max(0, proximo.xpMin - xp) : 0,
  };
}

function isHoje(data: string | null) {
  if (!data) return false;
  const hoje = new Date();
  const d = new Date(data);
  return hoje.getDate() === d.getDate() && hoje.getMonth() === d.getMonth() && hoje.getFullYear() === d.getFullYear();
}

function isAmanha(data: string | null) {
  if (!data) return false;
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const d = new Date(data);
  return amanha.getDate() === d.getDate() && amanha.getMonth() === d.getMonth() && amanha.getFullYear() === d.getFullYear();
}

function corPosicao(pos: number | null | undefined) {
  if (pos === 1) return '#F59E0B';
  if (pos === 2) return '#9CA3AF';
  if (pos === 3) return '#CD7C3F';
  return 'rgba(255,255,255,.15)';
}

const ABAS = ['Visão Geral', 'Histórico', 'Gráficos'] as const;
type Aba = typeof ABAS[number];

export default function BladerHome() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<TournamentRow | null>(null);
  const [confirmandoDesistencia, setConfirmandoDesistencia] = useState<TournamentRow | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('Visão Geral');

  const bladerName = profile?.nomeBlader || profile?.nome || null;
  const bladerAvatar = profile?.avatarBladerUrl || profile?.avatarUrl || null;
  const bladerCity = profile?.cidadeBlader || profile?.cidade || null;

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['blader-profile-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Buscar profile + agregados de inscricoes em paralelo (tabela 'partidas' nao existe)
      const [profileRes, inscRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('torneios_total, vitorias_total, xp_total, nivel, melhor_posicao, streak_max')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('inscricoes')
          .select('vitorias, derrotas')
          .eq('blader_id', user.id),
      ]);

      const d = profileRes.data as any;
      const inscricoes = (inscRes.data ?? []) as Array<{ vitorias: number | null; derrotas: number | null }>;
      const totalV = inscricoes.reduce((acc, r) => acc + (r.vitorias ?? 0), 0);
      const totalD = inscricoes.reduce((acc, r) => acc + (r.derrotas ?? 0), 0);
      const totalPartidas = totalV + totalD;
      const vitorias = d?.vitorias_total ?? totalV;

      return {
        torneios_total: d?.torneios_total ?? 0,
        vitorias_total: vitorias,
        xp_total: d?.xp_total ?? 0,
        nivel: d?.nivel ?? 'Rookie',
        melhor_posicao: d?.melhor_posicao ?? null,
        streak_max: d?.streak_max ?? 0,
        winrate: totalPartidas > 0 ? Math.round((vitorias / totalPartidas) * 100) : 0,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: myInscricoes = [], refetch: refetchInscricoes } = useQuery({
    queryKey: ['blader-inscricoes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('inscricoes')
        .select('torneio_id')
        .eq('blader_id', user.id);
      return (data ?? []).map(r => r.torneio_id);
    },
    enabled: !!user,
  });

  const myInscricoesSet = new Set(myInscricoes);

  const { data: tournaments = [], isLoading, refetch } = useQuery({
    queryKey: ['blader-all-tournaments', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, date, status, liga_id, player_ids, max_players, final_standings, local_nome, local_endereco, local_cidade, local_estado, horario_inicio, horario_fim, descricao, imagem_url, premio, regras')
        .order('date', { ascending: false });
      return (data ?? []) as TournamentRow[];
    },
    enabled: !!user,
  });

  // Histórico detalhado para Histórico/Gráficos
  const { data: historico = [] } = useQuery({
    queryKey: ['blader-historico', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from('inscricoes')
        .select('id, posicao_final, vitorias, derrotas, xp_ganho, streak_max, inscrito_em, torneio_id, tournaments:torneio_id(id, name, horario_inicio, status, imagem_url, liga_id)')
        .eq('blader_id', user.id)
        .order('inscrito_em', { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    async function verificarMatchPendente() {
      if (!user) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('match_verificado')
        .eq('id', user.id)
        .single();
      if (!(p as any)?.match_verificado) {
        await verificarEExecutarMatch(user.id, user.email);
        refetchStats();
        refetchInscricoes();
        refetch();
      }
    }
    verificarMatchPendente();
  }, [user, refetchStats, refetchInscricoes, refetch]);

  const torneiosTotal = stats?.torneios_total ?? 0;
  const vitoriasTotal = stats?.vitorias_total ?? 0;
  const bestPlace = stats?.melhor_posicao ? `${stats.melhor_posicao}º` : '—';
  const winrateNum = stats?.winrate ?? 0;
  const xpTotal = stats?.xp_total ?? 0;
  const nivelInfo = useMemo(() => calcularNivel(xpTotal), [xpTotal]);
  const streakMax = stats?.streak_max ?? 0;

  const upcoming = tournaments.filter(t => t.status === 'upcoming').slice(0, 5);
  const myRecent = tournaments.filter(t => t.status === 'completed' && myInscricoesSet.has(t.id)).slice(0, 3);

  const palette = getBladerPalette(profile?.corPerfil);
  const dateRef = (t: TournamentRow) => t.horario_inicio || t.date;

  async function handleDesistir(torneioId: string) {
    if (!user) return;
    const { error } = await supabase.from('inscricoes').delete().eq('torneio_id', torneioId).eq('blader_id', user.id);
    if (error) { toast.error('Erro ao cancelar inscrição'); return; }
    setConfirmandoDesistencia(null);
    toast.success('Inscrição cancelada com sucesso');
    refetchInscricoes();
    refetch();
  }

  const statsGrid = [
    { label: 'Torneios',    value: torneiosTotal,                                                     icon: '🏆', color: '#00DCFF', sub: 'disputados' },
    { label: 'Vitórias',    value: vitoriasTotal,                                                     icon: '⚡', color: '#10B981', sub: 'no total' },
    { label: 'Winrate',     value: `${winrateNum}%`,                                                  icon: '🎯', color: '#A78BFA', sub: 'aproveitamento' },
    { label: 'Streak Máx',  value: streakMax,                                                         icon: '🔥', color: '#F97316', sub: 'consecutivas' },
    { label: 'Melhor Pos.', value: bestPlace,                                                         icon: '🥇', color: '#F59E0B', sub: 'colocação' },
    { label: 'Nível',       value: stats?.nivel || 'Rookie',                                          icon: '⭐', color: '#EC4899', sub: `${xpTotal} XP` },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Welcome / Hero */}
      <div
        className="rounded-2xl p-5 md:p-6 flex items-center gap-4 md:gap-5"
        style={{
          background: `linear-gradient(135deg, ${palette.from}22 0%, #111827 60%)`,
          border: `1px solid ${palette.border}`,
        }}
      >
        <BladerAvatar url={bladerAvatar} name={bladerName} colorKey={profile?.corPerfil} size={64} borderWidth={2} />
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-foreground" style={{ fontSize: 20, lineHeight: 1.2 }}>
            Olá, {bladerName || 'Blader'}!
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {bladerCity && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                <MapPin size={12} /> {bladerCity}
              </span>
            )}
            {profile?.beybladeFavorita && (
              <span className="text-xs font-body" style={{ color: palette.accent }}>
                ⚡ {profile.beybladeFavorita}
              </span>
            )}
          </div>
          {profile?.bioBlader && (
            <p className="text-xs text-muted-foreground font-body mt-2 line-clamp-2">{profile.bioBlader}</p>
          )}
        </div>
        <div className="hidden md:flex flex-col items-end shrink-0">
          <span className="font-heading font-bold" style={{ fontSize: 28, color: palette.accent }}>
            {torneiosTotal}
          </span>
          <span className="font-body uppercase" style={{ fontSize: 9, letterSpacing: 1.5, color: '#9CA3AF' }}>
            torneios
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4,
        background: '#08091a',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 12, padding: 4,
      }}>
        {ABAS.map(aba => {
          const ativa = abaAtiva === aba;
          return (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              style={{
                flex: 1, padding: '9px 12px',
                borderRadius: 9, border: 'none',
                background: ativa
                  ? 'linear-gradient(135deg,rgba(0,220,255,.15),rgba(0,220,255,.08))'
                  : 'transparent',
                borderBottom: ativa ? '2px solid #00DCFF' : '2px solid transparent',
                color: ativa ? '#00DCFF' : 'rgba(255,255,255,.35)',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700, fontSize: 13,
                letterSpacing: 1, cursor: 'pointer',
                transition: 'all .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {aba}
            </button>
          );
        })}
      </div>

      {abaAtiva === 'Visão Geral' && (
        <>
          {/* Stats grid 3x2 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statsGrid.map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span className="font-body uppercase font-medium" style={{ fontSize: 10, letterSpacing: 1.5, color: '#9CA3AF' }}>{s.label}</span>
                </div>
                <div className="font-heading font-bold" style={{ fontSize: 24, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Barra de XP */}
          <div style={{ background: '#08091a', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>{nivelInfo.atual.nome}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                {xpTotal} {nivelInfo.proximo ? `/ ${nivelInfo.proximo.xpMin}` : ''} XP
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #00DCFF, #A78BFA)',
                width: `${nivelInfo.progresso}%`,
                transition: 'width 1s ease-out',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 6 }}>
              {nivelInfo.proximo
                ? `${nivelInfo.xpParaProximo} XP para ${nivelInfo.proximo.nome}`
                : 'Nível máximo alcançado!'}
            </div>
          </div>

          {/* Tabela de níveis */}
          <div style={{ background: '#08091a', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', marginBottom: 10 }}>Níveis</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {NIVEIS.map(n => {
                const ativo = n.nome === nivelInfo.atual.nome;
                return (
                  <div key={n.nome} style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: ativo ? 'rgba(0,220,255,.08)' : 'rgba(255,255,255,.02)',
                    border: ativo ? '1px solid rgba(0,220,255,.3)' : '1px solid rgba(255,255,255,.04)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ativo ? '#00DCFF' : '#fff' }}>{n.nome}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                      {n.xpMax === Infinity ? `${n.xpMin}+ XP` : `${n.xpMin} – ${n.xpMax} XP`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Próximos torneios */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold uppercase text-foreground" style={{ fontSize: 14, letterSpacing: 1.5 }}>
                Próximos torneios
              </h2>
              <button onClick={() => navigate('/blader/tournaments')} className="text-xs font-body flex items-center gap-1" style={{ color: '#FBBF24' }}>
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
                    isHoje={isHoje(dateRef(t))}
                    isAmanha={isAmanha(dateRef(t))}
                    inscrito={myInscricoesSet.has(t.id)}
                    onSignup={() => setSelectedTournament(t)}
                    onWithdraw={() => setConfirmandoDesistencia(t)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recentes */}
          <section>
            <h2 className="font-heading font-bold uppercase text-foreground mb-3" style={{ fontSize: 14, letterSpacing: 1.5 }}>
              Meus torneios recentes
            </h2>
            {myRecent.length === 0 ? (
              <EmptyState message="Você ainda não participou de nenhum torneio." />
            ) : (
              <div className="space-y-2">
                {myRecent.map(t => (
                  <RecentTournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {abaAtiva === 'Histórico' && <HistoricoTab historico={historico} />}

      {abaAtiva === 'Gráficos' && <GraficosTab historico={historico} stats={stats} />}

      {/* Modal */}
      <BladerTournamentModal
        tournament={selectedTournament}
        open={!!selectedTournament}
        onOpenChange={(open) => { if (!open) setSelectedTournament(null); }}
        onInscrito={() => { refetch(); refetchInscricoes(); }}
      />

      {confirmandoDesistencia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#0d1120', border: '1px solid rgba(239,68,68,.2)', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 8 }}>Desistir da inscrição?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>{confirmandoDesistencia.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginBottom: 24 }}>Você poderá se inscrever novamente se ainda houver vagas.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmandoDesistencia(null)} style={{ flex: 1, padding: 11, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleDesistir(confirmandoDesistencia.id)} style={{ flex: 1, padding: 11, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Confirmar desistência</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoricoTab({ historico }: { historico: any[] }) {
  if (!historico || historico.length === 0) {
    return <EmptyState message="Você ainda não tem histórico de torneios." />;
  }
  return (
    <div>
      {historico.map((insc) => {
        const torneio = insc.tournaments;
        const cor = corPosicao(insc.posicao_final);
        const dataStr = torneio?.horario_inicio
          ? new Date(torneio.horario_inicio).toLocaleDateString('pt-BR')
          : '—';
        const posLabel =
          insc.posicao_final === 1 ? '🥇' :
          insc.posicao_final === 2 ? '🥈' :
          insc.posicao_final === 3 ? '🥉' :
          insc.posicao_final ? `${insc.posicao_final}º` : '—';
        return (
          <div key={insc.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: '#08091a',
            border: `1px solid ${cor}30`,
            borderLeft: `4px solid ${cor}`,
            borderRadius: 12, marginBottom: 8,
            transition: 'all .15s',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: torneio?.imagem_url
                ? `url(${torneio.imagem_url}) center/cover`
                : 'linear-gradient(135deg,#1e3a8a,#2563EB)',
              border: '1px solid rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!torneio?.imagem_url && <Trophy size={20} color="#fff" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {torneio?.name || 'Torneio'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                {dataStr}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>V/D</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                  {insc.vitorias || 0}
                  <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>/</span>
                  <span style={{ color: '#EF4444' }}>{insc.derrotas || 0}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>XP</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#A78BFA' }}>+{insc.xp_ganho || 0}</div>
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: `${cor}15`, border: `1px solid ${cor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 18,
              color: cor,
            }}>
              {posLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GraficosTab({ historico, stats }: { historico: any[]; stats: any }) {
  if (!historico || historico.length === 0) {
    return <EmptyState message="Sem dados suficientes para gerar gráficos. Participe de torneios!" />;
  }

  // ordem cronológica (do mais antigo ao mais recente)
  const cron = [...historico].reverse();

  const dadosEvolucao = cron.map((h, i) => {
    const acumVit = cron.slice(0, i + 1).reduce((acc, x) => acc + (x.vitorias || 0), 0);
    const acumXp = cron.slice(0, i + 1).reduce((acc, x) => acc + (x.xp_ganho || 0), 0);
    return {
      torneio: (h.tournaments?.name || `T${i + 1}`).substring(0, 12),
      vitorias: acumVit,
      xp: acumXp,
    };
  });

  const dadosStreak = cron.map((h, i) => ({
    torneio: `T${i + 1}`,
    streak: h.streak_max || 0,
    vitorias: h.vitorias || 0,
  }));

  // Radar (normalizado em escala 0-100, valores ilustrativos contra média 50)
  const winrateNorm = Math.min(100, stats?.winrate ?? 0);
  const streakNorm = Math.min(100, (stats?.streak_max ?? 0) * 10);
  const torneiosNorm = Math.min(100, (stats?.torneios_total ?? 0) * 5);
  const xpNorm = Math.min(100, Math.round(((stats?.xp_total ?? 0) / 3000) * 100));
  const rankingNorm = stats?.melhor_posicao
    ? Math.max(0, 100 - (stats.melhor_posicao - 1) * 10)
    : 0;

  const dadosRadar = [
    { stat: 'Winrate',  eu: winrateNorm,  media: 50 },
    { stat: 'Streak',   eu: streakNorm,   media: 40 },
    { stat: 'Torneios', eu: torneiosNorm, media: 45 },
    { stat: 'XP',       eu: xpNorm,       media: 50 },
    { stat: 'Ranking',  eu: rankingNorm,  media: 50 },
  ];

  return (
    <div className="space-y-5">
      <ChartCard title="Evolução de Vitórias e XP">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dadosEvolucao}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="torneio" stroke="rgba(255,255,255,.3)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,.3)" fontSize={10} />
            <Tooltip
              contentStyle={{ background: '#0d1120', border: '1px solid rgba(0,220,255,.2)', borderRadius: 8 }}
              labelStyle={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }} />
            <Line type="monotone" dataKey="vitorias" stroke="#00DCFF" strokeWidth={2} dot={{ fill: '#00DCFF', r: 3 }} />
            <Line type="monotone" dataKey="xp" stroke="#A78BFA" strokeWidth={2} dot={{ fill: '#A78BFA', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Streak e Vitórias por Torneio">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dadosStreak}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="torneio" stroke="rgba(255,255,255,.3)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,.3)" fontSize={10} />
            <Tooltip contentStyle={{ background: '#0d1120', border: '1px solid rgba(255,152,0,.2)', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }} />
            <Bar dataKey="streak" fill="#F97316" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar dataKey="vitorias" fill="#00DCFF" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Comparativo (vs média)">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={dadosRadar}>
            <PolarGrid stroke="rgba(255,255,255,.08)" />
            <PolarAngleAxis dataKey="stat" stroke="rgba(255,255,255,.4)" fontSize={11} />
            <Radar name="Você" dataKey="eu" stroke="#00DCFF" fill="#00DCFF" fillOpacity={0.18} />
            <Radar name="Média" dataKey="media" stroke="#FF00B4" fill="#FF00B4" fillOpacity={0.1} strokeDasharray="4 4" />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#08091a', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}


function TournamentRowCard({ tournament, onSignup, onWithdraw, inscrito, isHoje: hoje, isAmanha: amanha }: { tournament: { id: string; name: string; date: string; player_ids: string[]; max_players: number | null; horario_inicio: string | null }; onSignup: () => void; onWithdraw: () => void; inscrito: boolean; isHoje: boolean; isAmanha: boolean }) {
  const isFull = tournament.max_players != null && tournament.player_ids.length >= tournament.max_players;
  return (
    <div className="rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-[rgba(255,255,255,.03)] transition-colors" style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)' }} onClick={onSignup}>
      <div className="shrink-0 rounded-lg flex items-center justify-center" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)' }}>
        <Trophy size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-heading font-bold text-foreground truncate" style={{ fontSize: 14 }}>{tournament.name}</p>
          {hoje && (
            <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#F87171', letterSpacing: 1, flexShrink: 0 }}>🔴 HOJE</span>
          )}
          {amanha && !hoje && (
            <span style={{ padding: '2px 8px', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#FCD34D', letterSpacing: 1, flexShrink: 0 }}>⏰ AMANHÃ</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs font-body" style={{ color: '#94A3B8' }}>
          <Calendar size={11} />
          <span>{new Date(tournament.horario_inicio || tournament.date).toLocaleDateString('pt-BR')}</span>
          <span>•</span>
          <span>{tournament.player_ids.length}{tournament.max_players ? `/${tournament.max_players}` : ''} inscritos</span>
        </div>
      </div>
      {inscrito ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-lg px-3 py-1.5 font-body font-medium text-xs" style={{ background: 'rgba(16,185,129,.15)', color: '#10B981', border: '1px solid rgba(16,185,129,.3)' }}>✓ Inscrito</span>
          <button onClick={(e) => { e.stopPropagation(); onWithdraw(); }} className="rounded-lg px-3 py-1.5 font-body font-semibold text-xs transition-all" style={{ background: 'transparent', border: '1px solid rgba(239,68,68,.3)', color: '#F87171' }}>Desistir</button>
        </div>
      ) : isFull ? (
        <span className="text-xs font-body shrink-0" style={{ color: '#EF4444' }}>Esgotado</span>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onSignup(); }} className="shrink-0 rounded-lg px-3 py-1.5 font-body font-medium text-xs transition-all" style={{ background: '#F59E0B', color: '#0a0d18' }}>
          Inscrever-se
        </button>
      )}
    </div>
  );
}

function RecentTournamentCard({ tournament }: { tournament: { name: string; date: string } }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-foreground truncate" style={{ fontSize: 14 }}>{tournament.name}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs font-body" style={{ color: '#9CA3AF' }}>
          <span>{new Date(tournament.date).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}>
      <p className="text-sm text-muted-foreground font-body">{message}</p>
    </div>
  );
}
