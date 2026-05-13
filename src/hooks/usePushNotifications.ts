import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BLzOPVosPcgf9YWwK3wr5rIzz9smaEYBK5P8vLKKDMCJ_OCltvGV2VNT_Mi9Yi0geQN4mZUGreHAnCfD44P5Ves';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permissao, setPermissao] = useState<NotificationPermission>('default');
  const [inscrito, setInscrito] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermissao(Notification.permission);
    }
    verificarInscricao();
  }, []);

  const verificarInscricao = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setInscrito(!!sub);
    } catch {
      setInscrito(false);
    }
  }, []);

  const solicitarPermissao = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações.');
      return false;
    }

    const resultado = await Notification.requestPermission();
    setPermissao(resultado);

    if (resultado === 'granted') {
      await inscreverPush();
      return true;
    }
    return false;
  }, []);

  const inscreverPush = useCallback(async () => {
    if (!user) return;

    try {
      const reg = await navigator.serviceWorker.ready;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: JSON.stringify(subscription),
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      setInscrito(true);
      toast.success('Notificações ativadas!');
    } catch (error) {
      console.error('Erro ao inscrever push:', error);
      toast.error('Erro ao ativar notificações.');
    }
  }, [user]);

  const cancelarPush = useCallback(async () => {
    if (!user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      setInscrito(false);
      toast.success('Notificações desativadas.');
    } catch (error) {
      console.error('Erro ao cancelar push:', error);
    }
  }, [user]);

  return { permissao, inscrito, solicitarPermissao, cancelarPush };
}
