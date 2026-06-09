import { supabase } from '@/integrations/supabase/client';

/**
 * Recalcula o progresso das conquistas do blader e dispara notificações
 * para as recém-concluídas.
 *
 * Toda a lógica roda em uma RPC SECURITY DEFINER no servidor
 * (`recompute_blader_conquistas`) — o cliente não pode mais escrever direto em
 * `conquistas_bladers` ou `notificacoes` por motivos de segurança.
 */
export async function atualizarConquistas(userId: string) {
  if (!userId) return;
  try {
    const { error } = await (supabase as any).rpc('recompute_blader_conquistas', {
      _user_id: userId,
    });
    if (error) console.warn('[conquistas] recompute falhou:', error.message);
  } catch (err: any) {
    console.warn('[conquistas] recompute exception:', err?.message);
  }
}
