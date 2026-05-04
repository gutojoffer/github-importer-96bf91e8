import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Notificacao,
  corTipoNotif,
  iconeTipoNotif,
  formatarDataRelativa,
} from '@/lib/notificacoes';

const estiloTagNotif: React.CSSProperties = {
  padding: '1px 7px',
  borderRadius: 6,
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.08)',
  fontSize: 10,
  fontWeight: 700,
};

export default function SinoNotificacoes() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState(false);
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled) setNotificacoes((data || []) as any);
    })();

    const channel = supabase
      .channel(`notif-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const novo = payload.new as Notificacao;
          setNotificacoes(prev => [novo, ...prev].slice(0, 20));
          if (novo.tipo === 'resultado_torneio') {
            toast.success(novo.mensagem.split(' · ')[0], { duration: 5000 });
          } else if (novo.tipo === 'torneio_iniciado') {
            toast(novo.mensagem, { duration: 5000 });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function marcarLida(id: string) {
    const alvo = notificacoes.find(n => n.id === id);
    if (!alvo || alvo.lida) return;
    setNotificacoes(prev => prev.map(n => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  }

  async function marcarTodasLidas() {
    if (!userId) return;
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    await supabase.from('notificacoes').update({ lida: true }).eq('user_id', userId).eq('lida', false);
  }

  if (!userId) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: 10,
          background: aberto ? 'rgba(0,220,255,.1)' : 'rgba(255,255,255,.04)',
          border: `1px solid ${aberto ? 'rgba(0,220,255,.25)' : 'rgba(255,255,255,.08)'}`,
          color: aberto ? '#00DCFF' : 'rgba(255,255,255,.5)',
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all .15s',
        }}
        aria-label="Notificações"
      >
        🔔
        {naoLidas > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              borderRadius: 999,
              background: '#EF4444',
              border: '2px solid #060912',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </div>
        )}
      </button>

      {aberto && (
        <>
          <div
            onClick={() => setAberto(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: 'absolute',
              top: 44,
              right: 0,
              width: 340,
              maxHeight: 480,
              background: '#0d1120',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 14,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0,0,0,.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,.06)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Rajdhani, sans-serif',
                  color: '#fff',
                  letterSpacing: 1,
                }}
              >
                Notificações
                {naoLidas > 0 && (
                  <span
                    style={{
                      marginLeft: 8,
                      padding: '1px 7px',
                      borderRadius: 20,
                      background: 'rgba(239,68,68,.15)',
                      color: '#F87171',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {naoLidas} novas
                  </span>
                )}
              </div>
              {naoLidas > 0 && (
                <button
                  onClick={marcarTodasLidas}
                  style={{
                    fontSize: 11,
                    color: '#00DCFF',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notificacoes.length === 0 && (
                <div
                  style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,.25)',
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🔔</div>
                  Nenhuma notificação ainda
                </div>
              )}
              {notificacoes.map(n => {
                const cor = corTipoNotif(n.tipo);
                return (
                  <div
                    key={n.id}
                    onClick={() => marcarLida(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,.04)',
                      background: n.lida ? 'transparent' : 'rgba(0,220,255,.03)',
                      cursor: 'pointer',
                      transition: 'background .15s',
                      display: 'flex',
                      gap: 10,
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
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: cor.bg,
                        border: `1px solid ${cor.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                      }}
                    >
                      {iconeTipoNotif(n.tipo)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: n.lida ? 'rgba(255,255,255,.5)' : '#E2E8F0',
                          lineHeight: 1.4,
                          marginBottom: 3,
                        }}
                      >
                        {n.mensagem}
                      </div>

                      {n.tipo === 'resultado_torneio' && n.dados && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                          {typeof n.dados.xp_ganho === 'number' && (
                            <span style={{ ...estiloTagNotif, color: '#FCD34D' }}>
                              +{n.dados.xp_ganho} XP
                            </span>
                          )}
                          {typeof n.dados.ranking_global === 'number' && (
                            <span style={{ ...estiloTagNotif, color: '#A78BFA' }}>
                              #{n.dados.ranking_global} global
                            </span>
                          )}
                          {typeof n.dados.vitorias === 'number' && (
                            <span style={{ ...estiloTagNotif, color: '#34D399' }}>
                              {n.dados.vitorias}V {n.dados.derrotas}D
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginTop: 4 }}>
                        {formatarDataRelativa(n.created_at)}
                      </div>
                    </div>

                    {!n.lida && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#00DCFF',
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
