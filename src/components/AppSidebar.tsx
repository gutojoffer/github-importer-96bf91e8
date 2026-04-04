import { Home, Users, Crown, Clock, Settings, Swords } from 'lucide-react';

import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Torneio', url: '/tournament', icon: Swords },
  { title: 'Histórico', url: '/history', icon: Clock },
  { title: 'Rankings', url: '/rankings', icon: Crown },
  { title: 'Bladers', url: '/players', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="bg-sidebar pt-5">
        <div className={`flex items-center justify-center pb-4 mb-2 border-b border-border/30 ${collapsed ? 'px-1' : 'px-3'}`}>
          {!collapsed && (
            <span className="font-heading text-sm font-bold text-foreground tracking-[0.15em] italic">
              ARENA X
            </span>
          )}
          {collapsed && (
            <span className="font-heading text-xs font-bold text-primary italic">AX</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground px-4">
            {!collapsed && 'NAVEGAÇÃO'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-heading tracking-wide text-muted-foreground hover:text-foreground transition-colors mx-1 rounded-lg"
                      activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'text-primary' : ''}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-border/30 px-3 py-3">
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground/40 font-body text-center leading-tight">
            Desenvolvido por<br />Augusto Joffer
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
