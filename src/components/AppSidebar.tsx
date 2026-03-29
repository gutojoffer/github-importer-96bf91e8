import { Home, Users, Trophy, Swords, Crown } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import beybladeXLogo from '@/assets/beyblade-x-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Jogadores', url: '/players', icon: Users },
  { title: 'Torneio', url: '/tournament', icon: Trophy },
  { title: 'Arena', url: '/arena', icon: Swords },
  { title: 'Rankings', url: '/rankings', icon: Crown },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-sidebar pt-4">
        {/* Logo */}
        <div className={`flex items-center justify-center px-3 pb-4 border-b border-border mb-2 ${collapsed ? 'px-1' : 'gap-3'}`}>
          <img src={beybladeXLogo} alt="Beyblade X" className={collapsed ? 'h-8 w-8' : 'h-10 w-auto'} />
          {!collapsed && (
            <span className="font-heading text-sm font-bold text-primary tracking-widest uppercase">
              Blader Hub X
            </span>
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
                      end
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-heading tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
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
