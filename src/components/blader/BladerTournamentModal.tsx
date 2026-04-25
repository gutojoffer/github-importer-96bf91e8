import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Trophy, ChevronDown, X } from 'lucide-react';

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

  async function refreshDetails() {
    if (!open || !tournament) return;
    setChecking(true);

    if (user) {
      const { data } = await supabase
        .from('inscricoes')
        .select('id')
        .eq('torneio_id', tournament.id)
        .eq('blader_id', user.id)
        .maybeSingle();
      setInscrito(!!data);
    }

    const { data: rows, count } = await (supabase as any)
      .from('inscricoes')
      .select(`
        blader_id,
        blader_temp_id,
        inscrito_em,
        status,
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
      .order('inscrito_em', { ascending: true });

    setInscritos((rows ?? []) as InscritoRow[]);
    setInscritosCount(count ?? tournament.player_ids.length);

    if (tournament.liga_id) {
      const { data: ligaData } = await supabase
        .from('profiles')
        .select('nome_liga, cidade, estado, logo_url')
        .eq('id', tournament.liga_id)
        .maybeSingle();
      setLiga(ligaData as LigaInfo | null);
    } else {
      setLiga(null);
    }
    setChecking(false);
  }

  useEffect(() => {
    if (!open || !tournament) return;
    setAbaAtiva('Informações');
    setConfirmandoDesistencia(false);
    refreshDetails();
  }, [open, tournament?.id, user?.id]);

  const maxPlayers = tournament?.max_players ?? 32;
  const vagasEsgotadas = inscritosCount >= maxPlayers;
  const dataFormatada = formatarDataCompleta(tournament?.horario_inicio || tournament?.date);
  const permiteDesistir = !!tournament && canWithdraw(tournament.status);
  const progresso = Math.min((inscritosCount / maxPlayers) * 100, 100);

  async function handleInscrever() {
    if (!tournament || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from('inscricoes')
      .insert({ torneio_id: tournament.id, blader_id: user.id, status: 'confirmado' });

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
          ) : checking ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.35)' }}>Carregando inscritos...</div>
          ) : inscritos.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8, opacity: .3 }}>👥</div>Nenhum blader inscrito ainda</div>
          ) : (
            inscritos.map((inscricao, index) => <InscritoItem key={inscricao.blader_id} inscricao={inscricao} index={index} />)
          )}
        </div>

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
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.2)', textAlign: 'center', flexShrink: 0 }}>{index + 1}</div>
      {profile?.avatar_blader_url ? <img src={profile.avatar_blader_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(37,99,235,.3)', flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0, border: '1.5px solid rgba(37,99,235,.3)' }}>{initials(profile?.nome_blader)}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.nome_blader || 'Blader'}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.cidade_blader && `📍 ${profile.cidade_blader}`}{profile?.beyblade_favorita && ` · ⚡ ${profile.beyblade_favorita}`}</div>
      </div>
      {profile?.nivel && <div style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(37,99,235,.12)', color: '#60A5FA', fontSize: 10, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>{profile.nivel}</div>}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', flexShrink: 0 }}>{formatarDataCurta(inscricao.inscrito_em)}</div>
    </div>
  );
}
