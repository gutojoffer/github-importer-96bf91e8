import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLiga } from '@/contexts/LigaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Home, Trophy, Clock, Star, Users, Settings, LogOut, ChevronRight, Shield } from 'lucide-react';

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

  function NavItem({ item }: { item: typeof NAV_ITEMS[0] }) {
    const active = isActive(item.url);
    return (
      <Link
        key={item.url}
        to={item.url}
        className="relative flex items-center gap-2.5 mx-0.5 rounded-[9px] transition-all duration-150"
        style={{
          padding: '9px 12px',
          background: active ? 'rgba(37,99,235,.10)' : undefined,
          border: `1px solid ${active ? 'rgba(37,99,235,.20)' : 'transparent'}`,
        }}
        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.05)'; } }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; } }}
      >
        {active && <div className="absolute left-0 rounded-r-[3px]" style={{ top: '20%', bottom: '20%', width: 3, background: '#2563EB' }} />}
        <item.icon size={18} strokeWidth={1.4} className="shrink-0" style={{ color: active ? '#60A5FA' : '#64748B', opacity: active ? 1 : 0.4 }} />
        <span className="font-body text-[13px] flex-1" style={{ color: active ? '#60A5FA' : '#64748B', fontWeight: active ? 600 : 500 }}>{item.title}</span>
        {'badge' in item && item.badge && activeTournaments ? (
          <span className="text-[10px] font-bold px-[7px] py-[2px] rounded-lg" style={{ background: 'rgba(37,99,235,.2)', color: '#60A5FA', border: '1px solid rgba(37,99,235,.3)' }}>{activeTournaments}</span>
        ) : null}
      </Link>
    );
  }

  return (
    <aside className="w-[248px] shrink-0 h-screen flex flex-col sticky top-0" style={{ background: '#0a0d18', borderRight: '1px solid rgba(255,255,255,.06)' }}>
      <div className="h-[2px] shrink-0" style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED, transparent)' }} />

      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div className="flex items-center justify-center shrink-0" style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)', border: '1px solid rgba(37,99,235,.4)' }}>
          <span className="font-heading text-[16px] font-bold text-white leading-none select-none">BX</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-heading text-[15px] font-bold text-white tracking-[0.5px] leading-tight">BLADE<span style={{ color: '#60A5FA' }}>X</span></span>
          <span className="text-[10px] uppercase tracking-[1px] font-body leading-tight" style={{ color: '#2563EB' }}>Tournament Hub</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        <div className="px-2 pt-2.5 pb-1.5">
          <span className="text-[9px] uppercase tracking-[2px] font-body font-semibold" style={{ color: '#374151' }}>NAVEGAÇÃO</span>
        </div>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => <NavItem key={item.url} item={item} />)}
        </nav>

        <div className="mx-2.5 my-1.5" style={{ height: 1, background: 'rgba(255,255,255,.05)' }} />

        <div className="px-2 pt-1 pb-1.5">
          <span className="text-[9px] uppercase tracking-[2px] font-body font-semibold" style={{ color: '#374151' }}>SISTEMA</span>
        </div>
        <nav className="space-y-0.5">
          {SYSTEM_ITEMS.map((item) => <NavItem key={item.url} item={item} />)}
          {isAdmin && <NavItem item={{ title: 'Admin', url: '/admin', icon: Shield }} />}
        </nav>
      </div>

      <div className="shrink-0" style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div
          className="flex items-center gap-2.5 cursor-pointer transition-all duration-150 mb-2"
          style={{ padding: '12px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.14)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
          onClick={() => navigate('/settings')}
        >
          <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
            {logoUrl ? (
              <img src={logoUrl} alt={nomeLiga} className="w-full h-full rounded-full object-cover" style={{ border: '2px solid rgba(37,99,235,.4)' }} />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)', border: '2px solid rgba(37,99,235,.4)' }}>
                <span className="font-heading text-[14px] font-bold text-white leading-none select-none">{initials}</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', border: '2px solid #0a0d18' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: '#E2E8F0' }}>{nomeLiga || 'Minha Liga'}</p>
            <p className="text-[11px]" style={{ color: '#10B981' }}>● Organizador</p>
          </div>
          <ChevronRight size={14} style={{ color: '#374151' }} className="shrink-0 ml-auto" />
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full rounded-lg cursor-pointer transition-all duration-150"
          style={{ padding: '7px 14px', color: '#4B5563', fontSize: 12, fontWeight: 500 }}
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
