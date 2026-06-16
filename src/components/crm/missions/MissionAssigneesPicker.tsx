import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { cn } from '@/lib/utils';
import type { TeamMember } from '@/types/crm';

interface Props {
  value: string[]; // user_ids
  onChange: (userIds: string[]) => void;
  size?: 'sm' | 'md';
}

export const MissionAssigneesPicker: React.FC<Props> = ({ value, onChange, size = 'md' }) => {
  const { activeMembers } = useTeamMembers();
  const eligible: TeamMember[] = activeMembers.filter(m => !!m.user_id);

  const toggle = (uid: string) => {
    onChange(value.includes(uid) ? value.filter(v => v !== uid) : [...value, uid]);
  };

  const selected = eligible.filter(m => value.includes(m.user_id!));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))] hover:bg-[hsl(var(--crm-surface-2))] transition-colors',
            size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-2.5 text-sm',
          )}
        >
          {selected.length === 0 ? (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              <span>Assigner</span>
            </>
          ) : (
            <div className="flex -space-x-1.5">
              {selected.slice(0, 3).map(m => (
                <Avatar key={m.id} className={cn(size === 'sm' ? 'h-5 w-5' : 'h-6 w-6', 'ring-2 ring-[hsl(var(--crm-surface))]')}>
                  <AvatarImage src={m.photo_url ?? undefined} />
                  <AvatarFallback className="text-[9px] bg-[hsl(var(--crm-accent-soft))] text-[hsl(var(--crm-accent))]">
                    {(m.prenom?.[0] ?? '?') + (m.nom?.[0] ?? '')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {selected.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-[hsl(var(--crm-surface-2))] text-[10px] flex items-center justify-center ring-2 ring-[hsl(var(--crm-surface))]">
                  +{selected.length - 3}
                </div>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div className="max-h-72 overflow-y-auto">
          {eligible.length === 0 && (
            <div className="px-3 py-6 text-sm text-center text-muted-foreground">
              Aucun membre lié à un compte.
            </div>
          )}
          {eligible.map(m => {
            const isSel = value.includes(m.user_id!);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.user_id!)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[hsl(var(--crm-surface-2))] text-left"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={m.photo_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(m.prenom?.[0] ?? '?') + (m.nom?.[0] ?? '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.prenom} {m.nom}</div>
                  {m.fonction && <div className="text-[11px] text-muted-foreground truncate">{m.fonction}</div>}
                </div>
                {isSel && <Check className="h-4 w-4 text-[hsl(var(--crm-accent))]" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
