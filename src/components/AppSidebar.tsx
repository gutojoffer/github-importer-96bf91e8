import { Home, Users, Crown, Clock, Settings, Swords, LogOut, Trophy } from 'lucide-react';
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

const mainNav = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'Torneios', url: '/tournament', icon: Swords, hasBadge: true },
  { title: 'Histórico', url: '/history', icon: Clock },
  { title: 'Rankings', url: '/rankings', icon: Crown },
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
  const { signOut } = useAuth();
  const { nomeLiga } = useLiga();

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
            className={`group/nav flex items-center gap-3.5 px-3.5 py-2.5 text-[13px] font-body font-medium rounded-xl transition-all duration-200
              ${active
                ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-foreground border border-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
              }`}
            activeClassName=""
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
              active
                ? 'bg-primary/20 text-primary shadow-[0_0_12px_rgba(79,142,247,0.15)]'
                : 'text-muted-foreground group-hover/nav:text-foreground'
            }`}>
              <item.icon className="h-[18px] w-[18px]" />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 tracking-wide">{item.title}</span>
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
    <Sidebar collapsible="icon" className="border-r border-[rgba(255,255,255,0.06)]">
      <SidebarContent className="bg-[hsl(var(--sidebar-background))]">
        {/* Top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-primary via-secondary to-transparent" />

        {/* Branding */}
        <div className={`flex items-center gap-3 py-6 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(79,142,247,0.2)]">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-heading text-lg font-bold tracking-[0.14em] leading-none">
                  ARENA <span className="text-primary">X</span>
                </span>
                <p className="text-[9px] text-muted-foreground font-body tracking-[0.2em] uppercase mt-0.5">Tournament Hub</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-heading tracking-[0.25em] text-muted-foreground/60 uppercase px-5 mb-1">
              NAVEGAÇÃO
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-3">
              {mainNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className={`my-2 mx-4 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent`} />

        {/* Secondary Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-heading tracking-[0.25em] text-muted-foreground/60 uppercase px-5 mb-1">
              SISTEMA
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-3">
              {secondaryNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[hsl(var(--sidebar-background))] border-t border-[rgba(255,255,255,0.06)] p-3">
        {!collapsed ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-transparent border border-[rgba(255,255,255,0.06)]">
              <LigaLogo size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-heading font-bold text-foreground truncate tracking-wide">{nomeLiga}</p>
                <p className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Organizador
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all font-body border border-transparent hover:border-destructive/15"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair da conta
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <LigaLogo size={28} />
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
