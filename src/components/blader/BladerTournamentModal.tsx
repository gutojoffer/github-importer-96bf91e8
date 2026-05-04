import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Trophy, ChevronDown, X, Search } from 'lucide-react';
import { fetchUserDecks, type DeckResumo } from '@/lib/decks';

interface TournamentData {
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
  arena_count?: number | null;
}

interface LigaInfo {
  nome_liga: string | null;
  cidade: string | null;
  estado?: string | null;
  logo_url: string | null;
}

interface InscritoRow {
  blader_id: string | null;
  blader_temp_id: string | null;
  inscrito_em: string;
  status: string;
  deck_id?: string | null;
  deck_snapshot?: any;
  profiles: {
    nome_blader: string | null;
    avatar_blader_url: string | null;
    cidade_blader: string | null;
    beyblade_favorita: string | null;
    nivel: string | null;
  } | null;
  bladers_temp: {
    nome: string | null;
    apelido: string | null;
    avatar_url: string | null;
    cidade: string | null;
    beyblade_favorita: string | null;
    vinculado_a: string | null;
  } | null;
}

interface Props {
  tournament: TournamentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInscrito?: () => void;
  mode?: 'blader' | 'organizer';
  onManage?: (id: string) => void;
}

function formatarDataCompleta(data?: string | null) {
  if (!data) return '';
  return new Date(data).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatarDataCurta(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function canWithdraw(status?: string | null) {
  return status === 'upcoming' || status === 'aberto' || status === 'agendado';
}

function initials(name?: string | null) {
  return (name || 'B').charAt(0).toUpperCase();
}

export default function BladerTournamentModal({ tournament, open, onOpenChange, onInscrito, mode = 'blader', onManage }: Props) {
  const { user } = useAuth();
  const [inscrito, setInscrito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [liga, setLiga] = useState<LigaInfo | null>(null);
  const [inscritosCount, setInscritosCount] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState<'Informações' | 'Inscritos'>('Informações');
  const [inscritos, setInscritos] = useState<InscritoRow[]>([]);
  const [confirmandoDesistencia, setConfirmandoDesistencia] = useState(false);
  const [decks, setDecks] = useState<DeckResumo[]>([]);
  const [deckSelecionadoUuid, setDeckSelecionadoUuid] = useState<string | null>(null);

  // Organizer enrollment management state
  // null = lista de inscritos visível; 'buscar' ou 'rapido' = sub-painel de inscrição aberto
  const [modoInscricao, setModoInscricao] = useState<'buscar' | 'rapido' | null>(null);
  const [busca, setBusca] = useState('');
  const [bladersDisponiveis, setBladersDisponiveis] = useState<Array<{ id: string; nome_blader: string | null; avatar_blader_url: string | null; cidade_blader: string | null; nivel: string | null }>>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  // Quick add fields
  const [nomeRapido, setNomeRapido] = useState('');
  const [apelidoRapido, setApelidoRapido] = useState('');
  const [emailRapido, setEmailRapido] = useState('');
  const [beybladeRapido, setBeybladeRapido] = useState('');
  const [savingQuick, setSavingQuick] = useState(false);

  async function refreshDetails() {
    if (!open || !tournament) return;
    setChecking(true);

    // Run all queries in parallel
    const [meInscritoRes, inscritosRes, ligaRes] = await Promise.all([
      user
        ? supabase
            .from('inscricoes')
            .select('id')
            .eq('torneio_id', tournament.id)
            .eq('blader_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      (supabase as any)
        .from('inscricoes')
        .select(`
          blader_id,
          blader_temp_id,
          inscrito_em,
          status,
          deck_id,
          deck_snapshot,
          profiles!inscricoes_blader_id_fkey (
            nome_blader, avatar_blader_url, cidade_blader,
            beyblade_favorita, nivel
          ),
          bladers_temp!inscricoes_blader_temp_id_fkey (
            nome, apelido, avatar_url, cidade, beyblade_favorita, vinculado_a
          )
        `, { count: 'exact' })
        .eq('torneio_id', tournament.id)
        .eq('status', 'confirmado')
        .order('inscrito_em', { ascending: true }),
      tournament.liga_id
        ? supabase
            .from('profiles')
            .select('nome_liga, cidade, estado, logo_url')
            .eq('id', tournament.liga_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    setInscrito(!!(meInscritoRes as any).data);
    const rows = (inscritosRes as any).data ?? [];
    const count = (inscritosRes as any).count;
    setInscritos(rows as InscritoRow[]);
    setInscritosCount(count ?? tournament.player_ids.length);
    setLiga(((ligaRes as any).data ?? null) as LigaInfo | null);
    setChecking(false);
  }

  useEffect(() => {
    if (!open || !tournament) return;
    setAbaAtiva('Informações');
    setConfirmandoDesistencia(false);
    setModoInscricao(null);
    setBusca('');
    setNomeRapido(''); setApelidoRapido(''); setEmailRapido(''); setBeybladeRapido('');
    setDeckSelecionadoUuid(null);
    refreshDetails();
    if (mode === 'blader' && user?.id) {
      fetchUserDecks(user.id).then(setDecks).catch(() => setDecks([]));
    }
  }, [open, tournament?.id, user?.id, mode]);

  // Load eligible bladers for organizer search — lazy + cached per modal session
  useEffect(() => {
    if (mode !== 'organizer' || modoInscricao !== 'buscar' || !open) return;
    if (bladersDisponiveis.length > 0) return; // already loaded
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome_blader, avatar_blader_url, cidade_blader, nivel')
        .eq('tem_perfil_blader', true)
        .not('nome_blader', 'is', null)
        .order('nome_blader', { ascending: true })
        .limit(200);
      setBladersDisponiveis((data ?? []) as any);
    })();
  }, [mode, modoInscricao, open, bladersDisponiveis.length]);

  const inscritosIdsSet = useMemo(() => {
    const s = new Set<string>();
    for (const r of inscritos) if (r.blader_id) s.add(r.blader_id);
    return s;
  }, [inscritos]);

  const bladersFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return bladersDisponiveis.filter(b => {
      if (inscritosIdsSet.has(b.id)) return false;
      if (!term) return true;
      return (b.nome_blader || '').toLowerCase().includes(term) || (b.cidade_blader || '').toLowerCase().includes(term);
    });
  }, [bladersDisponiveis, busca, inscritosIdsSet]);

  async function handleEnrollExisting(bladerId: string) {
    if (!tournament) return;
    setEnrolling(bladerId);
    const { error } = await supabase
      .from('inscricoes')
      .insert({ torneio_id: tournament.id, blader_id: bladerId, status: 'confirmado' });
    setEnrolling(null);
    if (error) { toast.error('Erro ao inscrever blader'); return; }
    toast.success('Blader inscrito!');
    setModoInscricao(null);
    await refreshDetails();
    onInscrito?.();
  }

  async function handleCadastroRapido() {
    if (!tournament || !user) return;
    if (!nomeRapido.trim()) { toast.error('Nome obrigatório'); return; }
    setSavingQuick(true);
    const { data: bt, error: e1 } = await supabase
      .from('bladers_temp')
      .insert({
        organizador_id: user.id,
        nome: nomeRapido.trim(),
        apelido: apelidoRapido.trim().replace(/^@/, '') || null,
        email: emailRapido.trim().toLowerCase() || null,
        beyblade_favorita: beybladeRapido.trim() || null,
      })
      .select()
      .single();
    if (e1 || !bt) { setSavingQuick(false); toast.error('Erro ao cadastrar'); return; }

    const { error: e2 } = await supabase
      .from('inscricoes')
      .insert({ torneio_id: tournament.id, blader_temp_id: bt.id, blader_id: null, status: 'confirmado' });
    setSavingQuick(false);
    if (e2) { toast.error('Cadastrado, mas falhou a inscrição'); return; }

    toast.success(`${nomeRapido.trim()} cadastrado e inscrito!`);
    setNomeRapido(''); setApelidoRapido(''); setEmailRapido(''); setBeybladeRapido('');
    setModoInscricao(null);
    await refreshDetails();
    onInscrito?.();
  }

  const maxPlayers = tournament?.max_players ?? 32;
  const vagasEsgotadas = inscritosCount >= maxPlayers;
  const dataFormatada = formatarDataCompleta(tournament?.horario_inicio || tournament?.date);
  const permiteDesistir = !!tournament && canWithdraw(tournament.status);
  const progresso = Math.min((inscritosCount / maxPlayers) * 100, 100);

  async function handleInscrever() {
    if (!tournament || !user) return;
    setLoading(true);

    const deckEscolhido = deckSelecionadoUuid
      ? decks.find(d => d.deck_uuid === deckSelecionadoUuid) || null
      : null;
    const deckSnapshot = deckEscolhido ? deckEscolhido.beys : null;

    const { error } = await supabase
      .from('inscricoes')
      .insert({
        torneio_id: tournament.id,
        blader_id: user.id,
        status: 'confirmado',
        deck_id: deckSelecionadoUuid,
        deck_snapshot: deckSnapshot as any,
      } as any);

    if (error) {
      toast.error('Erro ao realizar inscrição');
      setLoading(false);
      return;
    }

    toast.success('Inscrição confirmada!');
    setInscrito(true);
    setLoading(false);
    await refreshDetails();
    onInscrito?.();

    if (tournament.liga_id) {
      const { data: profile } = await supabase.from('profiles').select('nome_blader').eq('id', user.id).maybeSingle();
      const bladerNome = (profile as any)?.nome_blader || 'Um blader';
      await supabase.from('notificacoes').insert({
        user_id: tournament.liga_id,
        tipo: 'nova_inscricao',
        mensagem: `${bladerNome} se inscreveu no torneio "${tournament.name}"`,
      });
    }
  }

  async function handleDesistir() {
    if (!tournament || !user) return;
    const { error } = await supabase
      .from('inscricoes')
      .delete()
      .eq('torneio_id', tournament.id)
      .eq('blader_id', user.id);

    if (error) {
      toast.error('Erro ao cancelar inscrição');
      return;
    }

    setConfirmandoDesistencia(false);
    setInscrito(false);
    toast.success('Inscrição cancelada com sucesso');
    await refreshDetails();
    onInscrito?.();
  }

  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden border-0 max-w-[560px] w-full max-h-[85vh] flex flex-col [&>button:last-child]:hidden"
        style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20 }}
      >
        {tournament.imagem_url ? (
          <div style={{ height: 140, backgroundImage: `url(${tournament.imagem_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #0d1120 100%)' }} />
            <button onClick={() => onOpenChange(false)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer' }}><X size={16} className="mx-auto" /></button>
          </div>
        ) : (
          <div style={{ height: 80, background: 'linear-gradient(135deg, #0a1428, #0d1f3c)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.04) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
            <button onClick={() => onOpenChange(false)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer' }}><X size={16} className="mx-auto" /></button>
          </div>
        )}

        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {liga?.logo_url ? <img src={liga.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#1e3a8a,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={16} color="#fff" /></div>}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: 1 }}>{liga?.nome_liga || 'Liga BLADEX'}</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', lineHeight: 1.1 }}>{tournament.name}</div>
            </div>
            <div style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 999, background: tournament.status === 'active' ? 'rgba(239,68,68,.12)' : tournament.status === 'completed' ? 'rgba(148,163,184,.12)' : 'rgba(16,185,129,.12)', color: tournament.status === 'active' ? '#F87171' : tournament.status === 'completed' ? '#94A3B8' : '#34D399', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {tournament.status === 'active' ? '🔴 Ao vivo' : tournament.status === 'completed' ? '⚫ Encerrado' : '🟢 Aberto'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {dataFormatada && <InfoLine icon={<Calendar size={13} />} text={dataFormatada} />}
            {(tournament.local_nome || tournament.local_cidade) && <InfoLine icon={<MapPin size={13} />} text={`${tournament.local_nome || ''}${tournament.local_cidade ? ` · ${tournament.local_cidade}` : ''}${tournament.local_estado ? ` - ${tournament.local_estado}` : ''}`} />}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Users size={13} />
              <span>{inscritosCount} / {maxPlayers} inscritos</span>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #2563EB, #60A5FA)', width: `${progresso}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          {(['Informações', 'Inscritos'] as const).map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} style={{ flex: 1, padding: 12, background: 'transparent', border: 'none', borderBottom: abaAtiva === aba ? '2px solid #2563EB' : '2px solid transparent', color: abaAtiva === aba ? '#60A5FA' : 'rgba(255,255,255,.35)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }}>
              {aba}{aba === 'Inscritos' && ` (${inscritosCount})`}
            </button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {abaAtiva === 'Informações' ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tournament.descricao ? <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>{tournament.descricao}</p> : <EmptyInfo text="Nenhuma descrição cadastrada." />}
              {tournament.premio && <InfoBlock title="Prêmio" text={`🏆 ${tournament.premio}`} />}
              <InfoBlock title="Arenas" text={`${tournament.arena_count || 1} arena${(tournament.arena_count || 1) !== 1 ? 's' : ''} simultânea${(tournament.arena_count || 1) !== 1 ? 's' : ''}`} />
              {tournament.regras && (
                <Collapsible>
                  <CollapsibleTrigger style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60A5FA', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                    REGRAS ESPECIAIS <ChevronDown size={12} />
                  </CollapsibleTrigger>
                  <CollapsibleContent><p style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,.55)', whiteSpace: 'pre-wrap' }}>{tournament.regras}</p></CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ) : (
            <>
              {mode === 'organizer' && modoInscricao === null && (
                <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <button onClick={() => setModoInscricao('buscar')} style={{
                    flex: 1, padding: '9px',
                    background: 'rgba(37,99,235,.15)',
                    border: '1px solid rgba(37,99,235,.3)',
                    borderRadius: 9, color: '#60A5FA',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>+ Inscrever cadastrado</button>
                  <button onClick={() => setModoInscricao('rapido')} style={{
                    flex: 1, padding: '9px',
                    background: 'rgba(245,158,11,.12)',
                    border: '1px solid rgba(245,158,11,.3)',
                    borderRadius: 9, color: '#FCD34D',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>+ Cadastro rápido</button>
                </div>
              )}

              {mode === 'organizer' && modoInscricao !== null && (
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <button onClick={() => setModoInscricao(null)} style={{
                    padding: '6px 10px', background: 'rgba(255,255,255,.04)',
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
                    color: '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>← Voltar para inscritos</button>
                </div>
              )}

              {mode === 'organizer' && modoInscricao === 'buscar' ? (
                <div style={{ padding: '12px 20px' }}>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search size={14} style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)' }} />
                    <input placeholder="Buscar blader pelo nome..." value={busca} onChange={e => setBusca(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 34px', background: '#111827', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#E2E8F0', fontSize: 13, outline: 'none' }} />
                  </div>
                  {bladersFiltrados.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 12 }}>Nenhum blader disponível.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {bladersFiltrados.slice(0, 50).map(b => (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                          {b.avatar_blader_url ? (
                            <img src={b.avatar_blader_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a8a,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{(b.nome_blader || 'B').charAt(0)}</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nome_blader}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{b.cidade_blader || ''}{b.nivel ? ` · ${b.nivel}` : ''}</div>
                          </div>
                          <button onClick={() => handleEnrollExisting(b.id)} disabled={enrolling === b.id}
                            style={{ padding: '7px 12px', background: '#2563EB', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, cursor: enrolling === b.id ? 'wait' : 'pointer', flexShrink: 0 }}>
                            {enrolling === b.id ? '...' : 'Inscrever'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : mode === 'organizer' && modoInscricao === 'rapido' ? (
                <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { v: nomeRapido, set: setNomeRapido, ph: 'Nome completo *' },
                    { v: apelidoRapido, set: setApelidoRapido, ph: 'Apelido / Handle' },
                    { v: emailRapido, set: setEmailRapido, ph: 'Email (para vincular depois)', type: 'email' },
                    { v: beybladeRapido, set: setBeybladeRapido, ph: 'Beyblade favorita' },
                  ].map((f, i) => (
                    <input key={i} placeholder={f.ph} type={(f as any).type || 'text'} value={f.v} onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: '#111827', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#E2E8F0', fontSize: 13, outline: 'none' }} />
                  ))}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', lineHeight: 1.4 }}>
                    💡 Se informar o email, quando essa pessoa criar conta no BLADEX o sistema oferecerá vinculação automática.
                  </div>
                  <button onClick={handleCadastroRapido} disabled={savingQuick}
                    style={{ marginTop: 4, padding: '11px 18px', background: '#2563EB', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: savingQuick ? 'wait' : 'pointer' }}>
                    {savingQuick ? 'Salvando...' : 'Cadastrar e inscrever'}
                  </button>
                </div>
              ) : checking ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.35)' }}>Carregando inscritos...</div>
              ) : inscritos.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8, opacity: .3 }}>👥</div>Nenhum blader inscrito ainda</div>
              ) : (
                inscritos.map((inscricao, index) => <InscritoItem key={inscricao.blader_id || inscricao.blader_temp_id || index} inscricao={inscricao} index={index} />)
              )}
            </>
          )}
        </div>

        {/* Seletor de deck (apenas para blader, não inscrito ainda, com decks salvos) */}
        {mode === 'blader' && !inscrito && !checking && !vagasEsgotadas && decks.length > 0 && (
          <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase', color: 'rgba(255,255,255,.35)',
              marginBottom: 8,
            }}>
              Vincular deck (opcional)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
              {decks.map(deck => {
                const ativo = deckSelecionadoUuid === deck.deck_uuid;
                return (
                  <div
                    key={deck.deck_uuid}
                    onClick={() => setDeckSelecionadoUuid(ativo ? null : deck.deck_uuid)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                      background: ativo ? 'rgba(0,220,255,.06)' : 'rgba(255,255,255,.02)',
                      border: `1px solid ${ativo ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.07)'}`,
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${ativo ? '#00DCFF' : 'rgba(255,255,255,.2)'}`,
                      background: ativo ? 'rgba(0,220,255,.15)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {ativo && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00DCFF' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>
                        {deck.nome}
                      </div>
                      <div style={{
                        fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {deck.beys.map(b => b.blade?.nome || b.main_blade?.nome).filter(Boolean).join(' · ') || 'Sem beys'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          {mode === 'organizer' ? (
            <button onClick={() => onManage?.(tournament.id)} style={{ width: '100%', padding: 12, background: 'rgba(37,99,235,.14)', border: '1px solid rgba(37,99,235,.3)', borderRadius: 12, color: '#60A5FA', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}>Gerenciar torneio →</button>
          ) : checking ? (
            <div style={{ height: 44, borderRadius: 12, background: 'rgba(255,255,255,.04)' }} />
          ) : inscrito && permiteDesistir ? (
            <button onClick={() => setConfirmandoDesistencia(true)} style={{ width: '100%', padding: 12, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, color: '#F87171', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}>Desistir da inscrição</button>
          ) : inscrito ? (
            <button disabled style={{ width: '100%', padding: 12, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 12, color: '#34D399', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>✓ Inscrito</button>
          ) : vagasEsgotadas ? (
            <button disabled style={{ width: '100%', padding: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, color: '#F87171', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1 }}>Vagas esgotadas</button>
          ) : (
            <button onClick={handleInscrever} disabled={loading} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, rgba(0,220,255,.2), rgba(0,220,255,.1))', border: '1px solid rgba(0,220,255,.3)', borderRadius: 12, color: '#00DCFF', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 1, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Inscrevendo...' : '⚡ Inscrever-se'}</button>
          )}
        </div>

        {confirmandoDesistencia && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#0d1120', border: '1px solid rgba(239,68,68,.2)', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 8 }}>Desistir da inscrição?</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>{tournament.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginBottom: 24 }}>Você poderá se inscrever novamente se ainda houver vagas.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmandoDesistencia(false)} style={{ flex: 1, padding: 11, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleDesistir} style={{ flex: 1, padding: 11, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Confirmar desistência</button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', display: 'flex', gap: 6, alignItems: 'center' }}>{icon}<span>{text}</span></div>;
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{title}</div><div style={{ fontSize: 13, color: '#E2E8F0' }}>{text}</div></div>;
}

function EmptyInfo({ text }: { text: string }) {
  return <div style={{ padding: 16, border: '1px dashed rgba(255,255,255,.08)', borderRadius: 12, color: 'rgba(255,255,255,.28)', fontSize: 13, textAlign: 'center' }}>{text}</div>;
}

function InscritoItem({ inscricao, index }: { inscricao: InscritoRow; index: number }) {
  const profile = inscricao.profiles;
  const temp = inscricao.bladers_temp;
  const isTemp = !!inscricao.blader_temp_id;
  const vinculado = !!temp?.vinculado_a;
  const nome = profile?.nome_blader || temp?.nome || 'Blader';
  const avatar = profile?.avatar_blader_url || temp?.avatar_url || null;
  const cidade = profile?.cidade_blader || temp?.cidade;
  const beyblade = profile?.beyblade_favorita || temp?.beyblade_favorita;
  const nivel = profile?.nivel;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.2)', textAlign: 'center', flexShrink: 0 }}>{index + 1}</div>
      {avatar ? <img src={avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(37,99,235,.3)', flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0, border: '1.5px solid rgba(37,99,235,.3)' }}>{initials(nome)}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}{temp?.apelido && <span style={{ color: 'rgba(255,255,255,.35)', fontWeight: 400 }}> · @{temp.apelido}</span>}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cidade && `📍 ${cidade}`}{beyblade && ` · ⚡ ${beyblade}`}</div>
      </div>
      {isTemp && !vinculado && <div style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', color: '#FCD34D', fontSize: 9, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>SEM CONTA</div>}
      {isTemp && vinculado && <div style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#34D399', fontSize: 9, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>VINCULADO ✓</div>}
      {!isTemp && nivel && <div style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(37,99,235,.12)', color: '#60A5FA', fontSize: 10, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>{nivel}</div>}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', flexShrink: 0 }}>{formatarDataCurta(inscricao.inscrito_em)}</div>
    </div>
  );
}
