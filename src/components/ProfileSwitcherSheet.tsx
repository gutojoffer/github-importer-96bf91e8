import { useNavigate } from 'react-router-dom';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useAuth } from '@/contexts/AuthContext';
import BladerAvatar from '@/components/BladerAvatar';
import { LogOut } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSwitcherSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { mode, perfis, setMode } = useActiveMode();
  const { signOut } = useAuth();

  if (!open) return null;

  const handleSwitchToBlader = () => {
    setMode('blader');
    navigate('/blader/home');
    onClose();
  };

  const handleSwitchToOrg = () => {
    setMode('organizador');
    navigate('/home');
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.6)',
          zIndex: 200,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          zIndex: 201,
          background: '#0d1120',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTop: '1px solid rgba(255,255,255,.08)',
          padding: '12px 0 max(20px, env(safe-area-inset-bottom)) 0',
          animation: 'slide-up .22s ease-out',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 40px rgba(0,0,0,.5)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '0 18px 14px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#E2E8F0', letterSpacing: 0.4 }}>
            Trocar modo
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
            Escolha como quer continuar
          </div>
        </div>

        {/* Card Blader */}
        {perfis.temBlader && perfis.dadosBlader ? (
          <div
            onClick={handleSwitchToBlader}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', cursor: 'pointer',
              background: mode === 'blader' ? 'rgba(245,158,11,.10)' : 'transparent',
              borderLeft: mode === 'blader' ? '3px solid #F59E0B' : '3px solid transparent',
              transition: 'all .15s',
            }}
          >
            <BladerAvatar
              url={perfis.dadosBlader.avatar}
              name={perfis.dadosBlader.nome}
              colorKey={perfis.dadosBlader.corPerfil || undefined}
              size={42}
              borderWidth={2}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FCD34D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {perfis.dadosBlader.nome || 'Meu Blader'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>⚡ Blader</div>
            </div>
            {mode === 'blader' && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#F59E0B', background: 'rgba(245,158,11,.15)', padding: '3px 7px', borderRadius: 6 }}>
                ATIVO
              </span>
            )}
          </div>
        ) : (
          <div
            onClick={() => { navigate('/criar-perfil-blader'); onClose(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', opacity: 0.85 }}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(245,158,11,.12)', border: '1px dashed rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              ⚡
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FCD34D' }}>Criar perfil Blader</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Compete nos torneios</div>
            </div>
          </div>
        )}

        {/* Card Organizador */}
        {perfis.temOrganizador && perfis.dadosOrganizador ? (
          <div
            onClick={handleSwitchToOrg}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', cursor: 'pointer',
              background: mode === 'organizador' ? 'rgba(37,99,235,.10)' : 'transparent',
              borderLeft: mode === 'organizador' ? '3px solid #2563EB' : '3px solid transparent',
              transition: 'all .15s',
            }}
          >
            {perfis.dadosOrganizador.logo ? (
              <img
                src={perfis.dadosOrganizador.logo}
                alt={perfis.dadosOrganizador.nomeLiga || 'Liga'}
                style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(37,99,235,.5)' }}
              />
            ) : (
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', border: '2px solid rgba(37,99,235,.5)' }}>
                {(perfis.dadosOrganizador.nomeLiga || 'BX').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#60A5FA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {perfis.dadosOrganizador.nomeLiga || 'Minha Liga'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>🏆 Organizador</div>
            </div>
            {mode === 'organizador' && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#60A5FA', background: 'rgba(37,99,235,.15)', padding: '3px 7px', borderRadius: 6 }}>
                ATIVO
              </span>
            )}
          </div>
        ) : (
          <div
            onClick={() => { navigate('/criar-perfil-organizador'); onClose(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', opacity: 0.85 }}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(37,99,235,.12)', border: '1px dashed rgba(37,99,235,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🏆
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#60A5FA' }}>Criar perfil Organizador</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Crie e gerencie ligas</div>
            </div>
          </div>
        )}

        {/* Sair */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', marginTop: 6 }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', width: '100%',
              background: 'transparent', border: 'none',
              color: '#9CA3AF', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} strokeWidth={1.6} />
            Sair da conta
          </button>
        </div>
      </div>
    </>
  );
}
