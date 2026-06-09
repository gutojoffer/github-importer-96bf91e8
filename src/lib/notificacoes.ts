import { supabase } from '@/integrations/supabase/client';

export type NotifTipo =
  | 'resultado_torneio'
  | 'nova_inscricao'
  | 'torneio_iniciado'
  | 'torneio_amanha'
  | 'conquista'
  | 'vinculacao'
  | 'geral';

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: NotifTipo | string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  dados?: any;
}

export function corTipoNotif(tipo: string): { bg: string; border: string } {
  const cores: Record<string, { bg: string; border: string }> = {
    resultado_torneio: { bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.2)' },
    torneio_iniciado: { bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.2)' },
    nova_inscricao: { bg: 'rgba(0,220,255,.08)', border: 'rgba(0,220,255,.15)' },
    torneio_amanha: { bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.15)' },
    conquista: { bg: 'rgba(139,92,246,.1)', border: 'rgba(139,92,246,.2)' },
    vinculacao: { bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)' },
  };
  return cores[tipo] || { bg: 'rgba(255,255,255,.05)', border: 'rgba(255,255,255,.1)' };
}

export function iconeTipoNotif(tipo: string): string {
  const icons: Record<string, string> = {
    resultado_torneio: '🏆',
    torneio_iniciado: '⚔️',
    nova_inscricao: '👤',
    torneio_amanha: '⏰',
    conquista: '⭐',
    vinculacao: '🔗',
  };
  return icons[tipo] || '🔔';
}

export function formatarDataRelativa(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Envia uma notificação para outro usuário via RPC server-side.
 *  Não pode enviar para si mesmo (validado no banco). */
export async function sendNotificacao(
  targetUserId: string,
  tipo: NotifTipo | string,
  mensagem: string,
  dados?: any
): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any).rpc('send_notificacao', {
      _target_user_id: targetUserId,
      _tipo: tipo,
      _mensagem: mensagem,
      _dados: dados ?? null,
    });
    if (error) {
      console.warn('[notif] send_notificacao falhou:', error.message);
      return null;
    }
    return (data as string) || null;
  } catch (err: any) {
    console.warn('[notif] send_notificacao exception:', err?.message);
    return null;
  }
}

/** Envia notificações ricas de resultado para todos os bladers do torneio.
 *  Substitui as notificações básicas geradas pela RPC apply_tournament_results. */
export async function enviarNotificacoesResultado(torneioId: string) {
  try {
    const { data: torneio } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('id', torneioId)
      .maybeSingle();
    if (!torneio) return;

    const { data: inscricoes } = await supabase
      .from('inscricoes')
      .select('blader_id, posicao_final, vitorias, derrotas, xp_ganho')
      .eq('torneio_id', torneioId)
      .not('blader_id', 'is', null)
      .not('posicao_final', 'is', null);

    if (!inscricoes?.length) return;

    // Remover notificações antigas básicas geradas pela RPC para esses usuários
    const userIds = inscricoes.map((i: any) => i.blader_id);
    await supabase
      .from('notificacoes')
      .delete()
      .in('user_id', userIds)
      .eq('tipo', 'resultado_torneio')
      .gte('created_at', new Date(Date.now() - 60_000).toISOString());

    for (const insc of inscricoes as any[]) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_total, vitorias_total, torneios_total')
        .eq('id', insc.blader_id)
        .maybeSingle();

      const xpTotal = (profile as any)?.xp_total ?? 0;

      const { count: melhores } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tem_perfil_blader', true)
        .gt('xp_total', xpTotal);

      const rankingGlobal = (melhores || 0) + 1;

      const pos = insc.posicao_final;
      const emoji = pos === 1 ? '🏆' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '⚡';
      const xp = insc.xp_ganho || 0;
      const mensagem = [
        `${emoji} ${pos}º lugar em "${torneio.name}"`,
        `+${xp} XP ganhos`,
        `Ranking global: #${rankingGlobal}`,
        `Total: ${insc.vitorias}V · ${insc.derrotas}D`,
      ].join(' · ');

      await supabase.from('notificacoes').insert({
        user_id: insc.blader_id,
        tipo: 'resultado_torneio',
        mensagem,
        lida: false,
        dados: {
          torneio_id: torneioId,
          torneio_nome: torneio.name,
          posicao_final: pos,
          xp_ganho: xp,
          vitorias: insc.vitorias,
          derrotas: insc.derrotas,
          ranking_global: rankingGlobal,
          xp_total: xpTotal,
          torneios_total: (profile as any)?.torneios_total ?? 0,
        } as any,
      } as any);
    }
  } catch (err) {
    console.error('enviarNotificacoesResultado:', err);
  }
}

/** Notifica todos os inscritos quando o torneio começa. */
export async function enviarNotificacoesInicio(torneioId: string) {
  try {
    const { data: torneio } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('id', torneioId)
      .maybeSingle();
    if (!torneio) return;

    const { data: inscricoes } = await supabase
      .from('inscricoes')
      .select('blader_id')
      .eq('torneio_id', torneioId)
      .not('blader_id', 'is', null);

    for (const i of (inscricoes || []) as any[]) {
      await supabase.from('notificacoes').insert({
        user_id: i.blader_id,
        tipo: 'torneio_iniciado',
        mensagem: `⚔️ "${torneio.name}" começou! Vá para a arena.`,
        lida: false,
        dados: { torneio_id: torneioId } as any,
      } as any);
    }
  } catch (err) {
    console.error('enviarNotificacoesInicio:', err);
  }
}

/** Notifica todos os bladers cadastrados quando um novo torneio é publicado. */
export async function enviarNotificacoesTorneioPublicado(torneio: {
  id: string;
  name: string;
  horario_inicio?: string | null;
  local_cidade?: string | null;
  local_estado?: string | null;
  local_nome?: string | null;
}) {
  try {
    const { data: bladers } = await supabase
      .from('profiles')
      .select('id')
      .eq('tem_perfil_blader', true);

    if (!bladers?.length) return;

    let dataFmt = '';
    if (torneio.horario_inicio) {
      try {
        dataFmt = new Date(torneio.horario_inicio).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
      } catch {}
    }
    const local = torneio.local_cidade || torneio.local_estado || torneio.local_nome || 'a definir';
    const sufData = dataFmt ? ` — ${dataFmt}` : '';
    const mensagem = `🏟️ Novo torneio disponível: "${torneio.name}"${sufData} em ${local}`;

    const notifs = (bladers as any[]).map(b => ({
      user_id: b.id,
      tipo: 'torneio_publicado',
      mensagem,
      lida: false,
      dados: { torneio_id: torneio.id, torneio_nome: torneio.name } as any,
    }));

    // Inserir em chunks de 500 para evitar payloads gigantes
    for (let i = 0; i < notifs.length; i += 500) {
      await supabase.from('notificacoes').insert(notifs.slice(i, i + 500) as any);
    }
  } catch (err) {
    console.error('enviarNotificacoesTorneioPublicado:', err);
  }
}
