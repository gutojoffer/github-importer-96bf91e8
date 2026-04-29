import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MatchOptions = {
  silent?: boolean;
};

export async function verificarEExecutarMatch(userId: string, userEmail?: string | null, options: MatchOptions = {}) {
  const email = userEmail?.toLowerCase().trim();

  if (!email) return 0;

  console.log('Verificando match para email:', email);

  const { data: matches, error: matchError } = await supabase
    .from('bladers_temp')
    .select('id, nome, email, organizador_id')
    .eq('email', email)
    .is('vinculado_a', null);

  console.log('Matches encontrados:', matches?.length ?? 0, matchError);

  const { data: matchedCount, error } = await (supabase as any).rpc('match_bladers_temp_by_email', {
    _user_id: userId,
    _email: email,
  });

  if (error) {
    console.error('Erro ao executar match automático:', error);
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
}