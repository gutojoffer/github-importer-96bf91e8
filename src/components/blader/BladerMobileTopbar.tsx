import { Link } from 'react-router-dom';
import { Bell, Users } from 'lucide-react';
import { useState } from 'react';
import { useNotificacoesNaoLidas } from '@/hooks/useNotificacoesNaoLidas';
import { useAmizades } from '@/hooks/useAmizades';
import { PainelAmigos } from './PainelAmigos';

/**
 * Topbar exibida apenas no mobile dentro do BladerLayout.
 * Mostra a marca BLADEX e o sino de notificações com badge.
 */
export function BladerMobileTopbar() {
  const naoLidas = useNotificacoesNaoLidas();
  const { amigos, pendentes } = useAmizades();
  const [amigosAberto, setAmigosAberto] = useState(false);

  return (
    <header
      className="md:hidden flex items-center justify-between sticky top-0 z-40 shrink-0"
      style={{
        height: 52,
        padding: '0 16px',
        background: 'rgba(8,12,24,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <Link to="/blader/home" className="flex items-center gap-2">
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #B45309, #F59E0B)',
            border: '1px solid rgba(245,158,11,.4)',
          }}
        >
          <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 11 }}>BL</span>
        </div>
        <span className="font-heading font-bold text-white leading-tight" style={{ fontSize: 16, letterSpacing: 0.5 }}>
          BLADE<span style={{ color: '#FBBF24' }}>X</span>
        </span>
      </Link>

      <Link
        to="/blader/notificacoes"
        aria-label="Notificações"
        className="relative flex items-center justify-center"
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <Bell size={18} strokeWidth={1.6} style={{ color: naoLidas > 0 ? '#FBBF24' : '#94A3B8' }} />
        {naoLidas > 0 && (
          <span
            className="absolute font-body"
            style={{
              top: -4, right: -4,
              minWidth: 18, height: 18, padding: '0 5px',
              borderRadius: 999, background: '#EF4444',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1,
              border: '2px solid #080c18',
            }}
          >
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </Link>
    </header>
  );
}

export default BladerMobileTopbar;
