import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Sparkles } from 'lucide-react';
import { MissionRichEditor } from './MissionRichEditor';
import { MissionAssigneesPicker } from './MissionAssigneesPicker';
import { useCrmMissions } from '@/hooks/useCrmMissions';
import {
  MISSION_PRIORITY_META, MISSION_STATUS_META, MISSION_STATUSES,
  type CrmMissionPriority, type CrmMissionStatus,
} from '@/types/crmMissions';

const TEMPLATES: { label: string; titre: string; priorite: CrmMissionPriority }[] = [
  { label: 'Plaquette à envoyer',          titre: 'Envoyer la plaquette',           priorite: 'normale' },
  { label: 'Relance D+7',                  titre: 'Relance commerciale (D+7)',      priorite: 'haute' },
  { label: 'Fiche prépa Marche',           titre: 'Préparer la fiche Marche',       priorite: 'haute' },
  { label: 'Pack du vivant à livrer',      titre: 'Livrer le Pack du vivant',       priorite: 'critique' },
];

export const MissionCreateDialog: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [titre, setTitre] = React.useState('');
  const [desc, setDesc] = React.useState<any>(null);
  const [statut, setStatut] = React.useState<CrmMissionStatus>('a_faire');
  const [priorite, setPriorite] = React.useState<CrmMissionPriority>('normale');
  const [dueAt, setDueAt] = React.useState('');
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const { createMission } = useCrmMissions();

  const reset = () => {
    setTitre(''); setDesc(null); setStatut('a_faire'); setPriorite('normale'); setDueAt(''); setAssignees([]);
  };

  const submit = async () => {
    if (!titre.trim()) return;
    await createMission.mutateAsync({
      titre: titre.trim(),
      description_rich: desc,
      statut,
      priorite,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      assigneeIds: assignees,
    } as any);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[hsl(var(--crm-accent))] hover:bg-[hsl(var(--crm-accent))]/90 text-white shadow-lg shadow-[hsl(var(--crm-accent-glow))]">
          <Plus className="h-4 w-4 mr-1" /> Nouvelle mission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[hsl(var(--crm-bg))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--crm-accent))]" /> Nouvelle mission
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5 mb-1">
          {TEMPLATES.map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => { setTitre(t.titre); setPriorite(t.priorite); }}
              className="text-[11px] px-2 py-1 rounded-full bg-[hsl(var(--crm-surface-2))] hover:bg-[hsl(var(--crm-accent-soft))] hover:text-[hsl(var(--crm-accent))]"
            >
              ✨ {t.label}
            </button>
          ))}
        </div>

        <Input placeholder="Titre de la mission" value={titre} onChange={e => setTitre(e.target.value)} autoFocus />

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Statut</label>
            <Select value={statut} onValueChange={(v) => setStatut(v as CrmMissionStatus)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MISSION_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{MISSION_STATUS_META[s].emoji} {MISSION_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Priorité</label>
            <Select value={priorite} onValueChange={(v) => setPriorite(v as CrmMissionPriority)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['basse','normale','haute','critique'] as CrmMissionPriority[]).map(p => (
                  <SelectItem key={p} value={p}>● {MISSION_PRIORITY_META[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Échéance</label>
            <Input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Assignés</label>
          <div className="mt-1">
            <MissionAssigneesPicker value={assignees} onChange={setAssignees} />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Description</label>
          <MissionRichEditor value={desc} onChange={setDesc} placeholder="Briefing, contexte…" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!titre.trim() || createMission.isPending}>
            {createMission.isPending ? 'Création…' : 'Créer la mission'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
