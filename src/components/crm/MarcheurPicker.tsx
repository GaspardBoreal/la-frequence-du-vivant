import React, { useMemo, useState } from 'react';
import { Search, Check, Footprints, Shield, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMarcheursForCrm, type MarcheurForCrm } from '@/hooks/useMarcheursForCrm';
import { cn } from '@/lib/utils';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const roleMeta = (role: string | null) => {
  switch (role) {
    case 'sentinelle':
      return { label: 'Sentinelle', icon: Shield, className: 'bg-primary/15 text-primary border-primary/30' };
    case 'ambassadeur':
      return { label: 'Ambassadeur', icon: Sparkles, className: 'bg-accent/15 text-accent-foreground border-accent/30' };
    case 'eclaireur':
      return { label: 'Éclaireur', icon: Footprints, className: 'bg-secondary text-secondary-foreground' };
    default:
      return { label: 'Marcheur', icon: Footprints, className: 'bg-muted text-muted-foreground' };
  }
};

interface Props {
  existingUserIds: Set<string>;
  onPick: (m: MarcheurForCrm) => void;
}

export const MarcheurPicker: React.FC<Props> = ({ existingUserIds, onPick }) => {
  const { data: marcheurs = [], isLoading } = useMarcheursForCrm();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return marcheurs;
    const nq = normalize(q);
    return marcheurs.filter(
      (m) => normalize(m.prenom).includes(nq) || normalize(m.nom).includes(nq),
    );
  }, [marcheurs, q]);

  return (
    <div className="flex flex-col h-[60vh] sm:h-[55vh]">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Rechercher un marcheur (nom ou prénom)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Aucun marcheur trouvé</p>
        ) : (
          filtered.map((m) => {
            const already = existingUserIds.has(m.user_id);
            const meta = roleMeta(m.role);
            const Icon = meta.icon;
            return (
              <button
                key={m.id}
                type="button"
                disabled={already}
                onClick={() => onPick(m)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all',
                  'hover:bg-accent/40 hover:border-primary/40 hover:shadow-sm',
                  already && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-border',
                )}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {m.prenom?.[0]}{m.nom?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {m.prenom} {m.nom}
                    </span>
                    <Badge variant="outline" className={cn('text-[10px] gap-1', meta.className)}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </div>
                  {m.ville && (
                    <p className="text-xs text-muted-foreground truncate">{m.ville}</p>
                  )}
                </div>
                {already && (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Check className="h-3 w-3" /> Déjà membre
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2 border-t mt-2">
        {filtered.length} marcheur{filtered.length > 1 ? 's' : ''} {q ? 'trouvé' : 'disponible'}{filtered.length > 1 ? 's' : ''}
      </p>
    </div>
  );
};
