import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Trophy, Clock, Star, User } from 'lucide-react';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import BladerAvatar from '@/components/BladerAvatar';
import ProfileSwitcherSheet from '@/components/ProfileSwitcherSheet';

const NAV_ITEMS = [
  { title: 'Home', url: '/blader/home', icon: Home },
  { title: 'Torneios', url: '/blader/tournaments', icon: Trophy },
  { title: 'Histórico', url: '/blader/history', icon: Clock },
  { title: 'Rankings', url: '/blader/rankings', icon: Star },
];

export function BladerBottomNav() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { mode, perfis } = useActiveMode();
  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + '/');

  const showingBlader = mode === 'blader';
  const bladerAvatar = perfis.dadosBlader?.avatar || null;
  const bladerName = perfis.dadosBlader?.nome || 'Blader';
  const bladerColor = perfis.dadosBlader?.corPerfil || undefined;
  const orgLogo = perfis.dadosOrganizador?.logo || null;
  const orgName = perfis.dadosOrganizador?.nomeLiga || 'Liga';

  const accent = showingBlader ? '#F59E0B' : '#2563EB';
  const accentText = showingBlader ? '#FBBF24' : '#60A5FA';

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around md:hidden"
        style={{
          height: 64,
          background: 'rgba(8,12,24,.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.url);
          return (
            <Link key={item.url} to={item.url} className="flex flex-col items-center gap-1 flex-1" style={{ padding: '8px 0' }}>
              <div className="relative flex flex-col items-center">
                <item.icon size={22} strokeWidth={1.6} style={{ color: active ? '#F59E0B' : '#4B5563' }} />
                {active && <div style={{ width: 16, height: 3, borderRadius: 2, background: '#F59E0B', marginTop: 2 }} />}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: active ? '#FBBF24' : '#4B5563' }} className="font-heading">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* Profile switcher trigger */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center gap-1 flex-1"
          style={{ padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Trocar perfil"
        >
          <div className="relative flex flex-col items-center">
            {showingBlader && bladerAvatar ? (
              <BladerAvatar url={bladerAvatar} name={bladerName} colorKey={bladerColor} size={24} borderWidth={1} />
            ) : !showingBlader && orgLogo ? (
              <img src={orgLogo} alt={orgName} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${accent}` }} />
            ) : (
              <User size={22} strokeWidth={1.6} style={{ color: accent }} />
            )}
            {sheetOpen && <div style={{ width: 16, height: 3, borderRadius: 2, background: accent, marginTop: 2 }} />}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: accentText }} className="font-heading">
            Perfil
          </span>
        </button>
      </nav>

      <ProfileSwitcherSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
