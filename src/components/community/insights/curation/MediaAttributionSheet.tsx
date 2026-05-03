import React, { useMemo, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Search, Check, UserCircle2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { useReattributeMedia, type ReattributeSource } from '@/hooks/useReattributeMedia';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: ReattributeSource;
  mediaId: string;
  explorationId?: string;
  marcheurs: ExplorationMarcheur[];
  /** Currently attributed marcheur id (overrides uploader). */
  currentAttributedId?: string | null;
  /** Display name of the original uploader (for the "uploader" hint). */
  uploaderName?: string | null;
  /** When provided, the marcheur whose id matches the uploader's identity. */
  uploaderMarcheurId?: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  principal: 'Marcheur·euse principal·e',
  invité: 'Invité·e',
  scientifique: 'Scientifique',
  marcheur: 'Marcheur·euse',
};

const MediaAttributionSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  source,
  mediaId,
  explorationId,
  marcheurs,
  currentAttributedId,
  uploaderName,
  uploaderMarcheurId,
}) => {
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<string | null>(currentAttributedId ?? null);
  const reattribute = useReattributeMedia();

  useEffect(() => {
    if (open) {
      setQuery('');
      setPending(currentAttributedId ?? null);
    }
  }, [open, currentAttributedId]);

  const sorted = useMemo(
    () => [...marcheurs].sort((a, b) => (a.ordre || 999) - (b.ordre || 999)),
    [marcheurs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(m => m.fullName.toLowerCase().includes(q));
  }, [sorted, query]);

  const showSearch = sorted.length >= 6;

  const handleConfirm = async () => {
    const target = pending ?? null;
    const m = target ? marcheurs.find(x => x.id === target) : null;
    await reattribute.mutateAsync({
      source,
      mediaId,
      marcheurId: target,
      explorationId,
      marcheurName: m?.fullName ?? null,
    });
    onOpenChange(false);
  };

  const handleClear = async () => {
    await reattribute.mutateAsync({
      source,
      mediaId,
      marcheurId: null,
      explorationId,
      marcheurName: null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-2xl max-h-[85dvh] sm:max-w-md sm:mx-auto sm:rounded-2xl flex flex-col gap-0 border-t border-border"
      >
        <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted-foreground/30 sm:hidden" />

        <SheetHeader className="px-5 pt-3 pb-2 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <SheetTitle className="text-base">Crédit de la photo</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            Qui a réellement pris cette photo&nbsp;? Le crédit sera mis à jour partout dans l'exploration.
          </SheetDescription>
        </SheetHeader>

        {showSearch && (
          <div className="px-5 pt-2 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un marcheur…"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-3 pb-3">
          {filtered.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              Aucun marcheur trouvé.
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map(m => {
                const isSelected = pending === m.id;
                const isCurrent = currentAttributedId === m.id;
                const isUploader = uploaderMarcheurId === m.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setPending(m.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                          : 'border-transparent hover:bg-muted/40'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 overflow-hidden"
                        style={{ background: m.couleur || '#10b981' }}
                      >
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>
                            {(m.prenom?.[0] || '').toUpperCase()}
                            {(m.nom?.[0] || '').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.fullName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                          <span>{ROLE_LABEL[m.role] || 'Marcheur·euse'}</span>
                          {isUploader && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground/80 text-[10px]">
                              uploader
                            </span>
                          )}
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
                              crédit actuel
                            </span>
                          )}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-muted-foreground/30 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          className="px-5 py-3 border-t border-border bg-background/95 backdrop-blur flex flex-col gap-2"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          {currentAttributedId && (
            <button
              type="button"
              onClick={handleClear}
              disabled={reattribute.isPending}
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-start"
            >
              <X className="w-3 h-3" />
              Retirer le crédit (revenir à l'uploader{uploaderName ? ` · ${uploaderName}` : ''})
            </button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={reattribute.isPending}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirm}
              disabled={
                reattribute.isPending ||
                !pending ||
                pending === (currentAttributedId ?? null)
              }
            >
              <UserCircle2 className="w-4 h-4 mr-1.5" />
              Confirmer le crédit
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MediaAttributionSheet;
