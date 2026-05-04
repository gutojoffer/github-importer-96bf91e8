import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MatchOptions = {
  silent?: boolean;
};

export async function verificarEExecutarMatch(userId: string, userEmail?: string | null, options: MatchOptions = {}) {
  try {
    const email = userEmail?.toLowerCase().trim();
    if (!email) return 0;

    const { data: matchedCount, error } = await (supabase as any).rpc('match_bladers_temp_by_email', {
      _user_id: userId,
      _email: email,
    });

    if (error) {
      console.warn('[bladerMatch] RPC falhou:', error.message);
      return 0;
    }

    const count = Number(matchedCount ?? 0);

    if (count > 0 && !options.silent) {
      toast.success(
        `⚡ Encontramos ${count} torneio${count > 1 ? 's' : ''} que você participou! Estatísticas importadas.`,
        { duration: 5000 }
      );
    }

    return count;
  } catch (err: any) {
    console.warn('[bladerMatch] Erro inesperado:', err?.message);
    return 0;
  }
}