import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function BannerInstalarApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [jaInstalado, setJaInstalado] = useState(false);
  const { solicitarPermissao } = usePushNotifications();

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(ios);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setJaInstalado(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setMostrar(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (jaInstalado || !mostrar) return null;

  async function instalar() {
    if (deferredPrompt) {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === 'accepted') {
        setMostrar(false);
        setDeferredPrompt(null);
        setTimeout(() => solicitarPermissao(), 2000);
      }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, rgba(6,9,18,0.98), rgba(8,11,28,0.99))',
        borderTop: '1px solid rgba(0,220,255,0.15)',
        animation: 'slideUp 0.4s ease',
      }}
    >
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(0,220,255,0.15), rgba(57,255,20,0.1))',
          border: '1px solid rgba(0,220,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0
        }}>
          ⚔️
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>
            Instalar BLADEX
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {isIOS
              ? 'Toque em compartilhar e depois "Adicionar à Tela de Início"'
              : 'Acesse torneios, Torre X e notificações como app nativo'
            }
          </div>
        </div>

        <button
          onClick={() => setMostrar(false)}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,.3)',
            cursor: 'pointer', fontSize: 20, flexShrink: 0,
            padding: '0 4px'
          }}
        >
          ×
        </button>
      </div>

      {isIOS ? (
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, fontSize: 12,
          color: 'rgba(255,255,255,0.5)', textAlign: 'center'
        }}>
          <span style={{ fontSize: 16, marginRight: 6 }}>⎙</span>
          Toque no botão compartilhar do Safari → "Adicionar à Tela de Início"
        </div>
      ) : (
        <button
          onClick={instalar}
          style={{
            marginTop: 10, width: '100%',
            padding: '10px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(0,220,255,0.15), rgba(57,255,20,0.1))',
            border: '1px solid rgba(0,220,255,0.25)',
            color: '#00D4FF', fontWeight: 700, fontSize: 13,
            cursor: 'pointer'
          }}
        >
          📲 Instalar como app
        </button>
      )}
    </div>
  );
}
