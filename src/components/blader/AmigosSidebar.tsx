import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { useAmizades } from '@/hooks/useAmizades';
import { BuscarBladerModal } from './BuscarBladerModal';

export function AmigosSidebar() {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const { amigosOnline, amigosOffline, pendentes } = useAmizades();

  const totalAmigos = amigosOnline.length + amigosOffline.length;

  return (
    <>
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)', margin: '8px 16px' }} />

      <div style={{ padding: '4px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-body font-bold uppercase" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.55)' }}>
          AMIGOS {totalAmigos > 0 && <span style={{ color: '#00DCFF' }}>({totalAmigos})</span>}
        </span>
        <button
          onClick={() => setModalAberto(true)}
          title="Adicionar amigo"
          style={{
            background: 'rgba(0,220,255,.08)',
            border: '1px solid rgba(0,220,255,.2)',
            borderRadius: 6, padding: '3px 6px', cursor: 'pointer',
            color: '#00DCFF', display: 'inline-flex', alignItems: 'center',
          }}
        >
          <UserPlus size={11} />
        </button>
      </div>

      {pendentes.length > 0 && (
        <button
          onClick={() => navigate('/blader/home')}
          style={{
            margin: '4px 12px 6px',
            padding: '7px 10px',
            background: 'linear-gradient(90deg, rgba(0,220,255,.1), rgba(0,220,255,.04))',
            border: '1px solid rgba(0,220,255,.25)',
            borderRadius: 8,
            color: '#00DCFF',
            fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani,sans-serif',
            letterSpacing: 1, cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 6, width: 'calc(100% - 24px)',
          }}
        >
          <span>👋</span> {pendentes.length} pedido{pendentes.length > 1 ? 's' : ''}
        </button>
      )}

      <div style={{ maxHeight: 220, overflowY: 'auto', padding: '0 6px 4px' }} className="blader-sidebar-scroll">
        {totalAmigos === 0 ? (
          <div style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} /> Nenhum amigo ainda
          </div>
        ) : (
          <>
            {amigosOnline.map(a => (
              <AmigoItem key={a.id} amigo={a} online onClick={() => navigate(`/blader/perfil/${a.id}`)} />
            ))}
            {amigosOffline.slice(0, 8).map(a => (
              <AmigoItem key={a.id} amigo={a} online={false} onClick={() => navigate(`/blader/perfil/${a.id}`)} />
            ))}
          </>
        )}
      </div>

      <BuscarBladerModal aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </>
  );
}

function AmigoItem({ amigo, online, onClick }: { amigo: any; online: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', margin: '1px 0',
        background: 'transparent', border: 'none', borderRadius: 8,
        cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: amigo.avatar_blader_url
            ? `url(${amigo.avatar_blader_url}) center/cover`
            : 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)',
          opacity: online ? 1 : 0.55,
        }}>
          {!amigo.avatar_blader_url && (amigo.nome_blader?.charAt(0) || '?')}
        </div>
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 9, height: 9, borderRadius: '50%',
          background: online ? '#10B981' : '#4B5563',
          border: '2px solid #080c18',
        }} />
      </div>
      <span style={{
        fontSize: 12, color: online ? '#E2E8F0' : 'rgba(255,255,255,.4)',
        fontWeight: online ? 600 : 500, flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {amigo.nome_blader || 'Blader'}
      </span>
    </button>
  );
}
