import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MissionRichEditor } from './MissionRichEditor';
import { MissionAssigneesPicker } from './MissionAssigneesPicker';
import { useCrmMissionDetail, useCrmMissions } from '@/hooks/useCrmMissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import {
  MISSION_STATUS_META, MISSION_PRIORITY_META, MISSION_STATUSES,
  type CrmMission, type CrmMissionPriority, type CrmMissionStatus,
} from '@/types/crmMissions';
import { Send, Trash2, Calendar, MessageSquare, History } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Props {
  mission: CrmMission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MissionDrawer: React.FC<Props> = ({ mission, open, onOpenChange }) => {
  const { allMissions, updateMission, deleteMission, setAssignees } = useCrmMissions();
  const { activeMembers } = useTeamMembers();
  const { comments, activity, addComment } = useCrmMissionDetail(mission?.id ?? null);

  // Live mission from cache so assignees/status updates reflect immediately
  const liveMission = React.useMemo(
    () => allMissions.find(m => m.id === mission?.id) ?? mission,
    [allMissions, mission],
  );

  const [titre, setTitre] = React.useState('');
  const [desc, setDesc] = React.useState<any>(null);
  const [statut, setStatut] = React.useState<CrmMissionStatus>('a_faire');
  const [priorite, setPriorite] = React.useState<CrmMissionPriority>('normale');
  const [dueAt, setDueAt] = React.useState<string>('');
  const [draftComment, setDraftComment] = React.useState<any>(null);

  React.useEffect(() => {
    if (mission) {
      setTitre(mission.titre);
      setDesc(mission.description_rich);
      setStatut(mission.statut);
      setPriorite(mission.priorite);
      setDueAt(mission.due_at ? mission.due_at.slice(0, 16) : '');
    }
  }, [mission?.id]);

  if (!liveMission) return null;

  const assigneeIds = (liveMission.assignees ?? []).map(a => a.user_id);

  const save = async () => {
    await updateMission.mutateAsync({
      id: mission.id,
      titre,
      description_rich: desc,
      statut,
      priorite,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    } as any);
    toast.success('Enregistré');
  };

  const submitComment = async () => {
    if (!draftComment) return;
    await addComment.mutateAsync(draftComment);
    setDraftComment(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-[hsl(var(--crm-bg))]">
        <SheetHeader>
          <SheetTitle className="sr-only">Détail de la mission</SheetTitle>
        </SheetHeader>

        <Input
          value={titre}
          onChange={e => setTitre(e.target.value)}
          onBlur={save}
          className="text-lg font-semibold border-0 focus-visible:ring-0 px-0"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Statut</label>
            <Select value={statut} onValueChange={(v) => { setStatut(v as CrmMissionStatus); updateMission.mutate({ id: mission.id, statut: v as CrmMissionStatus }); }}>
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
            <Select value={priorite} onValueChange={(v) => { setPriorite(v as CrmMissionPriority); updateMission.mutate({ id: mission.id, priorite: v as CrmMissionPriority }); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['basse','normale','haute','critique'] as CrmMissionPriority[]).map(p => (
                  <SelectItem key={p} value={p}>● {MISSION_PRIORITY_META[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))] flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Échéance
            </label>
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              onBlur={save}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Assignés</label>
          <div className="mt-1">
            <MissionAssigneesPicker
              value={assigneeIds}
              onChange={(ids) => setAssignees.mutate({ missionId: mission.id, userIds: ids })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">Description</label>
          <MissionRichEditor value={desc} onChange={setDesc} placeholder="Briefing, contexte, livrable attendu…" />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={save}>Enregistrer la description</Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--crm-text))] mb-2">
            <MessageSquare className="h-4 w-4" /> Commentaires
          </div>
          <div className="space-y-3">
            {comments.length === 0 && (
              <div className="text-xs text-[hsl(var(--crm-text-muted))] italic">Aucun commentaire pour le moment.</div>
            )}
            {comments.map(c => {
              const author = activeMembers.find(m => m.user_id === c.author_id);
              return (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="h-7 w-7 mt-0.5">
                    <AvatarImage src={author?.photo_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">{(author?.prenom?.[0] ?? '?') + (author?.nom?.[0] ?? '')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-lg border border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))] px-2 py-1">
                    <div className="text-[10px] text-[hsl(var(--crm-text-muted))]">
                      {author ? `${author.prenom} ${author.nom}` : 'Membre'} · {new Date(c.created_at).toLocaleString('fr-FR')}
                    </div>
                    <MissionRichEditor value={c.body_rich} editable={false} className="border-0" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            <MissionRichEditor
              value={draftComment}
              onChange={setDraftComment}
              placeholder="Ajouter un commentaire (gras, italique, couleurs)…"
              minHeight={70}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={submitComment} disabled={!draftComment}>
                <Send className="h-3.5 w-3.5 mr-1" /> Publier
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--crm-text))] mb-2">
            <History className="h-4 w-4" /> Activité
          </div>
          <div className="space-y-1.5">
            {activity.length === 0 && (
              <div className="text-xs text-[hsl(var(--crm-text-muted))] italic">—</div>
            )}
            {activity.map(a => (
              <div key={a.id} className="text-[11px] text-[hsl(var(--crm-text-muted))] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--crm-accent))]" />
                <span className="font-mono">{new Date(a.created_at).toLocaleString('fr-FR')}</span>
                <span>·</span>
                <span>
                  {a.type === 'created' && 'Mission créée'}
                  {a.type === 'status_change' && `Statut : ${a.payload?.from} → ${a.payload?.to}`}
                  {!['created','status_change'].includes(a.type) && a.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-[hsl(var(--crm-border))] flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              if (confirm('Supprimer cette mission ?')) {
                deleteMission.mutate(mission.id);
                onOpenChange(false);
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fermer</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
