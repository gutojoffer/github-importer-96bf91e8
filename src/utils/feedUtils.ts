import { supabase } from '@/integrations/supabase/client';

export type TipoFeed =
  | 'torneio_resultado'
  | 'torneio_inscricao'
  | 'elo_subiu'
  | 'streak'
  | 'torre_x_andar'
  | 'conquista'
  | 'amizade_aceita';

export async function registrarAtividadeFeed(
  userId: string,
  tipo: TipoFeed | string,
  dados: Record<string, any>
) {
  try {
    await supabase.from('feed_atividades').insert({
      user_id: userId,
      tipo,
      dados,
    });
  } catch (e) {
    console.warn('[feed] erro ao registrar atividade', e);
  }
}

export function formatarDataRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
