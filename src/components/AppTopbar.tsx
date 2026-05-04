import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLiga } from '@/contexts/LigaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, LayoutGrid, Repeat } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import BladerAvatar from '@/components/BladerAvatar';
import SinoNotificacoes from '@/components/SinoNotificacoes';

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
  const { profile } = useUserProfile();
  const { mode, perfis, setMode } = useActiveMode();
  const isMobile = useIsMobile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasDual = perfis.temBlader && perfis.temOrganizador;
  const currentMode: 'organizador' | 'blader' = mode ?? (profile?.tipoConta ?? 'organizador');

  const bladerName = perfis.dadosBlader?.nome || profile?.nomeBlader || 'Blader';
  const bladerAvatar = perfis.dadosBlader?.avatar || profile?.avatarBladerUrl || null;
  const bladerColor = perfis.dadosBlader?.corPerfil || profile?.corPerfil;
  const organizerName = perfis.dadosOrganizador?.nomeLiga || nomeLiga || 'Liga';
  const organizerLogo = perfis.dadosOrganizador?.logo || logoUrl || null;

  const handleSwitchMode = () => {
    const target: 'organizador' | 'blader' = currentMode === 'organizador' ? 'blader' : 'organizador';
    if ((target === 'blader' && !perfis.temBlader) || (target === 'organizador' && !perfis.temOrganizador)) return;
    setMode(target);
    setDropdownOpen(false);
    navigate(target === 'organizador' ? '/home' : '/blader/home');
  };

  const initials = organizerName.slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string; active: boolean }[] = [];
  let accumulated = '';
  pathParts.forEach((part, i) => {
    accumulated += `/${part}`;
    const mapped = BREADCRUMB_MAP[accumulated];
    const isLast = i === pathParts.length - 1;
    if (mapped) breadcrumbs.push({ label: mapped, path: accumulated, active: isLast });
    else if (i > 0 && pathParts[i - 1] === 'history') breadcrumbs.push({ label: 'Resultado', path: accumulated, active: isLast });
  });
  if (breadcrumbs.length === 0) breadcrumbs.push({ label: 'Home', path: '/home', active: true });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = currentMode === 'blader' ? bladerName : organizerName;

  return (
    <header
      className="relative flex items-center shrink-0 sticky top-0 z-50"
      style={{ height: 56, background: '#080c18', borderBottom: '1px solid rgba(255,255,255,.06)', padding: isMobile ? '0 16px' : '0 24px', gap: 16 }}
    >
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
                <Link to={bc.path} className="font-body truncate transition-colors duration-150 hover:text-[#E2E8F0]" style={{ color: '#4B5563' }}>{bc.label}</Link>
              )}
            </span>
          ))}
        </nav>
      )}

      {!isMobile && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          {organizerLogo ? (
            <img src={organizerLogo} alt={organizerName} className="shrink-0 object-cover" style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(37,99,235,.3)' }} />
          ) : (
            <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1e3a8a, #2563EB)', border: '1px solid rgba(37,99,235,.3)' }}>
              <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 11 }}>BX</span>
            </div>
          )}
          <span className="font-heading font-bold leading-none" style={{ fontSize: 14, letterSpacing: 0.3 }}>
            {perfis.temOrganizador ? <span className="text-white">{organizerName}</span> : <span className="text-white">BLADE<span style={{ color: '#60A5FA' }}>X</span></span>}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {currentMode === 'blader' && <SinoNotificacoes />}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 transition-all duration-150"
            style={isMobile ? { padding: 4, background: 'transparent', border: 'none', borderRadius: '50%', width: 36, height: 36 } : {
              padding: '5px 10px 5px 5px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 20, maxWidth: 200,
            }}
            onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.background = 'rgba(255,255,255,.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.16)'; } }}
            onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.09)'; } }}
          >
            {currentMode === 'blader' ? (
              <BladerAvatar url={bladerAvatar} name={bladerName} colorKey={bladerColor} size={isMobile ? 32 : 28} borderWidth={1} />
            ) : organizerLogo ? (
              <img src={organizerLogo} alt={organizerName} className="shrink-0 rounded-full object-cover" style={{ width: isMobile ? 32 : 28, height: isMobile ? 32 : 28 }} />
            ) : (
              <div className="shrink-0 rounded-full flex items-center justify-center" style={{ width: isMobile ? 32 : 28, height: isMobile ? 32 : 28, background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)' }}>
                <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 11 }}>{initials}</span>
              </div>
            )}
            {!isMobile && (
              <>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="font-semibold" style={{ fontSize: 12, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748B' }}>
                    {currentMode === 'blader' ? '⚡ Blader' : (isAdmin ? 'Administrador' : 'Organizador')}
                  </span>
                </div>
                <ChevronDown size={12} style={{ color: '#4B5563' }} className="shrink-0" />
              </>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 z-50"
              style={{ background: '#141928', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: 6, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
            >
              {hasDual && (
                <button
                  onClick={handleSwitchMode}
                  className="flex items-center gap-2.5 w-full rounded-lg transition-all duration-150 font-body"
                  style={{ padding: '8px 10px', fontSize: 13, color: '#9CA3AF' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.08)'; e.currentTarget.style.color = '#60A5FA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                >
                  <Repeat size={14} strokeWidth={1.4} />
                  Entrar como {currentMode === 'organizador' ? 'Blader' : 'Organizador'}
                </button>
              )}

              {!perfis.temBlader && currentMode === 'organizador' && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 4px' }} />
                  <div
                    onClick={() => { setDropdownOpen(false); navigate('/criar-perfil-blader'); }}
                    className="flex items-center gap-2.5 cursor-pointer transition-all duration-150"
                    style={{ padding: '10px 12px', borderRadius: 10, margin: '2px 2px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.15)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,.14)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,.08)'; }}
                  >
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-body" style={{ fontSize: 13, fontWeight: 600, color: '#FCD34D' }}>Criar perfil de Blader</div>
                      <div className="font-body" style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Participe de torneios também</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 4px' }} />
                </>
              )}
              {!perfis.temOrganizador && currentMode === 'blader' && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 4px' }} />
                  <div
                    onClick={() => { setDropdownOpen(false); navigate('/criar-perfil-organizador'); }}
                    className="flex items-center gap-2.5 cursor-pointer transition-all duration-150"
                    style={{ padding: '10px 12px', borderRadius: 10, margin: '2px 2px', background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.15)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.14)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,.08)'; }}
                  >
                    <span style={{ fontSize: 18 }}>🏆</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-body" style={{ fontSize: 13, fontWeight: 600, color: '#60A5FA' }}>Criar perfil de Organizador</div>
                      <div className="font-body" style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Crie e gerencie suas ligas</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 4px' }} />
                </>
              )}
              <button
                onClick={() => { setDropdownOpen(false); navigate(currentMode === 'blader' ? '/blader/settings' : '/settings'); }}
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
