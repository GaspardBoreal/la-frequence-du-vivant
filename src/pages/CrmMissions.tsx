import React from 'react';
import { Kanban, CalendarRange, List, Filter, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCrmMissions } from '@/hooks/useCrmMissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { MissionsKanban } from '@/components/crm/missions/MissionsKanban';
import { MissionsPlanning } from '@/components/crm/missions/MissionsPlanning';
import { MissionsList } from '@/components/crm/missions/MissionsList';
import { MissionDrawer } from '@/components/crm/missions/MissionDrawer';
import { MissionCreateDialog } from '@/components/crm/missions/MissionCreateDialog';
import { MISSION_PRIORITY_META, type CrmMission, type CrmMissionPriority } from '@/types/crmMissions';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'planning' | 'list';

const CrmMissions: React.FC = () => {
  const [view, setView] = React.useState<ViewMode>('kanban');
  const [search, setSearch] = React.useState('');
  const [priorite, setPriorite] = React.useState<CrmMissionPriority | 'all'>('all');
  const [assignee, setAssignee] = React.useState<string>('all');
  const [mine, setMine] = React.useState(false);
  const [openMission, setOpenMission] = React.useState<CrmMission | null>(null);

  const { missions, isLoading, updateStatus, updateMission } = useCrmMissions({
    search,
    priorite: priorite === 'all' ? null : priorite,
    assignee: assignee === 'all' ? null : assignee,
    mine,
  });
  const { activeMembers } = useTeamMembers();

  // Keyboard: N to create
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'n' || e.key === 'N') {
        const btn = document.querySelector<HTMLButtonElement>('[data-mission-create-trigger]');
        btn?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[hsl(var(--crm-text))] tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[hsl(var(--crm-accent))]" />
            Missions
          </h1>
          <p className="text-sm crm-muted mt-1">
            Le copilote d'exécution des Bizdev — assignations, planning, suivi, IA.
          </p>
        </div>
        <div data-mission-create-trigger-wrap>
          <MissionCreateDialog />
        </div>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-[hsl(var(--crm-surface-2))] w-fit">
        {[
          { id: 'kanban', icon: Kanban, label: 'Tableau' },
          { id: 'planning', icon: CalendarRange, label: 'Planning' },
          { id: 'list', icon: List, label: 'Liste' },
        ].map(v => {
          const Icon = v.icon as any;
          const active = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id as ViewMode)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-all',
                active
                  ? 'bg-[hsl(var(--crm-surface))] text-[hsl(var(--crm-text))] shadow-sm'
                  : 'text-[hsl(var(--crm-text-muted))] hover:text-[hsl(var(--crm-text))]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--crm-text-muted))]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="h-8 pl-8 w-64 text-xs"
          />
        </div>
        <Select value={priorite} onValueChange={(v) => setPriorite(v as any)}>
          <SelectTrigger className="h-8 w-40 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Priorité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {(['basse','normale','haute','critique'] as CrmMissionPriority[]).map(p => (
              <SelectItem key={p} value={p}>● {MISSION_PRIORITY_META[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Assigné" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les bizdev</SelectItem>
            {activeMembers.filter(m => m.user_id).map(m => (
              <SelectItem key={m.id} value={m.user_id!}>{m.prenom} {m.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={mine ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setMine(!mine)}
        >
          ⭐ Mes missions
        </Button>
        <div className="ml-auto text-xs text-[hsl(var(--crm-text-muted))]">
          {missions.length} mission{missions.length > 1 ? 's' : ''}
          <span className="ml-3 hidden md:inline opacity-70">Astuce : <kbd className="px-1 py-0.5 bg-[hsl(var(--crm-surface-2))] rounded text-[10px]">N</kbd> nouvelle</span>
        </div>
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className="text-center py-10 text-sm text-[hsl(var(--crm-text-muted))]">Chargement…</div>
        ) : view === 'kanban' ? (
          <MissionsKanban
            missions={missions}
            onOpen={setOpenMission}
            onStatusChange={(id, statut) => updateStatus.mutate({ id, statut })}
          />
        ) : view === 'planning' ? (
          <MissionsPlanning missions={missions} onOpen={setOpenMission} />
        ) : (
          <MissionsList missions={missions} onOpen={setOpenMission} />
        )}
      </div>

      <MissionDrawer
        mission={openMission}
        open={!!openMission}
        onOpenChange={(v) => { if (!v) setOpenMission(null); }}
      />
    </div>
  );
};

export default CrmMissions;
