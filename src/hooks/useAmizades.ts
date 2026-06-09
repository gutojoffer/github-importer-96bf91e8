import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sendNotificacao } from '@/lib/notificacoes';

export interface BladerAmigo {
  amizadeId?: string;
  id: string;
  nome_blader: string | null;
  avatar_blader_url: string | null;
  cidade_blader: string | null;
  estado_blader: string | null;
  xp_total: number | null;
  vitorias_total: number | null;
  torneios_total: number | null;
  elo?: { pontos: number; elo: string } | null;
  torre?: { andar: number; tier: string } | null;
  online?: boolean;
  ultimoVisto?: string | null;
  statusAmizade?: string | null;
  jaAmigo?: boolean;
  pendente?: boolean;
}

export interface PedidoAmizade {
  id: string;
  created_at: string;
  solicitante: BladerAmigo;
}

const PROFILE_FIELDS = 'id, nome_blader, avatar_blader_url, cidade_blader, estado_blader, xp_total, vitorias_total, torneios_total';

async function fetchProfilesEnriched(ids: string[]): Promise<Record<string, BladerAmigo>> {
  if (ids.length === 0) return {};
  const [profiles, elos, torres, presencas] = await Promise.all([
    supabase.from('profiles').select(PROFILE_FIELDS).in('id', ids),
    supabase.from('elo_bladers').select('user_id, pontos, elo').in('user_id', ids),
    supabase.from('torre_x_pontos').select('user_id, andar, tier').in('user_id', ids),
    supabase.from('presenca_online').select('user_id, online, ultimo_visto').in('user_id', ids),
  ]);

  const eloMap = new Map<string, any>();
  (elos.data || []).forEach((e: any) => { if (!eloMap.has(e.user_id)) eloMap.set(e.user_id, e); });
  const torreMap = new Map<string, any>();
  (torres.data || []).forEach((t: any) => { if (!torreMap.has(t.user_id)) torreMap.set(t.user_id, t); });
  const presMap = new Map<string, any>();
  (presencas.data || []).forEach((p: any) => presMap.set(p.user_id, p));

  const result: Record<string, BladerAmigo> = {};
  for (const p of (profiles.data || []) as any[]) {
    const pres = presMap.get(p.id);
    const onlineRecente = pres?.online && pres?.ultimo_visto &&
      (Date.now() - new Date(pres.ultimo_visto).getTime()) < 2 * 60 * 1000;
    result[p.id] = {
      ...p,
      elo: eloMap.get(p.id) || null,
      torre: torreMap.get(p.id) || null,
      online: !!onlineRecente,
      ultimoVisto: pres?.ultimo_visto || null,
    };
  }
  return result;
}

