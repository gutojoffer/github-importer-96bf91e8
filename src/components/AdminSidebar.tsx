import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Disc3, FileText, Users, Settings, ArrowLeft, Shield } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Beyblades Meta', url: '/admin/beyblades', icon: Disc3 },
  { title: 'Release Notes', url: '/admin/release-notes', icon: FileText },
  { title: 'Ligas', url: '/admin/ligas', icon: Users },
  { title: 'Configurações', url: '/admin/config', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url: string) =>
    url === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r border-[rgba(255,255,255,0.06)]">
      <SidebarHeader className="p-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-heading text-sm font-bold text-foreground tracking-wide">Admin Panel</span>
            <span className="text-[10px] text-muted-foreground font-body">Arena X</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-body mb-1">
            Gerenciamento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-[0_0_12px_rgba(0,212,255,0.08)]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                        <span className="font-body text-sm font-medium truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.04)] transition-all font-body text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao sistema</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
