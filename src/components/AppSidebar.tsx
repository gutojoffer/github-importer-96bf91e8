import { Home, Users, Trophy, Swords, Crown, History, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Bladers', url: '/players', icon: Users },
  { title: 'Torneio', url: '/tournament', icon: Trophy },
  { title: 'Arena', url: '/arena', icon: Swords },
  { title: 'Histórico', url: '/history', icon: History },
  { title: 'Rankings', url: '/rankings', icon: Crown },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-sidebar pt-5">
        {/* Logo */}
        <div className={`flex items-center justify-center px-3 pb-4 mb-3 border-b border-border ${collapsed ? 'px-1' : 'gap-2'}`}>
          {!collapsed ? (
            <span className="font-heading text-base font-bold text-foreground tracking-widest">
              ⚙ BHX
            </span>
          ) : (
            <span className="font-heading text-sm font-bold text-foreground">⚙</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-heading tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-lg mx-1"
                      activeClassName="bg-primary/15 text-primary-foreground font-semibold soft-glow"
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
    </Sidebar>
  );
}
