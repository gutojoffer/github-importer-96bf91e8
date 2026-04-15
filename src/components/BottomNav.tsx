import { useLocation, Link } from 'react-router-dom';
import { Home, Trophy, Star, Users, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'Torneios', url: '/tournament', icon: Trophy },
  { title: 'Rankings', url: '/rankings', icon: Star },
  { title: 'Bladers', url: '/players', icon: Users },
  { title: 'Config', url: '/settings', icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (url: string) =>
    url === '/home' ? location.pathname === '/home' : location.pathname.startsWith(url);

  return (
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
          <Link
            key={item.url}
            to={item.url}
            className="flex flex-col items-center gap-1 flex-1"
            style={{ padding: '8px 0', transition: 'all .15s' }}
          >
            <div className="relative flex flex-col items-center">
              <item.icon
                size={22}
                strokeWidth={1.6}
                style={{ color: active ? '#2563EB' : '#4B5563' }}
              />
              {active && (
                <div
                  style={{
                    width: 16,
                    height: 3,
                    borderRadius: 2,
                    background: '#2563EB',
                    marginTop: 2,
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: active ? '#60A5FA' : '#4B5563',
              }}
              className="font-heading"
            >
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
