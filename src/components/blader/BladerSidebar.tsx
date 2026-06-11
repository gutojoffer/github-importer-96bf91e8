import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { Home, Trophy, Clock, Star, User, Settings, LogOut, ChevronRight, Wrench, Bell, Building2, Users, Rss, Swords } from 'lucide-react';
import BladerAvatar from '@/components/BladerAvatar';
import { getBladerPalette } from '@/lib/bladerColors';
import { useNotificacoesNaoLidas } from '@/hooks/useNotificacoesNaoLidas';
import { useConvitesTimePendentes } from '@/hooks/useTimes';
import { useDesafiosTorreXPendentes } from '@/hooks/useDesafiosTorreXPendentes';
import { AmigosSidebar } from './AmigosSidebar';

const NAV_ITEMS = [
  { title: 'Home', url: '/blader/home', icon: Home },
  { title: 'Torneios', url: '/blader/tournaments', icon: Trophy },
  { title: 'Torre X', url: '/blader/torre-x', icon: Building2 },
  { title: 'Meus desafios', url: '/blader/torre-x/desafios', icon: Swords, showDesafiosBadge: true },
  { title: 'Feed', url: '/blader/feed', icon: Rss },
  { title: 'Meu histórico', url: '/blader/history', icon: Clock },
  { title: 'Rankings', url: '/blader/rankings', icon: Star },
  { title: 'Times', url: '/blader/times', icon: Users, showTimesBadge: true },
  { title: 'Notificações', url: '/blader/notificacoes', icon: Bell, showBadge: true },
];

const ESPACO_ITEMS = [
  { title: 'ForjaBey', url: '/blader/forjabey', icon: Wrench },
  { title: 'Meu perfil', url: '/blader/profile', icon: User },
];

const SYSTEM_ITEMS = [
  { title: 'Configurações', url: '/blader/settings', icon: Settings },
];

