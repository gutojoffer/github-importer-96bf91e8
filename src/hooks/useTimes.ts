import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sendNotificacao } from '@/lib/notificacoes';

export interface TimeMembroEnriquecido {
  id: string;
  role: 'capitao' | 'vice' | 'membro';
  status: string;
  user_id: string;
  profile?: {
    id: string;
    nome_blader: string | null;
    avatar_blader_url: string | null;
    xp_total: number | null;
    vitorias_total: number | null;
    torneios_total: number | null;
  };
  elo?: { elo: string; pontos: number } | null;
  torre?: { andar: number; tier: string } | null;
}

export interface TimeCompleto {
  id: string;
  nome: string;
  emoji: string;
  cor: string;
  descricao: string | null;
  cidade: string | null;
  estado: string | null;
  capitao_id: string;
  max_membros: number;
  vitorias_total: number;
  derrotas_total: number;
  torneios_total: number;
  trofeus: number;
  xp_total: number;
  membros: TimeMembroEnriquecido[];
}

export interface ConviteTime {
  id: string;
  created_at: string;
  time: {
    id: string;
    nome: string;
    emoji: string;
    cor: string;
    cidade: string | null;
    estado: string | null;
  } | null;
  convidado_por_nome?: string | null;
}

async function enriquecerMembros(rows: any[]): Promise<TimeMembroEnriquecido[]> {
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.user_id);
  const [profiles, elos, torres] = await Promise.all([
    supabase.from('profiles').select('id, nome_blader, avatar_blader_url, xp_total, vitorias_total, torneios_total').in('id', ids),
    supabase.from('elo_bladers').select('user_id, elo, pontos').in('user_id', ids),
    supabase.from('torre_x_pontos').select('user_id, andar, tier').in('user_id', ids),
  ]);
  const pMap = new Map((profiles.data || []).map((p: any) => [p.id, p]));
  const eMap = new Map<string, any>();
  (elos.data || []).forEach((e: any) => { if (!eMap.has(e.user_id)) eMap.set(e.user_id, e); });
  const tMap = new Map<string, any>();
  (torres.data || []).forEach((t: any) => { if (!tMap.has(t.user_id)) tMap.set(t.user_id, t); });
  return rows.map(r => ({
    id: r.id,
    role: r.role,
    status: r.status,
    user_id: r.user_id,
    profile: pMap.get(r.user_id) as any,
    elo: eMap.get(r.user_id) || null,
    torre: tMap.get(r.user_id) || null,
  }));
}

export async function carregarTimePorId(timeId: string): Promise<TimeCompleto | null> {
  const { data: time } = await supabase.from('times').select('*').eq('id', timeId).maybeSingle();
  if (!time) return null;
  const { data: membros } = await supabase
    .from('time_membros')
    .select('id, user_id, role, status')
    .eq('time_id', timeId)
    .eq('status', 'ativo');
  const enriquecidos = await enriquecerMembros((membros || []) as any[]);
  return { ...(time as any), membros: enriquecidos };
}

