import { Link, useLocation } from 'react-router-dom';
import beybladeXLogo from '@/assets/beyblade-x-logo.png';
import { Users, Trophy, Swords, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/players', label: 'Jogadores', icon: Users },
  { to: '/tournament', label: 'Torneio', icon: Trophy },
  { to: '/arena', label: 'Arena', icon: Swords },
];

export default function AppHeader() {
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={beybladeXLogo} alt="Beyblade X" className="h-10 w-auto" width={512} height={512} />
          <span className="font-heading text-xl font-bold text-primary hidden sm:block tracking-wider">
            TOURNAMENT HUB
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium font-heading tracking-wide transition-colors
                  ${active
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
