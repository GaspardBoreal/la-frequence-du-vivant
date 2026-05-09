import React, { useMemo, useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useCurationMarcheurs,
  useAttachPratique,
  useDetachPratique,
} from '@/hooks/useCurationMarcheurs';
import { useExplorationParticipants, type MarcheurWithStats } from '@/hooks/useExplorationParticipants';

interface Props {
  curationId: string;
  explorationId: string;
  isCurator: boolean;
}

const initialsOf = (prenom?: string, nom?: string) =>
  ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || 'M';

const PratiqueMarcheursPicker: React.FC<Props> = ({ curationId, explorationId, isCurator }) => {
  const { data: links = [] } = useCurationMarcheurs(curationId);
  const { data: participants = [] } = useExplorationParticipants(explorationId);
  const attach = useAttachPratique();
  const detach = useDetachPratique();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState('');

  // Linked crew ids (DB always stores via marcheur_id / crew row)
  const linkedCrewIds = useMemo(() => new Set(links.map(l => l.marcheur_id)), [links]);

  // Candidates = participants not yet linked.
  // A participant is "linked" if their crewId (when known) matches a linked crew row.
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants.filter(p => {
      if (p.crewId && linkedCrewIds.has(p.crewId)) return false;
      if (!q) return true;
      return `${p.prenom} ${p.nom}`.toLowerCase().includes(q);
    });
  }, [participants, linkedCrewIds, search]);

  const handlePick = (p: MarcheurWithStats) => {
    setPendingKey(p.id);
    setRoleDraft('');
  };

  const confirmAttach = (p: MarcheurWithStats) => {
    attach.mutate(
      {
        curation_id: curationId,
        marcheur_id: p.crewId ?? null,
        user_id: p.crewId ? null : (p.userId ?? null),
        role_label: roleDraft || null,
      },
      {
        onSettled: () => {
          setPendingKey(null);
          setRoleDraft('');
        },
      },
    );
  };

  if (links.length === 0 && !isCurator) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
          <Users className="w-3 h-3" />
          <span>Marcheurs :</span>
        </div>

        {links.map(link => {
          const m = link.marcheur;
          if (!m) return null;
          return (
            <div
              key={link.id}
              className="group inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={m.avatar_url || undefined} />
                <AvatarFallback className="text-[9px]" style={{ backgroundColor: m.couleur || '#10b981' }}>
                  {initialsOf(m.prenom, m.nom)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-foreground">{m.prenom}</span>
              {link.role_label && (
                <span className="text-[10px] text-amber-700 dark:text-amber-300 italic">
                  · {link.role_label}
                </span>
              )}
              {isCurator && (
                <button
                  onClick={() => detach.mutate({ curation_id: curationId, marcheur_id: m.id })}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                  title="Retirer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {isCurator && (
          <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(''); setPendingKey(null); } }}>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-amber-700 dark:text-amber-300 border border-dashed border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                title="Associer un marcheur à cette pratique"
              >
                <Plus className="w-3 h-3" />
                Associer
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un marcheur…"
                className="h-8 text-xs mb-2"
              />
              <div className="max-h-64 overflow-y-auto space-y-1">
                {candidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {participants.length === 0
                      ? 'Aucun marcheur dans cette exploration'
                      : 'Tous les marcheurs sont déjà reliés'}
                  </p>
                ) : (
                  candidates.map(p => (
                    <div key={p.id} className="rounded-md hover:bg-muted/50">
                      {pendingKey === p.id ? (
                        <div className="p-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={p.avatarUrl || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {initialsOf(p.prenom, p.nom)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{p.prenom} {p.nom}</span>
                          </div>
                          <Input
                            autoFocus
                            value={roleDraft}
                            onChange={e => setRoleDraft(e.target.value)}
                            placeholder="Rôle (optionnel) : Praticien, Témoin…"
                            className="h-7 text-xs"
                            maxLength={40}
                            onKeyDown={e => {
                              if (e.key === 'Enter') confirmAttach(p);
                              if (e.key === 'Escape') setPendingKey(null);
                            }}
                          />
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => setPendingKey(null)}>
                              Annuler
                            </Button>
                            <Button size="sm" className="h-6 text-[11px]" onClick={() => confirmAttach(p)} disabled={attach.isPending}>
                              Associer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="w-full flex items-center gap-2 p-1.5 text-left"
                          onClick={() => handlePick(p)}
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={p.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px]" style={{ backgroundColor: p.couleur || '#10b981' }}>
                              {initialsOf(p.prenom, p.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs flex-1">{p.prenom} {p.nom}</span>
                          {p.source === 'community' && !p.crewId && (
                            <span className="text-[9px] text-muted-foreground italic">participant</span>
                          )}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default PratiqueMarcheursPicker;