/** Hook leve usado pela sidebar — apenas conta convites pendentes. */
export function useConvitesTimePendentes() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let cancelled = false;

    async function load() {
      const { count: c } = await supabase
        .from('time_convites')
        .select('*', { count: 'exact', head: true })
        .eq('convidado_id', user.id)
        .eq('status', 'pendente')
        .gt('expires_at', new Date().toISOString());
      if (!cancelled) setCount(c || 0);
    }
    load();

    const channel = supabase
      .channel(`time-convites-count-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_convites', filter: `convidado_id=eq.${user.id}` }, () => load())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  return count;
}

export function useTimes() {
  const { user } = useAuth();
  const [meuTime, setMeuTime] = useState<TimeCompleto | null>(null);
  const [convitesPendentes, setConvitesPendentes] = useState<ConviteTime[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarMeuTime = useCallback(async () => {
    if (!user) { setMeuTime(null); return; }
    const { data: vinculo } = await supabase
      .from('time_membros')
      .select('time_id')
      .eq('user_id', user.id)
      .eq('status', 'ativo')
      .maybeSingle();
    if (!vinculo) { setMeuTime(null); return; }
    const t = await carregarTimePorId((vinculo as any).time_id);
    setMeuTime(t);
  }, [user]);

  const carregarConvites = useCallback(async () => {
    if (!user) { setConvitesPendentes([]); return; }
    const { data } = await supabase
      .from('time_convites')
      .select('id, created_at, time_id, convidado_por')
      .eq('convidado_id', user.id)
      .eq('status', 'pendente')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    const rows = (data || []) as any[];
    if (rows.length === 0) { setConvitesPendentes([]); return; }

    const timeIds = [...new Set(rows.map(r => r.time_id))];
    const convidadorIds = [...new Set(rows.map(r => r.convidado_por).filter(Boolean))];
    const [times, profiles] = await Promise.all([
      supabase.from('times').select('id, nome, emoji, cor, cidade, estado').in('id', timeIds),
      convidadorIds.length
        ? supabase.from('profiles').select('id, nome_blader').in('id', convidadorIds)
        : Promise.resolve({ data: [] }),
    ]);
    const timeMap = new Map((times.data || []).map((t: any) => [t.id, t]));
    const profMap = new Map(((profiles as any).data || []).map((p: any) => [p.id, p.nome_blader]));

    setConvitesPendentes(rows.map(r => ({
      id: r.id,
      created_at: r.created_at,
      time: (timeMap.get(r.time_id) as any) || null,
      convidado_por_nome: r.convidado_por ? ((profMap.get(r.convidado_por) as string | null) ?? null) : null,
    })) as ConviteTime[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([carregarMeuTime(), carregarConvites()]).finally(() => setLoading(false));

    const channel = supabase
      .channel(`times-realtime-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_convites', filter: `convidado_id=eq.${user.id}` }, () => carregarConvites())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_membros', filter: `user_id=eq.${user.id}` }, () => carregarMeuTime())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, carregarMeuTime, carregarConvites]);

  async function criarTime(dados: { nome: string; emoji: string; cor: string; descricao?: string }) {
    if (!user) return null;
    const { data: perfil } = await supabase
      .from('profiles')
      .select('cidade_blader, estado_blader')
      .eq('id', user.id)
      .maybeSingle();

    const { data: time, error } = await supabase
      .from('times')
      .insert({
        nome: dados.nome,
        emoji: dados.emoji,
        cor: dados.cor,
        descricao: dados.descricao || null,
        capitao_id: user.id,
        cidade: (perfil as any)?.cidade_blader || null,
        estado: (perfil as any)?.estado_blader || null,
      })
      .select()
      .single();

    if (error) { toast.error('Erro ao criar time.'); return null; }

    const { error: errMembro } = await supabase.from('time_membros').insert({
      time_id: (time as any).id,
      user_id: user.id,
      role: 'capitao',
      status: 'ativo',
    });
    if (errMembro) { toast.error('Erro ao registrar capitão.'); }

    toast.success(`Time "${dados.nome}" criado!`);
    await carregarMeuTime();
    return time as any;
  }

  async function convidarMembro(timeId: string, convidadoId: string) {
    if (!user) return;
    const { error } = await supabase.from('time_convites').insert({
      time_id: timeId,
      convidado_id: convidadoId,
      convidado_por: user.id,
      status: 'pendente',
    });
    if (error) {
      if ((error as any).code === '23505') { toast.error('Convite já enviado.'); return; }
      toast.error('Erro ao enviar convite.');
      return;
    }
    const [{ data: meuPerfil }, { data: time }] = await Promise.all([
      supabase.from('profiles').select('nome_blader').eq('id', user.id).maybeSingle(),
      supabase.from('times').select('nome, emoji').eq('id', timeId).maybeSingle(),
    ]);
    await sendNotificacao(
      convidadoId,
      'convite_time',
      `${(time as any)?.emoji || '👥'} ${(meuPerfil as any)?.nome_blader || 'Um blader'} te convidou para o time "${(time as any)?.nome || ''}"!`,
      { time_id: timeId, time_nome: (time as any)?.nome },
    );
    toast.success('Convite enviado!');
  }

  async function aceitarConvite(conviteId: string, timeId: string) {
    if (!user) return;
    await supabase.from('time_convites').update({ status: 'aceito' }).eq('id', conviteId);
    const { error } = await supabase.from('time_membros').insert({
      time_id: timeId,
      user_id: user.id,
      role: 'membro',
      status: 'ativo',
    });
    if (error) { toast.error('Erro ao entrar no time.'); return; }

    const { data: convite } = await supabase
      .from('time_convites')
      .select('convidado_por')
      .eq('id', conviteId)
      .maybeSingle();
    const { data: meu } = await supabase.from('profiles').select('nome_blader').eq('id', user.id).maybeSingle();

    if ((convite as any)?.convidado_por) {
      await sendNotificacao(
        (convite as any).convidado_por,
        'convite_aceito',
        `✅ ${(meu as any)?.nome_blader || 'Um blader'} entrou no seu time!`,
        { time_id: timeId },
      );
    }
    toast.success('Você entrou no time!');
    await Promise.all([carregarMeuTime(), carregarConvites()]);
  }

  async function recusarConvite(conviteId: string) {
    await supabase.from('time_convites').update({ status: 'recusado' }).eq('id', conviteId);
    await carregarConvites();
  }

  async function sairDoTime(timeId: string) {
    if (!user) return;
    await supabase.from('time_membros')
      .update({ status: 'saiu' })
      .eq('time_id', timeId)
      .eq('user_id', user.id);
    setMeuTime(null);
    toast.success('Você saiu do time.');
  }

  async function removerMembro(timeId: string, userId: string) {
    await supabase.from('time_membros')
      .update({ status: 'expulso' })
      .eq('time_id', timeId)
      .eq('user_id', userId);
    await carregarMeuTime();
    toast.success('Membro removido.');
  }

  async function atualizarTime(timeId: string, dados: Partial<TimeCompleto>) {
    const { error } = await supabase.from('times').update(dados as any).eq('id', timeId);
    if (error) { toast.error('Erro ao atualizar time.'); return; }
    await carregarMeuTime();
    toast.success('Time atualizado!');
  }

  const winrateTime = meuTime
    ? meuTime.vitorias_total + meuTime.derrotas_total > 0
      ? Math.round((meuTime.vitorias_total / (meuTime.vitorias_total + meuTime.derrotas_total)) * 100)
      : 0
    : 0;

  return {
    meuTime, convitesPendentes, winrateTime, loading,
    criarTime, convidarMembro, aceitarConvite,
    recusarConvite, sairDoTime, removerMembro, atualizarTime,
    carregarMeuTime, carregarConvites,
  };
}
