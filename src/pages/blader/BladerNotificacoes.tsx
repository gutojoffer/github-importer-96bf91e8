import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BladerLayout from '@/components/blader/BladerLayout';
import {
  Notificacao,
  corTipoNotif,
  iconeTipoNotif,
  formatarDataRelativa,
} from '@/lib/notificacoes';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

const tagStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 6,
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.08)',
  fontSize: 11,
  fontWeight: 700,
};

export default function BladerNotificacoes() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!cancelled) {
        setNotificacoes((data || []) as any);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`notif-page-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          setNotificacoes(prev => [payload.new as Notificacao, ...prev]);
          if (payload.new.tipo === 'resultado_torneio') {
            toast.success(payload.new.mensagem.split(' · ')[0], { duration: 5000 });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  async function marcarLida(id: string) {
    const alvo = notificacoes.find(n => n.id === id);
    if (!alvo || alvo.lida) return;
    setNotificacoes(prev => prev.map(n => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  }

  async function marcarTodasLidas() {
    if (!userId || naoLidas === 0) return;
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    await supabase.from('notificacoes').update({ lida: true }).eq('user_id', userId).eq('lida', false);
  }

  return (
    <BladerLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              background: 'rgba(245,158,11,.1)',
              border: '1px solid rgba(245,158,11,.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBBF24',
            }}
          >
            <Bell size={20} strokeWidth={1.6} />
          </div>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: 22,
                color: '#fff',
                letterSpacing: 1,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              NOTIFICAÇÕES
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', margin: 0 }}>
              {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Tudo em dia'}
            </p>
          </div>
          {naoLidas > 0 && (
            <button
              onClick={marcarTodasLidas}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(0,220,255,.08)',
                border: '1px solid rgba(0,220,255,.2)',
                color: '#00DCFF',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CheckCheck size={14} strokeWidth={1.6} />
              Marcar todas
            </button>
          )}
        </div>

        {/* Lista */}
        <div
          style={{
            background: '#0d1120',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
              Carregando...
            </div>
          )}
          {!loading && notificacoes.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>
              <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>🔔</div>
              <div style={{ fontSize: 13 }}>Nenhuma notificação ainda</div>
            </div>
          )}
          {notificacoes.map((n, idx) => {
            const cor = corTipoNotif(n.tipo);
            return (
              <div
                key={n.id}
                onClick={() => marcarLida(n.id)}
                style={{
                  padding: '14px 16px',
                  borderBottom: idx === notificacoes.length - 1 ? 'none' : '1px solid rgba(255,255,255,.04)',
                  background: n.lida ? 'transparent' : 'rgba(0,220,255,.03)',
                  cursor: 'pointer',
                  transition: 'background .15s',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.03)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = n.lida
                    ? 'transparent'
                    : 'rgba(0,220,255,.03)';
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: cor.bg,
                    border: `1px solid ${cor.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  {iconeTipoNotif(n.tipo)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: n.lida ? 'rgba(255,255,255,.55)' : '#E2E8F0',
                      lineHeight: 1.45,
                      marginBottom: 4,
                    }}
                  >
                    {n.mensagem}
                  </div>

                  {n.tipo === 'resultado_torneio' && n.dados && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {typeof n.dados.xp_ganho === 'number' && (
                        <span style={{ ...tagStyle, color: '#FCD34D' }}>+{n.dados.xp_ganho} XP</span>
                      )}
                      {typeof n.dados.ranking_global === 'number' && (
                        <span style={{ ...tagStyle, color: '#A78BFA' }}>#{n.dados.ranking_global} global</span>
                      )}
                      {typeof n.dados.vitorias === 'number' && (
                        <span style={{ ...tagStyle, color: '#34D399' }}>
                          {n.dados.vitorias}V {n.dados.derrotas}D
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 6 }}>
                    {formatarDataRelativa(n.created_at)}
                  </div>
                </div>

                {!n.lida && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#00DCFF',
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BladerLayout>
  );
}
