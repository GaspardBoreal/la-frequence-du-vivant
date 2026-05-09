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

interface Marcheur {
  id: string;
  prenom: string;
  nom: string;
  avatar_url?: string | null;
  couleur?: string | null;
}

interface Props {
  curationId: string;
  marcheurs: Marcheur[];
  isCurator: boolean;
}

const initials = (m: Marcheur) =>
  ((m.prenom?.[0] || '') + (m.nom?.[0] || '')).toUpperCase() || 'M';

const PratiqueMarcheursPicker: React.FC<Props> = ({ curationId, marcheurs, isCurator }) => {
  const { data: links = [] } = useCurationMarcheurs(curationId);
  const attach = useAttachPratique();
  const detach = useDetachPratique();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState('');

  const linkedIds = useMemo(() => new Set(links.map(l => l.marcheur_id)), [links]);
  const candidates = useMemo(
    () =>
      marcheurs
        .filter(m => !linkedIds.has(m.id))
        .filter(m =>
          search.trim()
            ? `${m.prenom} ${m.nom}`.toLowerCase().includes(search.toLowerCase())
            : true,
        ),
    [marcheurs, linkedIds, search],
  );

  const handleAttach = (marcheurId: string) => {
    setPendingRoleId(marcheurId);
    setRoleDraft('');
  };

  const confirmAttach = (marcheurId: string) => {
    attach.mutate(
      { curation_id: curationId, marcheur_id: marcheurId, role_label: roleDraft || null },
      {
        onSettled: () => {
          setPendingRoleId(null);
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
                  {initials(m as Marcheur)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-foreground">
                {m.prenom}
              </span>
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
          <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(''); setPendingRoleId(null); } }}>
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
                    {marcheurs.length === 0 ? 'Aucun marcheur dans cette exploration' : 'Tous les marcheurs sont déjà reliés'}
                  </p>
                ) : (
                  candidates.map(m => (
                    <div key={m.id} className="rounded-md hover:bg-muted/50">
                      {pendingRoleId === m.id ? (
                        <div className="p-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={m.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">{initials(m)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{m.prenom} {m.nom}</span>
                          </div>
                          <Input
                            autoFocus
                            value={roleDraft}
                            onChange={e => setRoleDraft(e.target.value)}
                            placeholder="Rôle (optionnel) : Praticien, Témoin…"
                            className="h-7 text-xs"
                            maxLength={40}
                            onKeyDown={e => {
                              if (e.key === 'Enter') confirmAttach(m.id);
                              if (e.key === 'Escape') setPendingRoleId(null);
                            }}
                          />
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => setPendingRoleId(null)}>
                              Annuler
                            </Button>
                            <Button size="sm" className="h-6 text-[11px]" onClick={() => confirmAttach(m.id)} disabled={attach.isPending}>
                              Associer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="w-full flex items-center gap-2 p-1.5 text-left"
                          onClick={() => handleAttach(m.id)}
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={m.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]" style={{ backgroundColor: m.couleur || '#10b981' }}>
                              {initials(m)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{m.prenom} {m.nom}</span>
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
