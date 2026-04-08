import { Home, Users, Crown, Clock, Settings, Swords } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useTournamentStore } from '@/stores/useTournamentStore';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Torneio', url: '/tournament', icon: Swords, hasBadge: true },
  { title: 'Histórico', url: '/history', icon: Clock },
  { title: 'Rankings', url: '/rankings', icon: Crown },
  { title: 'Bladers', url: '/players', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const tournaments = useTournamentStore(s => s.tournaments);
  const upcomingCount = tournaments.filter(t => t.status === 'upcoming' || t.status === 'active').length;

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <Sidebar collapsible="icon" className="border-r border-[rgba(255,255,255,0.07)]">
      <SidebarContent className="bg-[hsl(var(--bg2))]">
        {/* Accent gradient line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-primary to-secondary" />

        {/* Logo */}
        <div className={`flex items-center gap-2 py-5 ${collapsed ? 'justify-center px-1' : 'px-5'}`}>
          {!collapsed ? (
            <span className="font-heading text-lg font-bold tracking-[0.12em]">
              ARENA <span className="text-primary">X</span>
            </span>
          ) : (
            <span className="font-heading text-sm font-bold text-primary">X</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className={`flex items-center gap-3 px-3 py-[9px] text-sm font-body font-medium rounded-lg transition-all
                          ${active
                            ? 'bg-[rgba(79,142,247,0.12)] text-primary border border-[rgba(79,142,247,0.25)]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface))] border border-transparent'
                          }`}
                        activeClassName=""
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                        {!collapsed && (
                          <span className="flex-1">{item.title}</span>
                        )}
                        {!collapsed && item.hasBadge && upcomingCount > 0 && (
                          <span className="h-5 min-w-[20px] flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold px-1.5">
                            {upcomingCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[hsl(var(--bg2))] border-t border-[rgba(255,255,255,0.07)] p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--surface))] border border-[rgba(255,255,255,0.07)]">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
              AX
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Admin</p>
              <p className="text-[10px] text-muted-foreground">Organizador</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold">
              AX
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
