import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Target,
  CalendarRange,
  Users,
  Sparkles,
  ArrowLeft,
  ChevronsLeft,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: string;
}

const ITEMS: NavItem[] = [
  { to: '/admin/crm', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/admin/crm/annuaire', label: 'Annuaire', icon: Building2 },
  { to: '/admin/crm/pipeline', label: 'Opportunités', icon: Target },
  { to: '/admin/crm/marches', label: 'Marches', icon: CalendarRange },
  { to: '/admin/crm/equipe', label: 'Équipe', icon: Users },
  { to: '/admin/crm/ia', label: 'IA', icon: Sparkles, badge: 'Bientôt' },
];

export const CrmSidebar: React.FC = () => {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))]/80 backdrop-blur-xl"
    >
      <SidebarHeader className="border-b border-[hsl(var(--crm-border))] p-3">
        <Link
          to="/admin/crm"
          className="flex items-center gap-2 px-1 py-1 group"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--crm-accent))] to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-[hsl(var(--crm-accent-glow))]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-semibold text-[hsl(var(--crm-text))]">CRM</span>
              <span className="text-[10px] uppercase tracking-wider crm-muted">Fréquence</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {ITEMS.map((item) => {
                const active = isActive(item.to, item.end);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      tooltip={collapsed ? item.label : undefined}
                      className={[
                        'group relative h-9 rounded-md transition-all duration-150',
                        active
                          ? 'bg-[hsl(var(--crm-accent-soft))] text-[hsl(var(--crm-accent))] hover:bg-[hsl(var(--crm-accent-soft))] hover:text-[hsl(var(--crm-accent))]'
                          : 'text-[hsl(var(--crm-text-muted))] hover:bg-[hsl(var(--crm-surface-2))] hover:text-[hsl(var(--crm-text))]',
                      ].join(' ')}
                    >
                      <NavLink to={item.to} end={item.end}>
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[hsl(var(--crm-accent))]" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="text-[13px] font-medium">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[hsl(var(--crm-surface-2))] crm-muted">
                                {item.badge}
                              </span>
                            )}
                          </>
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

      <SidebarFooter className="border-t border-[hsl(var(--crm-border))] p-2 gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={collapsed ? 'Retour admin' : undefined}
              className="h-9 text-[hsl(var(--crm-text-muted))] hover:text-[hsl(var(--crm-text))] hover:bg-[hsl(var(--crm-surface-2))]"
            >
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4" />
                {!collapsed && <span className="text-[13px]">Retour admin</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={collapsed ? 'Déplier' : undefined}
              className="h-9 text-[hsl(var(--crm-text-muted))] hover:text-[hsl(var(--crm-text))] hover:bg-[hsl(var(--crm-surface-2))]"
            >
              <ChevronsLeft
                className={['h-4 w-4 transition-transform', collapsed ? 'rotate-180' : ''].join(' ')}
              />
              {!collapsed && <span className="text-[13px]">Replier</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
