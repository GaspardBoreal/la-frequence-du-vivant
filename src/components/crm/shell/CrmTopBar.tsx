import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CrmGlobalSearch } from '@/components/crm/search/CrmGlobalSearch';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/admin/crm': { title: 'Accueil', subtitle: "Vue d'ensemble du CRM" },
  '/admin/crm/annuaire': { title: 'Annuaire', subtitle: 'Recherche, entreprises et carte' },
  '/admin/crm/pipeline': { title: 'Opportunités', subtitle: 'Pipeline commercial' },
  '/admin/crm/missions': { title: 'Missions', subtitle: 'ToDo prédictif des Bizdev' },
  '/admin/crm/marches': { title: 'Marches', subtitle: 'Événements et entreprises liées' },
  '/admin/crm/equipe': { title: 'Équipe', subtitle: 'Membres et rôles' },
  '/admin/crm/ia': { title: 'IA', subtitle: 'Assistant intelligent — bientôt' },
};

export const CrmTopBar: React.FC = () => {
  const { pathname } = useLocation();
  const meta = TITLES[pathname] || { title: 'CRM', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-bg))]/80 backdrop-blur-xl">
      <SidebarTrigger className="h-8 w-8 text-[hsl(var(--crm-text-muted))] hover:text-[hsl(var(--crm-text))] hover:bg-[hsl(var(--crm-surface-2))]" />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-sm font-semibold text-[hsl(var(--crm-text))] truncate">{meta.title}</span>
        {meta.subtitle && (
          <span className="text-[11px] crm-muted truncate">{meta.subtitle}</span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <CrmGlobalSearch />
      </div>
    </header>
  );
};
