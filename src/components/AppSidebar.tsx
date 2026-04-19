import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLiga } from '@/contexts/LigaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Home, Trophy, Clock, Star, Users, Settings, LogOut, ChevronRight, Shield, ChevronRight as ChevronRightIcon } from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'Torneios', url: '/tournament', icon: Trophy, badge: true },
  { title: 'Histórico', url: '/history', icon: Clock },
  { title: 'Rankings', url: '/rankings', icon: Star },
  { title: 'Bladers', url: '/players', icon: Users },
];

const SYSTEM_ITEMS = [
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomeLiga, logoUrl } = useLiga();
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  const { data: activeTournaments } = useQuery({
    queryKey: ['active-tournament-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['upcoming', 'active']);
      return count ?? 0;
    },
  });

  const isActive = (url: string) =>
    url === '/home' ? location.pathname === '/home' : location.pathname.startsWith(url);

  const initials = (nomeLiga || 'BX').slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside
      className="shrink-0 h-screen flex-col sticky top-0 hidden md:flex"
      style={{ width: 240, background: '#080c18', borderRight: '1px solid rgba(255,255,255,.06)' }}
    >
      {/* Accent line */}
      <div className="shrink-0" style={{ height: 2, background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 50%, transparent 100%)' }} />

      {/* Logo area */}
      <div className="flex items-center gap-2.5" style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)', border: '1px solid rgba(37,99,235,.4)' }}
        >
          <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 14 }}>BX</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-bold text-white leading-tight" style={{ fontSize: 18, letterSpacing: 0.5 }}>
            BLADE<span style={{ color: '#60A5FA' }}>X</span>
          </span>
          <span className="font-body uppercase leading-tight" style={{ fontSize: 9, color: 'rgba(37,99,235,.8)', letterSpacing: 1.5 }}>
            Tournament Hub
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
                  borderLeft: active ? '3px solid #2563EB' : '3px solid transparent',
                  background: active ? 'linear-gradient(90deg, rgba(37,99,235,.15), rgba(37,99,235,.05))' : undefined,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = '';
                  }
                }}
              >
                <item.icon
                  size={18}
                  strokeWidth={1.4}
                  className="shrink-0"
                  style={{ color: active ? '#60A5FA' : '#64748B', opacity: active ? 1 : 0.35 }}
                />
                <span
                  className="font-body flex-1"
                  style={{ fontSize: 13, color: active ? '#60A5FA' : '#64748B', fontWeight: active ? 700 : 500 }}
                >
                  {item.title}
                </span>
                {item.badge && activeTournaments ? (
                  <span
                    className="font-bold px-[7px] py-[2px] rounded-lg ml-auto"
                    style={{ fontSize: 10, background: 'rgba(37,99,235,.2)', color: '#60A5FA', border: '1px solid rgba(37,99,235,.3)' }}
                  >
                    {activeTournaments}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)', margin: '8px 16px' }} />

        {/* System section */}
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
                  borderLeft: active ? '3px solid #2563EB' : '3px solid transparent',
                  background: active ? 'linear-gradient(90deg, rgba(37,99,235,.15), rgba(37,99,235,.05))' : undefined,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = '';
                  }
                }}
              >
                <item.icon
                  size={18}
                  strokeWidth={1.4}
                  className="shrink-0"
                  style={{ color: active ? '#60A5FA' : '#64748B', opacity: active ? 1 : 0.35 }}
                />
                <span
                  className="font-body flex-1"
                  style={{ fontSize: 13, color: active ? '#60A5FA' : '#64748B', fontWeight: active ? 700 : 500 }}
                >
                  {item.title}
                </span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className="relative flex items-center gap-3"
              style={{
                padding: isActive('/admin') ? '10px 14px 10px 11px' : '10px 14px',
                borderRadius: 10,
                margin: '1px 8px',
                borderLeft: isActive('/admin') ? '3px solid #2563EB' : '3px solid transparent',
                background: isActive('/admin') ? 'linear-gradient(90deg, rgba(37,99,235,.15), rgba(37,99,235,.05))' : undefined,
                transition: 'all .15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive('/admin')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/admin')) {
                  e.currentTarget.style.background = '';
                }
              }}
            >
              <Shield
                size={18}
                strokeWidth={1.4}
                className="shrink-0"
                style={{ color: isActive('/admin') ? '#60A5FA' : '#64748B', opacity: isActive('/admin') ? 1 : 0.35 }}
              />
              <span
                className="font-body flex-1"
                style={{ fontSize: 13, color: isActive('/admin') ? '#60A5FA' : '#64748B', fontWeight: isActive('/admin') ? 700 : 500 }}
              >
                Admin
              </span>
            </Link>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="shrink-0" style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.05)', marginTop: 'auto' }}>
        {/* User card */}
        <div
          className="flex items-center gap-2.5 cursor-pointer mb-2"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,.08), rgba(124,58,237,.06))',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 12,
            padding: 12,
            transition: 'all .2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37,99,235,.14), rgba(124,58,237,.1))';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.14)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37,99,235,.08), rgba(124,58,237,.06))';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)';
          }}
          onClick={() => navigate('/settings')}
        >
          <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nomeLiga}
                className="w-full h-full rounded-full object-cover"
                style={{ border: '2px solid rgba(37,99,235,.5)' }}
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)', border: '2px solid rgba(37,99,235,.5)' }}
              >
                <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 14 }}>
                  {initials}
                </span>
              </div>
            )}
            <div
              className="absolute bottom-0 right-0"
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', border: '2px solid #080c18' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold truncate" style={{ fontSize: 13, color: '#E2E8F0' }}>
              {nomeLiga || 'Minha Liga'}
            </p>
            <p style={{ fontSize: 11, color: '#10B981' }}>● {isAdmin ? 'Administrador' : 'Organizador'}</p>
          </div>
          <ChevronRight size={14} style={{ color: '#374151' }} className="shrink-0 ml-auto" />
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full cursor-pointer"
          style={{ padding: '8px 12px', borderRadius: 9, fontSize: 12, color: '#4B5563', transition: 'all .15s' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#F87171';
            e.currentTarget.style.background = 'rgba(239,68,68,.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#4B5563';
            e.currentTarget.style.background = '';
          }}
        >
          <LogOut size={14} strokeWidth={1.4} />
          <span className="font-body">Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
