import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLiga } from '@/contexts/LigaContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Settings, LogOut, LayoutGrid } from 'lucide-react';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = (nomeLiga || 'BX').slice(0, 2).toUpperCase();

  // Close dropdown on outside click
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
        background: '#0a0d18',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        padding: '0 24px',
      }}
    >
      {/* Left — Breadcrumb */}
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

      {/* Center — Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <img src="/logo-bladex.png" alt="BLADEX" style={{ height: 36, width: 'auto', objectFit: 'contain', mixBlendMode: 'screen' }} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="flex items-center justify-center shrink-0 transition-all duration-150"
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: '1px solid rgba(255,255,255,.08)',
            color: '#64748B',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,.06)';
            e.currentTarget.style.color = '#E2E8F0';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748B';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)';
          }}
        >
          <Search size={16} strokeWidth={1.4} />
        </button>

        {/* Notifications */}
        <button
          className="flex items-center justify-center shrink-0 relative transition-all duration-150"
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: '1px solid rgba(255,255,255,.08)',
            color: '#64748B',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,.06)';
            e.currentTarget.style.color = '#E2E8F0';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748B';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)';
          }}
        >
          <Bell size={16} strokeWidth={1.4} />
          {/* Notification dot */}
          <div className="absolute" style={{
            top: 6, right: 6,
            width: 6, height: 6, borderRadius: '50%',
            background: '#EF4444', border: '1.5px solid #0a0d18',
          }} />
        </button>

        {/* User pill */}
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
              <img src={logoUrl} alt={nomeLiga} className="shrink-0 rounded-full object-cover" style={{ width: 30, height: 30 }} />
            ) : (
              <div className="shrink-0 rounded-full flex items-center justify-center" style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
              }}>
                <span className="font-heading text-[12px] font-bold text-white leading-none select-none">{initials}</span>
              </div>
            )}
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[12px] font-semibold" style={{ color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{nomeLiga || 'Liga'}</span>
              <span className="text-[10px]" style={{ color: '#64748B' }}>Organizador</span>
            </div>
            <ChevronDown size={12} style={{ color: '#4B5563' }} className="shrink-0" />
          </button>

          {/* Dropdown */}
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
                className="flex items-center gap-2.5 w-full rounded-lg transition-all duration-150 font-body text-[13px]"
                style={{ padding: '8px 10px', color: '#9CA3AF' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#E2E8F0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
              >
                <Settings size={14} strokeWidth={1.4} />
                Configurações
              </button>
              <button
                onClick={() => { setDropdownOpen(false); handleSignOut(); }}
                className="flex items-center gap-2.5 w-full rounded-lg transition-all duration-150 font-body text-[13px]"
                style={{ padding: '8px 10px', color: '#9CA3AF' }}
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
