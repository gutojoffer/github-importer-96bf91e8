import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { Home, Trophy, Clock, Star, User, Settings, LogOut, ChevronRight, Repeat } from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Home', url: '/blader/home', icon: Home },
  { title: 'Torneios', url: '/blader/tournaments', icon: Trophy },
  { title: 'Meu histórico', url: '/blader/history', icon: Clock },
  { title: 'Rankings', url: '/blader/rankings', icon: Star },
  { title: 'Meu perfil', url: '/blader/profile', icon: User },
];

const SYSTEM_ITEMS = [
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function BladerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const { setMode } = useActiveMode();

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + '/');

  const initials = (profile?.nome || 'BL').slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSwitchToOrg = () => {
    setMode('organizador');
    navigate('/home');
  };

  return (
    <aside
      className="shrink-0 h-screen flex-col sticky top-0 hidden md:flex"
      style={{ width: 240, background: '#080c18', borderRight: '1px solid rgba(255,255,255,.06)' }}
    >
      {/* Accent line — gold for blader */}
      <div className="shrink-0" style={{ height: 2, background: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 50%, transparent 100%)' }} />

      {/* Logo area */}
      <div className="flex items-center gap-2.5" style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #B45309, #F59E0B)', border: '1px solid rgba(245,158,11,.4)' }}
        >
          <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 14 }}>BL</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-bold text-white leading-tight" style={{ fontSize: 18, letterSpacing: 0.5 }}>
            BLADE<span style={{ color: '#FBBF24' }}>X</span>
          </span>
          <span className="font-body uppercase leading-tight" style={{ fontSize: 9, color: 'rgba(245,158,11,.8)', letterSpacing: 1.5 }}>
            Blader Hub
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ padding: '16px 16px 6px' }}>
          <span className="font-body font-bold uppercase" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.55)' }}>
            NAVEGAÇÃO
          </span>
        </div>

        <nav className="flex flex-col gap-px">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                className="relative flex items-center gap-3"
                style={{
                  padding: active ? '10px 14px 10px 11px' : '10px 14px',
                  borderRadius: 10,
                  margin: '1px 8px',
                  borderLeft: active ? '3px solid #F59E0B' : '3px solid transparent',
                  background: active ? 'linear-gradient(90deg, rgba(245,158,11,.15), rgba(245,158,11,.05))' : undefined,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
              >
                <item.icon size={18} strokeWidth={1.4} className="shrink-0" style={{ color: active ? '#FBBF24' : '#64748B', opacity: active ? 1 : 0.35 }} />
                <span className="font-body flex-1" style={{ fontSize: 13, color: active ? '#FBBF24' : '#64748B', fontWeight: active ? 700 : 500 }}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)', margin: '8px 16px' }} />

        <div style={{ padding: '4px 16px 6px' }}>
          <span className="font-body font-bold uppercase" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.55)' }}>
            SISTEMA
          </span>
        </div>
        <nav className="flex flex-col gap-px">
          {SYSTEM_ITEMS.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                className="relative flex items-center gap-3"
                style={{
                  padding: active ? '10px 14px 10px 11px' : '10px 14px',
                  borderRadius: 10,
                  margin: '1px 8px',
                  borderLeft: active ? '3px solid #F59E0B' : '3px solid transparent',
                  background: active ? 'linear-gradient(90deg, rgba(245,158,11,.15), rgba(245,158,11,.05))' : undefined,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
              >
                <item.icon size={18} strokeWidth={1.4} className="shrink-0" style={{ color: active ? '#FBBF24' : '#64748B', opacity: active ? 1 : 0.35 }} />
                <span className="font-body flex-1" style={{ fontSize: 13, color: active ? '#FBBF24' : '#64748B', fontWeight: active ? 700 : 500 }}>
                  {item.title}
                </span>
              </Link>
            );
          })}

          {profile?.hasDualProfile && (
            <button
              onClick={handleSwitchToOrg}
              className="relative flex items-center gap-3 text-left"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                margin: '1px 8px',
                borderLeft: '3px solid transparent',
                transition: 'all .15s',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
            >
              <Repeat size={18} strokeWidth={1.4} className="shrink-0" style={{ color: '#60A5FA', opacity: 0.7 }} />
              <span className="font-body flex-1" style={{ fontSize: 13, color: '#60A5FA', fontWeight: 500 }}>
                Modo Organizador
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer — user card */}
      <div className="shrink-0" style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.05)', marginTop: 'auto' }}>
        {/* Banner: criar perfil de Organizador */}
        {profile && !profile.temPerfilOrganizador && (
          <div
            onClick={() => navigate('/criar-perfil-organizador')}
            className="cursor-pointer transition-all duration-150 mb-2"
            style={{
              padding: '10px 12px',
              background: 'rgba(37,99,235,.07)',
              border: '1px solid rgba(37,99,235,.18)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.07)'; }}
          >
            <span style={{ fontSize: 16 }}>🏆</span>
            <div className="min-w-0 flex-1">
              <div className="font-body" style={{ fontSize: 12, fontWeight: 600, color: '#60A5FA' }}>Criar perfil Organizador</div>
              <div className="font-body" style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Crie e gerencie ligas</div>
            </div>
            <ChevronRight size={14} style={{ color: '#4B5563' }} className="shrink-0" />
          </div>
        )}
        <div
          className="flex items-center gap-2.5 cursor-pointer mb-2"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,.08), rgba(239,68,68,.06))',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 12,
            padding: 12,
            transition: 'all .2s',
          }}
          onClick={() => navigate('/blader/profile')}
        >
          <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.nome || 'Blader'} className="w-full h-full rounded-full object-cover" style={{ border: '2px solid rgba(245,158,11,.5)' }} />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #B45309, #EF4444)', border: '2px solid rgba(245,158,11,.5)' }}>
                <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 14 }}>{initials}</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0" style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', border: '2px solid #080c18' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold truncate" style={{ fontSize: 13, color: '#E2E8F0' }}>
              {profile?.nome || 'Blader'}
            </p>
            <p style={{ fontSize: 11, color: '#FBBF24' }}>⚡ Blader</p>
          </div>
          <ChevronRight size={14} style={{ color: '#374151' }} className="shrink-0 ml-auto" />
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full cursor-pointer"
          style={{ padding: '8px 12px', borderRadius: 9, fontSize: 12, color: '#4B5563', transition: 'all .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(239,68,68,.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#4B5563'; e.currentTarget.style.background = ''; }}
        >
          <LogOut size={14} strokeWidth={1.4} />
          <span className="font-body">Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
