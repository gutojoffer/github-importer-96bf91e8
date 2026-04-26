import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Calendar, MapPin, Users, Filter } from 'lucide-react';
import BladerTournamentModal from '@/components/blader/BladerTournamentModal';
import { toast } from 'sonner';

interface TournamentRow {
  id: string;
  name: string;
  date: string;
  status: string;
  liga_id: string | null;
  player_ids: string[];
  max_players: number | null;
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

interface LigaRow {
  id: string;
  nome_liga: string | null;
  cidade: string | null;
  estado: string | null;
  logo_url: string | null;
}

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const UF_NAMES: Record<string, string> = { AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins' };


type FilterMode = 'todos' | 'inscritos' | 'disponiveis';

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

export default function BladerTournaments() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterMode>('todos');
  const [selectedTournament, setSelectedTournament] = useState<TournamentRow | null>(null);
  const [confirmandoDesistencia, setConfirmandoDesistencia] = useState<TournamentRow | null>(null);

  const { data: tournaments = [], isLoading, refetch } = useQuery({
    queryKey: ['blader-tournaments-open'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, date, status, liga_id, player_ids, max_players, local_nome, local_endereco, local_cidade, local_estado, horario_inicio, horario_fim, descricao, imagem_url, premio, regras')
        .eq('status', 'upcoming')
        .order('date', { ascending: true });
      return (data ?? []) as TournamentRow[];
    },
  });

  const ligaIds = Array.from(new Set(tournaments.map(t => t.liga_id).filter(Boolean) as string[]));
  const { data: ligas = [] } = useQuery({
    queryKey: ['blader-ligas', ligaIds],
    queryFn: async () => {
      if (ligaIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, nome_liga, cidade, logo_url')
        .in('id', ligaIds);
      return (data ?? []) as LigaRow[];
    },
    enabled: ligaIds.length > 0,
  });

  const ligaById = new Map(ligas.map(l => [l.id, l]));

  // Check inscricoes for current user
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

  const enriched = tournaments.map(t => ({
    ...t,
    inscrito: myInscricoesSet.has(t.id),
    cheio: t.max_players != null && t.player_ids.length >= t.max_players,
    liga: t.liga_id ? ligaById.get(t.liga_id) : undefined,
  }));

  const filtered = enriched.filter(t => {
    if (filter === 'inscritos') return t.inscrito;
    if (filter === 'disponiveis') return !t.inscrito && !t.cheio;
    return true;
  });

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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-heading font-bold text-foreground flex items-center gap-2" style={{ fontSize: 22 }}>
          <Trophy size={22} style={{ color: '#FBBF24' }} /> Torneios
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Inscreva-se nos torneios abertos das ligas.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={14} className="shrink-0" style={{ color: '#64748B' }} />
        {(['todos', 'disponiveis', 'inscritos'] as FilterMode[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 rounded-full font-body font-medium text-xs transition-all"
            style={{
              padding: '6px 14px',
              background: filter === f ? '#F59E0B' : 'rgba(255,255,255,.04)',
              color: filter === f ? '#0a0d18' : '#9CA3AF',
              border: filter === f ? 'none' : '1px solid rgba(255,255,255,.08)',
            }}
          >
            {f === 'todos' ? 'Todos' : f === 'disponiveis' ? 'Disponíveis' : 'Meus'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}>
          <Trophy size={32} className="mx-auto mb-2" style={{ color: '#374151' }} />
          <p className="text-sm text-muted-foreground font-body">
            {filter === 'inscritos' ? 'Você ainda não está inscrito em nenhum torneio.' : 'Nenhum torneio disponível.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div
              key={t.id}
              className="rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-[rgba(255,255,255,.03)] transition-colors"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,.07)' }}
              onClick={() => setSelectedTournament(t)}
            >
              {/* Logo da liga */}
              <div className="shrink-0">
                {t.liga?.logo_url ? (
                  <img src={t.liga.logo_url} alt="" className="rounded-lg object-cover" style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,.08)' }} />
                ) : (
                  <div className="rounded-lg flex items-center justify-center" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)' }}>
                    <Trophy size={20} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading font-bold text-foreground truncate" style={{ fontSize: 14 }}>
                    {t.name}
                  </p>
                  {isHoje(dateRef(t)) && (
                    <span style={{
                      padding: '2px 8px', background: 'rgba(239,68,68,.15)',
                      border: '1px solid rgba(239,68,68,.4)', borderRadius: 20,
                      fontSize: 10, fontWeight: 700, color: '#F87171',
                      letterSpacing: 1, flexShrink: 0,
                    }}>🔴 HOJE</span>
                  )}
                  {isAmanha(dateRef(t)) && !isHoje(dateRef(t)) && (
                    <span style={{
                      padding: '2px 8px', background: 'rgba(245,158,11,.12)',
                      border: '1px solid rgba(245,158,11,.3)', borderRadius: 20,
                      fontSize: 10, fontWeight: 700, color: '#FCD34D',
                      letterSpacing: 1, flexShrink: 0,
                    }}>⏰ AMANHÃ</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground font-body">
                  {t.liga?.nome_liga && <span className="truncate">{t.liga.nome_liga}</span>}
                  {(t.local_cidade || t.liga?.cidade) && <><span>•</span><span className="flex items-center gap-1"><MapPin size={10} />{t.local_cidade || t.liga?.cidade}</span></>}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-body" style={{ color: '#94A3B8' }}>
                  <span className="flex items-center gap-1"><Calendar size={10} />{new Date(t.horario_inicio || t.date).toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Users size={10} />{t.player_ids.length}{t.max_players ? `/${t.max_players}` : ''}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="shrink-0" onClick={e => e.stopPropagation()}>
                {t.inscrito ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-body font-medium text-xs" style={{ background: 'rgba(16,185,129,.15)', color: '#10B981', border: '1px solid rgba(16,185,129,.3)' }}>
                      ✓ Inscrito
                    </span>
                    {t.status === 'upcoming' && (
                      <button onClick={() => setConfirmandoDesistencia(t)} className="rounded-lg px-3 py-1.5 font-body font-semibold text-xs transition-all" style={{ background: 'transparent', border: '1px solid rgba(239,68,68,.3)', color: '#F87171' }}>
                        Desistir
                      </button>
                    )}
                  </div>
                ) : t.cheio ? (
                  <span className="text-xs font-body" style={{ color: '#EF4444' }}>Esgotado</span>
                ) : (
                  <button
                    onClick={() => setSelectedTournament(t)}
                    className="rounded-lg px-3 py-1.5 font-body font-medium text-xs transition-all"
                    style={{ background: '#F59E0B', color: '#0a0d18' }}
                  >
                    Inscrever-se
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