export function BladerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const { perfis, setMode } = useActiveMode();
  const naoLidas = useNotificacoesNaoLidas();
  const convitesTime = useConvitesTimePendentes();
  const desafiosPend = useDesafiosTorreXPendentes();

  const bladerName = perfis.dadosBlader?.nome || profile?.nomeBlader || 'Blader';
  const bladerAvatar = perfis.dadosBlader?.avatar || profile?.avatarBladerUrl || null;
  const bladerColor = perfis.dadosBlader?.corPerfil || profile?.corPerfil;

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + '/');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleOrgCardClick = () => {
    if (perfis.temOrganizador) {
      setMode('organizador');
      navigate('/home');
    } else {
      navigate('/criar-perfil-organizador');
    }
  };

  return (
    <aside
      className="shrink-0 h-screen flex-col sticky top-0 hidden md:flex"
      style={{ width: 240, background: '#080c18', borderRight: '1px solid rgba(255,255,255,.06)' }}
    >
      <style>{`
        .blader-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .blader-sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .blader-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .blader-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
        }
        .blader-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>

      <div className="shrink-0" style={{ height: 2, background: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 50%, transparent 100%)' }} />

      <div className="flex items-center gap-2.5" style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div className="flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #B45309, #F59E0B)', border: '1px solid rgba(245,158,11,.4)' }}>
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

      <div className="flex-1 overflow-y-auto blader-sidebar-scroll">
        <div style={{ padding: '16px 16px 6px' }}>
          <span className="font-body font-bold uppercase" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.55)' }}>NAVEGAÇÃO</span>
        </div>

        <nav className="flex flex-col gap-px">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.url} to={item.url}
                className="relative flex items-center gap-3"
                style={{
                  padding: active ? '10px 14px 10px 11px' : '10px 14px',
                  borderRadius: 10, margin: '1px 8px',
                  borderLeft: active ? '3px solid #F59E0B' : '3px solid transparent',
                  background: active ? 'linear-gradient(90deg, rgba(245,158,11,.15), rgba(245,158,11,.05))' : undefined,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
              >
                <item.icon size={18} strokeWidth={1.4} className="shrink-0" style={{ color: active ? '#FBBF24' : '#64748B', opacity: active ? 1 : 0.35 }} />
                <span className="font-body flex-1" style={{ fontSize: 13, color: active ? '#FBBF24' : '#64748B', fontWeight: active ? 700 : 500 }}>{item.title}</span>
                {(item as any).showBadge && naoLidas > 0 && (
                  <span
                    className="font-body shrink-0"
                    style={{
                      minWidth: 18, height: 18, padding: '0 5px',
                      borderRadius: 999, background: '#EF4444',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1,
                    }}
                  >
                    {naoLidas > 99 ? '99+' : naoLidas}
                  </span>
                )}
                {(item as any).showTimesBadge && convitesTime > 0 && (
                  <span
                    className="font-body shrink-0"
                    style={{
                      minWidth: 18, height: 18, padding: '0 5px',
                      borderRadius: 999, background: '#00DCFF',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#020617', lineHeight: 1,
                    }}
                  >
                    {convitesTime > 99 ? '99+' : convitesTime}
                  </span>
                )}
                {(item as any).isNew && (
                  <span
                    className="font-body shrink-0"
                    style={{
                      padding: '1px 6px', borderRadius: 5,
                      background: 'rgba(16,185,129,.12)',
                      border: '1px solid rgba(16,185,129,.2)',
                      color: '#34D399', fontSize: 8, fontWeight: 700, letterSpacing: 1,
                    }}
                  >
                    NOVO
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)', margin: '8px 16px' }} />

        <div style={{ padding: '4px 16px 6px' }}>
          <span className="font-body font-bold uppercase" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.55)' }}>MEU ESPAÇO</span>
        </div>
        <nav className="flex flex-col gap-px">
          {ESPACO_ITEMS.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.url} to={item.url}
                className="relative flex items-center gap-3"
                style={{
                  padding: active ? '10px 14px 10px 11px' : '10px 14px',
                  borderRadius: 10, margin: '1px 8px',
                  borderLeft: active ? '3px solid #F59E0B' : '3px solid transparent',
                  background: active ? 'linear-gradient(90deg, rgba(245,158,11,.15), rgba(245,158,11,.05))' : undefined,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
              >
                <item.icon size={18} strokeWidth={1.4} className="shrink-0" style={{ color: active ? '#FBBF24' : '#64748B', opacity: active ? 1 : 0.35 }} />
                <span className="font-body flex-1" style={{ fontSize: 13, color: active ? '#FBBF24' : '#64748B', fontWeight: active ? 700 : 500 }}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)', margin: '8px 16px' }} />

        <div style={{ padding: '4px 16px 6px' }}>
          <span className="font-body font-bold uppercase" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.55)' }}>SISTEMA</span>
        </div>
        <nav className="flex flex-col gap-px">
          {SYSTEM_ITEMS.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.url} to={item.url}
                className="relative flex items-center gap-3"
                style={{
                  padding: active ? '10px 14px 10px 11px' : '10px 14px',
                  borderRadius: 10, margin: '1px 8px',
                  borderLeft: active ? '3px solid #F59E0B' : '3px solid transparent',
                  background: active ? 'linear-gradient(90deg, rgba(245,158,11,.15), rgba(245,158,11,.05))' : undefined,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
              >
                <item.icon size={18} strokeWidth={1.4} className="shrink-0" style={{ color: active ? '#FBBF24' : '#64748B', opacity: active ? 1 : 0.35 }} />
                <span className="font-body flex-1" style={{ fontSize: 13, color: active ? '#FBBF24' : '#64748B', fontWeight: active ? 700 : 500 }}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '6px 12px 4px', marginTop: 2 }}>
          <a
            href="/ranking"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8,
              color: 'rgba(255,255,255,.3)',
              textDecoration: 'none', fontSize: 11,
              transition: 'color .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.3)'; }}
          >
            <span style={{ fontSize: 13 }}>🌐</span>
            <span>Ver site público</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,.2)' }}>↗</span>
          </a>
        </div>

        <AmigosSidebar />
      </div>

      {/* Footer */}
      <div className="shrink-0" style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.05)', marginTop: 'auto' }}>
        {/* Org card: switch or create */}
        {!perfis.loading && (
          <div
            onClick={handleOrgCardClick}
            className="cursor-pointer transition-all duration-150 mb-2"
            style={perfis.temOrganizador ? {
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 13px',
              background: 'linear-gradient(135deg, rgba(37,99,235,.08), rgba(124,58,237,.06))',
              border: '1px solid rgba(37,99,235,.15)',
              borderRadius: 12,
            } : {
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 13px',
              background: 'rgba(37,99,235,.06)',
              border: '1px dashed rgba(37,99,235,.2)',
              borderRadius: 12,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = perfis.temOrganizador ? 'linear-gradient(135deg, rgba(37,99,235,.14), rgba(124,58,237,.1))' : 'rgba(37,99,235,.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = perfis.temOrganizador ? 'linear-gradient(135deg, rgba(37,99,235,.08), rgba(124,58,237,.06))' : 'rgba(37,99,235,.06)'; }}
          >
            {perfis.temOrganizador && perfis.dadosOrganizador ? (
              <>
                <div className="relative shrink-0">
                  {perfis.dadosOrganizador.logo ? (
                    <img src={perfis.dadosOrganizador.logo} alt={perfis.dadosOrganizador.nomeLiga || 'Minha Liga'} className="rounded-full object-cover" style={{ width: 36, height: 36, border: '2px solid rgba(37,99,235,.5)' }} />
                  ) : (
                    <div className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)', border: '2px solid rgba(37,99,235,.5)' }}>
                      <span className="font-heading font-bold text-white leading-none select-none" style={{ fontSize: 14 }}>{(perfis.dadosOrganizador.nomeLiga || 'BX').slice(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5" style={{ width: 14, height: 14, borderRadius: '50%', background: '#2563EB', border: '2px solid #080c18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>🏆</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body truncate" style={{ fontSize: 13, fontWeight: 600, color: '#60A5FA' }}>{perfis.dadosOrganizador.nomeLiga || 'Minha Liga'}</div>
                  <div className="font-body" style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>🏆 Trocar para Organizador</div>
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: 20 }}>🏆</span>
                <div className="flex-1 min-w-0">
                  <div className="font-body" style={{ fontSize: 12, fontWeight: 600, color: '#60A5FA' }}>Criar perfil Organizador</div>
                  <div className="font-body" style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>Crie e gerencie ligas</div>
                </div>
              </>
            )}
            <ChevronRight size={14} style={{ color: '#4B5563' }} className="shrink-0" />
          </div>
        )}

        {/* Blader user card */}
        <div
          className="flex items-center gap-2.5 cursor-pointer mb-2"
          style={{
            background: `linear-gradient(135deg, ${getBladerPalette(bladerColor).from}22, ${getBladerPalette(bladerColor).to}11)`,
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 12, padding: 12, transition: 'all .2s',
          }}
          onClick={() => navigate('/blader/profile')}
        >
          <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
            <BladerAvatar
              url={bladerAvatar}
              name={bladerName}
              colorKey={bladerColor}
              size={38}
              borderWidth={2}
            />
            <div className="absolute bottom-0 right-0" style={{ width: 8, height: 8, borderRadius: '50%', background: getBladerPalette(bladerColor).accent, border: '2px solid #080c18' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold truncate" style={{ fontSize: 13, color: '#E2E8F0' }}>{bladerName}</p>
            <p style={{ fontSize: 11, color: getBladerPalette(bladerColor).accent }}>⚡ Blader</p>
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
