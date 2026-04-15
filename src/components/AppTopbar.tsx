import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLiga } from '@/contexts/LigaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, LayoutGrid } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const BREADCRUMB_MAP: Record<string, string> = {
  '/home': 'Home',
  '/tournament': 'Torneios',
  '/history': 'Histórico',
  '/rankings': 'Rankings',
  '/players': 'Bladers',
  '/settings': 'Configurações',
};

export function AppTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomeLiga, logoUrl } = useLiga();
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = (nomeLiga || 'BX').slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Build breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string; active: boolean }[] = [];
  let accumulated = '';
  pathParts.forEach((part, i) => {
    accumulated += `/${part}`;
    const mapped = BREADCRUMB_MAP[accumulated];
    const isLast = i === pathParts.length - 1;
    if (mapped) {
      breadcrumbs.push({ label: mapped, path: accumulated, active: isLast });
    } else if (i > 0 && pathParts[i - 1] === 'history') {
      breadcrumbs.push({ label: 'Resultado', path: accumulated, active: isLast });
    }
  });
  if (breadcrumbs.length === 0) {
    breadcrumbs.push({ label: 'Home', path: '/home', active: true });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header
      className="relative flex items-center shrink-0 sticky top-0 z-50"
      style={{
        height: 56,
        background: '#080c18',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        padding: isMobile ? '0 16px' : '0 24px',
        gap: 16,
      }}
    >
      {/* Left — Breadcrumb (hidden on mobile) / Logo on mobile */}
      {isMobile ? (
        <div className="flex items-center gap-2 flex-1">
          <span className="font-heading font-bold text-white leading-tight" style={{ fontSize: 16, letterSpacing: 0.5 }}>
            BLADE<span style={{ color: '#60A5FA' }}>X</span>
          </span>
        </div>
      ) : (
        <nav className="flex items-center gap-1.5 flex-1 min-w-0" style={{ fontSize: 13 }}>
          <LayoutGrid size={14} style={{ color: '#374151' }} className="shrink-0 mr-0.5" />
          {breadcrumbs.map((bc, i) => (
            <span key={bc.path} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span style={{ color: '#374151' }} className="text-xs">/</span>}
              {bc.active ? (
                <span className="font-body font-semibold truncate" style={{ color: '#F1F5F9' }}>{bc.label}</span>
              ) : (
                <Link to={bc.path} className="font-body truncate transition-colors duration-150 hover:text-[#E2E8F0]" style={{ color: '#4B5563' }}>
                  {bc.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Center — Liga identity (hidden on mobile) */}
      {!isMobile && (
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={nomeLiga}
            className="shrink-0 object-cover"
            style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(37,99,235,.3)' }}
          />
        ) : (
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #1e3a8a, #2563EB)',
              border: '1px solid rgba(37,99,235,.3)',
            }}
          >
            <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 11 }}>BX</span>
          </div>
        )}
        <span className="font-heading font-bold leading-none" style={{ fontSize: 14, letterSpacing: 0.3 }}>
          {nomeLiga ? (
            <span className="text-white">{nomeLiga}</span>
          ) : (
            <span className="text-white">BLADE<span style={{ color: '#60A5FA' }}>X</span></span>
          )}
        </span>
      </div>

      {/* Right — User pill only */}
      <div className="flex items-center">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 transition-all duration-150"
            style={{
              padding: '5px 10px 5px 5px',
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.09)',
              borderRadius: 20,
              maxWidth: 200,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.09)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.09)';
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={nomeLiga} className="shrink-0 rounded-full object-cover" style={{ width: 28, height: 28 }} />
            ) : (
              <div
                className="shrink-0 rounded-full flex items-center justify-center"
                style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)' }}
              >
                <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 11 }}>{initials}</span>
              </div>
            )}
            <div className="flex flex-col text-left overflow-hidden">
              <span
                className="font-semibold"
                style={{ fontSize: 12, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}
              >
                {nomeLiga || 'Liga'}
              </span>
              <span style={{ fontSize: 10, color: '#64748B' }}>{isAdmin ? 'Administrador' : 'Organizador'}</span>
            </div>
            <ChevronDown size={12} style={{ color: '#4B5563' }} className="shrink-0" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 z-50"
              style={{
                background: '#141928',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 10,
                padding: 6,
                minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                className="flex items-center gap-2.5 w-full rounded-lg transition-all duration-150 font-body"
                style={{ padding: '8px 10px', fontSize: 13, color: '#9CA3AF' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#E2E8F0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
              >
                <Settings size={14} strokeWidth={1.4} />
                Configurações
              </button>
              <button
                onClick={() => { setDropdownOpen(false); handleSignOut(); }}
                className="flex items-center gap-2.5 w-full rounded-lg transition-all duration-150 font-body"
                style={{ padding: '8px 10px', fontSize: 13, color: '#9CA3AF' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,.06)'; e.currentTarget.style.color = '#F87171'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
              >
                <LogOut size={14} strokeWidth={1.4} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
