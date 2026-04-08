import { Home, Users, Crown, Clock, Settings, Swords, LogOut, Trophy, History, Star, Circle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { useAuth } from '@/contexts/AuthContext';
import { useLiga } from '@/contexts/LigaContext';
import LigaLogo from '@/components/LigaLogo';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const mainNav = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'Torneios', url: '/tournament', icon: Trophy, hasBadge: true },
  { title: 'Histórico', url: '/history', icon: Clock },
  { title: 'Rankings', url: '/rankings', icon: Star },
  { title: 'Bladers', url: '/players', icon: Users },
];

const secondaryNav = [
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const tournaments = useTournamentStore(s => s.tournaments);
  const upcomingCount = tournaments.filter(t => t.status === 'upcoming' || t.status === 'active').length;
  const { signOut, user } = useAuth();
  const { nomeLiga, logoUrl } = useLiga();

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/home' && location.pathname.startsWith(path));

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const renderNavItem = (item: typeof mainNav[0] & { hasBadge?: boolean }) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === '/home'}
            className={`group/nav relative flex items-center gap-3 rounded-[10px] transition-all duration-150
              ${collapsed ? 'justify-center px-2 py-2.5 mx-1' : 'px-4 py-[10px] mx-3'}
              ${active
                ? 'bg-[rgba(37,99,235,0.12)] text-[#60A5FA]'
                : 'text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-foreground'
              }`}
            activeClassName=""
            style={active && !collapsed ? { borderLeft: '3px solid #2563EB', paddingLeft: '13px' } : undefined}
          >
            <item.icon className={`shrink-0 transition-opacity duration-150 ${
              active ? 'text-[#60A5FA] opacity-100' : 'opacity-50 group-hover/nav:opacity-80'
            }`} style={{ width: 18, height: 18 }} />
            {!collapsed && (
              <>
                <span className={`flex-1 font-body tracking-wide ${
                  active ? 'font-semibold text-[#60A5FA]' : 'font-medium'
                }`} style={{ fontSize: 13 }}>
                  {item.title}
                </span>
                {item.hasBadge && upcomingCount > 0 && (
                  <span className="h-5 min-w-[22px] flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold px-1.5 border border-primary/25">
                    {upcomingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-[rgba(255,255,255,0.06)]" style={{ '--sidebar-width': '260px' } as React.CSSProperties}>
      <SidebarContent className="bg-[#0B1020] flex flex-col">
        {/* Top accent line */}
        <div className="h-[2px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />

        {/* Liga branding */}
        <div className={`shrink-0 ${collapsed ? 'flex justify-center py-5 px-2' : 'px-5 py-5'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={nomeLiga} className="w-10 h-10 rounded-full object-cover border-2 border-[#2563EB]/40" />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-[#2563EB]/40 bg-gradient-to-br from-[#2563EB]/20 to-[#7C3AED]/20 flex items-center justify-center">
                  <Swords className="h-5 w-5 text-[#2563EB]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-heading text-base font-bold text-white truncate leading-tight">{nomeLiga || 'Arena X'}</p>
                <p className="text-[11px] text-muted-foreground font-body">Organizador</p>
              </div>
            </div>
          ) : (
            <>
              {logoUrl ? (
                <img src={logoUrl} alt={nomeLiga} className="w-9 h-9 rounded-full object-cover border-2 border-[#2563EB]/40" />
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-[#2563EB]/40 bg-gradient-to-br from-[#2563EB]/20 to-[#7C3AED]/20 flex items-center justify-center">
                  <Swords className="h-4 w-4 text-[#2563EB]" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Separator */}
        <div className="mx-4 h-px bg-[rgba(255,255,255,0.06)] shrink-0" />

        {/* Main Navigation */}
        <SidebarGroup className="flex-1 pt-2">
          {!collapsed && (
            <SidebarGroupLabel className="font-heading text-[10px] tracking-[2px] text-muted-foreground/50 uppercase px-5 mt-4 mb-2">
              NAVEGAÇÃO
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-[2px]">
              {mainNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="mx-4 h-px bg-[rgba(255,255,255,0.06)] shrink-0" />

        {/* System */}
        <SidebarGroup className="shrink-0">
          {!collapsed && (
            <SidebarGroupLabel className="font-heading text-[10px] tracking-[2px] text-muted-foreground/50 uppercase px-5 mt-3 mb-2">
              SISTEMA
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-[2px] pb-2">
              {secondaryNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#0B1020] border-t border-[rgba(255,255,255,0.06)] p-4">
        {!collapsed ? (
          <div className="rounded-[10px] bg-[rgba(255,255,255,0.04)] p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full shrink-0 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-heading text-sm font-bold">
              {(nomeLiga || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-white truncate leading-tight">{nomeLiga || 'Organizador'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.1)] transition-all shrink-0"
                >
                  <LogOut style={{ width: 16, height: 16 }} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Sair</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-heading text-xs font-bold">
              {(nomeLiga || 'A')[0].toUpperCase()}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleLogout} className="text-muted-foreground hover:text-[#F87171] transition-colors p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.1)]">
                  <LogOut style={{ width: 14, height: 14 }} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
