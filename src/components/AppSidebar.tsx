import { Home, Users, Trophy, Swords, Crown, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
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
  { title: 'Home', url: '/', icon: Home },
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
      <SidebarContent className="bg-sidebar pt-6">
        {/* Logo */}
        <div className={`flex items-center justify-center px-3 pb-5 mb-4 ${collapsed ? 'px-1' : 'gap-3'}`}>
          {!collapsed && (
            <div className="text-center">
              <span className="font-heading text-lg font-bold text-primary tracking-[0.2em] text-glow-cyan">
                BHX
              </span>
            </div>
          )}
          {collapsed && (
            <span className="font-heading text-sm font-bold text-primary text-glow-cyan">B</span>
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
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-heading tracking-wide text-muted-foreground hover:text-primary transition-all duration-200 rounded-lg mx-1"
                      activeClassName="bg-primary/10 text-primary glow-cyan"
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'drop-shadow-[0_0_6px_hsl(185_100%_50%/0.6)]' : ''}`} />
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
