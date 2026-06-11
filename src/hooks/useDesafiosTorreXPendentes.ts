import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDesafiosTorreXPendentes(): number {
  const { user } = useAuth();
  const userId = user?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }
    let cancel = false;

    async function load() {
      const { count: c } = await supabase
        .from('torre_x_desafios')
        .select('id', { count: 'exact', head: true })
        .eq('desafiado_id', userId)
        .eq('status', 'pendente');
      if (!cancel) setCount(c ?? 0);
    }
    void load();

    const ch = supabase.channel(`desafios-pend-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'torre_x_desafios', filter: `desafiado_id=eq.${userId}` }, () => load())
      .subscribe();

    const onVisible = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => { cancel = true; supabase.removeChannel(ch); document.removeEventListener('visibilitychange', onVisible); };
  }, [userId]);

  return count;
}
