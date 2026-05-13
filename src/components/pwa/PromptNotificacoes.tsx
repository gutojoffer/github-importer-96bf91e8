import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PromptNotificacoes() {
  const { permissao, inscrito, solicitarPermissao } = usePushNotifications();
  const [dispensado, setDispensado] = useState(
    () => localStorage.getItem('notif_dispensado') === 'true'
  );

  if (
    permissao === 'granted' ||
    permissao === 'denied' ||
    dispensado ||
    !('Notification' in window)
  ) return null;

  function dispensar() {
    localStorage.setItem('notif_dispensado', 'true');
    setDispensado(true);
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(54px + env(safe-area-inset-top))',
        left: 0,
        right: 0,
        zIndex: 60,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(0,220,255,0.08), rgba(57,255,20,0.04))',
        borderBottom: '1px solid rgba(0,220,255,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(0,220,255,0.1)',
          border: '1px solid rgba(0,220,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0
        }}>
          🔔
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>
            Ativar notificações
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Receba alertas de desafios, torneios e resultados em tempo real
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={solicitarPermissao}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(0,220,255,0.12)',
              border: '1px solid rgba(0,220,255,0.25)',
              color: '#00D4FF', fontWeight: 700, fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Ativar
          </button>
          <button
            onClick={dispensar}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