export function useAmizades() {
  const { user } = useAuth();
  const [amigos, setAmigos] = useState<BladerAmigo[]>([]);
  const [pendentes, setPendentes] = useState<PedidoAmizade[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarAmigos = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('amizades')
      .select('id, solicitante_id, destinatario_id, status, updated_at')
      .or(`solicitante_id.eq.${user.id},destinatario_id.eq.${user.id}`)
      .eq('status', 'aceita')
      .order('updated_at', { ascending: false });

    const rows = (data || []) as any[];
    const otherIds = rows.map(r => r.solicitante_id === user.id ? r.destinatario_id : r.solicitante_id);
    const profiles = await fetchProfilesEnriched(otherIds);

    const lista: BladerAmigo[] = rows.map(r => {
      const otherId = r.solicitante_id === user.id ? r.destinatario_id : r.solicitante_id;
      const p = profiles[otherId];
      return p ? { ...p, amizadeId: r.id } : { amizadeId: r.id, id: otherId, nome_blader: null, avatar_blader_url: null, cidade_blader: null, estado_blader: null, xp_total: 0, vitorias_total: 0, torneios_total: 0 };
    });
    setAmigos(lista);
    setLoading(false);
  }, [user]);

  const carregarPendentes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('amizades')
      .select('id, solicitante_id, created_at')
      .eq('destinatario_id', user.id)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    const rows = (data || []) as any[];
    const profiles = await fetchProfilesEnriched(rows.map(r => r.solicitante_id));
    setPendentes(rows.map(r => ({
      id: r.id,
      created_at: r.created_at,
      solicitante: profiles[r.solicitante_id] || ({ id: r.solicitante_id, nome_blader: 'Blader' } as any),
    })));
  }, [user]);

  const atualizarPresenca = useCallback(async () => {
    if (!user) return;
    await supabase.from('presenca_online').upsert({
      user_id: user.id,
      online: true,
      ultimo_visto: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    carregarAmigos();
    carregarPendentes();
    atualizarPresenca();

    const interval = setInterval(atualizarPresenca, 30000);

    const channel = supabase.channel(`amizades-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'amizades', filter: `destinatario_id=eq.${user.id}` }, () => carregarPendentes())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'amizades', filter: `solicitante_id=eq.${user.id}` }, () => carregarAmigos())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'amizades', filter: `destinatario_id=eq.${user.id}` }, () => { carregarAmigos(); carregarPendentes(); })
      .subscribe();

    const onUnload = () => {
      supabase.from('presenca_online').upsert({
        user_id: user.id, online: false, ultimo_visto: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [user, carregarAmigos, carregarPendentes, atualizarPresenca]);

  async function enviarSolicitacao(destinatarioId: string) {
    if (!user) return false;
    const { error } = await supabase.from('amizades').insert({
      solicitante_id: user.id,
      destinatario_id: destinatarioId,
      status: 'pendente',
    });
    if (error) {
      if ((error as any).code === '23505') toast.error('Solicitação já enviada.');
      else toast.error('Erro ao enviar solicitação.');
      return false;
    }
    const { data: meu } = await supabase.from('profiles').select('nome_blader').eq('id', user.id).maybeSingle();
    await sendNotificacao(
      destinatarioId,
      'pedido_amizade',
      `👋 ${(meu as any)?.nome_blader || 'Um blader'} quer ser seu amigo no BLADEX!`,
      { solicitante_id: user.id, solicitante_nome: (meu as any)?.nome_blader },
    );
    toast.success('Solicitação enviada!');
    return true;
  }

  async function aceitarAmizade(amizadeId: string, solicitanteId: string) {
    if (!user) return;
    await supabase.from('amizades')
      .update({ status: 'aceita', updated_at: new Date().toISOString() })
      .eq('id', amizadeId);

    const { data: meu } = await supabase.from('profiles').select('nome_blader').eq('id', user.id).maybeSingle();

    await supabase.from('feed_atividades').insert([
      { user_id: user.id, tipo: 'amizade_aceita', dados: { amigo_id: solicitanteId } },
    ]);

    await supabase.from('notificacoes').insert({
      user_id: solicitanteId,
      tipo: 'amizade_aceita',
      mensagem: `✅ ${(meu as any)?.nome_blader || 'Seu pedido'} aceitou seu pedido de amizade!`,
      lida: false,
      dados: { amigo_id: user.id },
    });

    toast.success('Amizade aceita!');
    carregarAmigos();
    carregarPendentes();
  }

  async function recusarAmizade(amizadeId: string) {
    await supabase.from('amizades').update({ status: 'recusada' }).eq('id', amizadeId);
    carregarPendentes();
  }

  async function removerAmigo(amizadeId: string) {
    await supabase.from('amizades').delete().eq('id', amizadeId);
    toast.success('Amigo removido.');
    carregarAmigos();
  }

  async function buscarBladers(query: string): Promise<BladerAmigo[]> {
    if (!user || query.length < 2) return [];
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .ilike('nome_blader', `%${query}%`)
      .eq('tem_perfil_blader', true)
      .neq('id', user.id)
      .limit(8);

    const bladers = (data || []) as any[];
    if (bladers.length === 0) return [];

    const ids = bladers.map(b => b.id);
    const [enriched, amizadesRes] = await Promise.all([
      fetchProfilesEnriched(ids),
      supabase.from('amizades')
        .select('solicitante_id, destinatario_id, status')
        .or(`and(solicitante_id.eq.${user.id},destinatario_id.in.(${ids.join(',')})),and(destinatario_id.eq.${user.id},solicitante_id.in.(${ids.join(',')}))`),
    ]);

    const amizades = (amizadesRes.data || []) as any[];

    return bladers.map(b => {
      const amizade = amizades.find(a =>
        (a.solicitante_id === user.id && a.destinatario_id === b.id) ||
        (a.destinatario_id === user.id && a.solicitante_id === b.id)
      );
      return {
        ...(enriched[b.id] || b),
        statusAmizade: amizade?.status || null,
        jaAmigo: amizade?.status === 'aceita',
        pendente: amizade?.status === 'pendente',
      };
    });
  }

  async function amigosEmComum(outroUserId: string): Promise<BladerAmigo[]> {
    if (!user) return [];
    const meusIds = new Set(amigos.map(a => a.id));
    const { data } = await supabase
      .from('amizades')
      .select('solicitante_id, destinatario_id, status')
      .or(`solicitante_id.eq.${outroUserId},destinatario_id.eq.${outroUserId}`)
      .eq('status', 'aceita');
    const outrosIds = (data || [])
      .map((r: any) => r.solicitante_id === outroUserId ? r.destinatario_id : r.solicitante_id)
      .filter((id: string) => meusIds.has(id) && id !== user.id);
    if (outrosIds.length === 0) return [];
    const enriched = await fetchProfilesEnriched(outrosIds);
    return Object.values(enriched);
  }

  return {
    amigos,
    pendentes,
    loading,
    enviarSolicitacao,
    aceitarAmizade,
    recusarAmizade,
    removerAmigo,
    buscarBladers,
    amigosEmComum,
    amigosOnline: amigos.filter(a => a.online),
    amigosOffline: amigos.filter(a => !a.online),
    recarregar: () => { carregarAmigos(); carregarPendentes(); },
  };
}

