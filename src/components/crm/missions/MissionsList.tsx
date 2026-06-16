import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MISSION_PRIORITY_META, MISSION_STATUS_META, type CrmMission } from '@/types/crmMissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface Props {
  missions: CrmMission[];
  onOpen: (m: CrmMission) => void;
}

export const MissionsList: React.FC<Props> = ({ missions, onOpen }) => {
  const { activeMembers } = useTeamMembers();
  return (
    <div className="overflow-hidden rounded-2xl border border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))]">
      <table className="w-full text-sm">
        <thead className="bg-[hsl(var(--crm-surface-2))] text-left text-[11px] uppercase tracking-wider text-[hsl(var(--crm-text-muted))]">
          <tr>
            <th className="px-3 py-2 font-medium">Mission</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 font-medium">Priorité</th>
            <th className="px-3 py-2 font-medium">Échéance</th>
            <th className="px-3 py-2 font-medium">Assignés</th>
          </tr>
        </thead>
        <tbody>
          {missions.length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-[hsl(var(--crm-text-muted))]">Aucune mission.</td></tr>
          )}
          {missions.map(m => {
            const statusMeta = MISSION_STATUS_META[m.statut];
            const prio = MISSION_PRIORITY_META[m.priorite];
            const ass = (m.assignees ?? []).map(a => activeMembers.find(x => x.user_id === a.user_id)).filter(Boolean);
            return (
              <tr
                key={m.id}
                onClick={() => onOpen(m)}
                className="border-t border-[hsl(var(--crm-border))] hover:bg-[hsl(var(--crm-surface-2))] cursor-pointer"
              >
                <td className="px-3 py-2 font-medium text-[hsl(var(--crm-text))]">{m.titre}</td>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `hsl(${statusMeta.hue} / 0.15)`, color: `hsl(${statusMeta.hue})` }}
                  >
                    {statusMeta.emoji} {statusMeta.label}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-[11px]" style={{ color: `hsl(${prio.hue})` }}>● {prio.label}</span>
                </td>
                <td className="px-3 py-2 text-[hsl(var(--crm-text-muted))]">
                  {m.due_at ? new Date(m.due_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex -space-x-1.5">
                    {ass.slice(0, 4).map((u: any) => (
                      <Avatar key={u.id} className="h-6 w-6 ring-2 ring-[hsl(var(--crm-surface))]">
                        <AvatarImage src={u.photo_url ?? undefined} />
                        <AvatarFallback className="text-[9px]">{(u.prenom?.[0] ?? '?') + (u.nom?.[0] ?? '')}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
