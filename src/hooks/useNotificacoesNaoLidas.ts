import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TIPOS_BLADER = [
  'resultado_torneio',
  'torneio_publicado',
  'torneio_iniciado',
  'torneio_amanha',
  'conquista',
  'vinculacao',
];

/** Realtime hook para contar notificações não lidas do usuário atual. */
export function useNotificacoesNaoLidas() {
  const { user } = useAuth();
  const userId = user?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    let cancelled = false;

    async function load() {
      const { count: c } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('lida', false)
        .in('tipo', TIPOS_BLADER);
      if (!cancelled) setCount(c || 0);
    }
    load();

    const channel = supabase
      .channel(`notif-count-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();

    const onRefresh = () => load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('notif:refresh', onRefresh);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener('notif:refresh', onRefresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);

  return count;
}
