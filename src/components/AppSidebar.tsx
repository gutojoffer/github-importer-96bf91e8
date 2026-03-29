import { Home, Users, Swords, Crown, History, ShieldCheck } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const publicItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Rankings', url: '/rankings', icon: Crown },
  { title: 'Histórico', url: '/history', icon: History },
];

const adminItems = [
  { title: 'Admin', url: '/admin', icon: ShieldCheck },
  { title: 'Bladers', url: '/players', icon: Users },
  { title: 'Arena', url: '/arena', icon: Swords },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const renderItems = (items: typeof publicItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end={item.url === '/'}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-heading tracking-wide text-muted-foreground hover:text-foreground transition-colors mx-1"
              activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'text-primary' : ''}`} />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-sidebar pt-5">
        <div className={`flex items-center justify-center px-3 pb-4 mb-2 border-b border-border ${collapsed ? 'px-1' : 'gap-2'}`}>
          <Swords className={`text-primary ${collapsed ? 'h-5 w-5' : 'h-5 w-5'}`} />
          {!collapsed && (
            <span className="font-heading text-sm font-bold text-foreground tracking-[0.15em] italic">BHX</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground px-4">
            {!collapsed && 'PÚBLICO'}
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(publicItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground px-4">
            {!collapsed && 'GESTÃO'}
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(adminItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
