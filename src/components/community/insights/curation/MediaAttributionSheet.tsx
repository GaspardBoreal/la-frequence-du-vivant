import React, { useMemo, useState, useEffect } from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetPortal, SheetOverlay } from '@/components/ui/sheet';
import { Search, Check, UserCircle2, Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { useReattributeMedia, type ReattributeSource } from '@/hooks/useReattributeMedia';
import { useReattributionPicker, type AttributionCandidate } from '@/hooks/useReattributionPicker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: ReattributeSource;
  mediaId: string;
  explorationId?: string;
  /** Optional pre-loaded list. When omitted, the sheet loads its own picker
   *  (editorial marcheurs ∪ all validated participants of the exploration). */
  marcheurs?: ExplorationMarcheur[];
  currentAttributedId?: string | null;
  uploaderName?: string | null;
  uploaderMarcheurId?: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  principal: 'Marcheur·euse principal·e',
  invité: 'Invité·e',
  scientifique: 'Scientifique',
  marcheur: 'Marcheur·euse',
};

// Accent-insensitive normalization for "contains" search.
function norm(s: string): string {
  return (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

const MediaAttributionSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  source,
  mediaId,
  explorationId,
  marcheurs: externalMarcheurs,
  currentAttributedId,
  uploaderName,
  uploaderMarcheurId,
}) => {
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<{ id: string | null; userId: string | null }>({
    id: currentAttributedId ?? null,
    userId: null,
  });
  const reattribute = useReattributeMedia();

  // Always load the unified picker so the curator sees every actual participant.
  const { data: pickerData, isLoading: pickerLoading } = useReattributionPicker(
    explorationId,
    open,
  );

  // If the parent passed a list, merge with picker (picker wins on duplicates).
  const candidates = useMemo<AttributionCandidate[]>(() => {
    const internal = pickerData ?? [];
    if (!externalMarcheurs?.length) return internal;
    const known = new Set(internal.map(c => c.id));
    const upcasted: AttributionCandidate[] = externalMarcheurs
      .filter(m => !known.has(m.id))
      .map(m => ({ ...m, source: 'editorial' as const }));
    return [...internal, ...upcasted];
  }, [pickerData, externalMarcheurs]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setPending({ id: currentAttributedId ?? null, userId: null });
    }
  }, [open, currentAttributedId]);

  // Strict alphabetical (FR locale, accent-insensitive) by "Prénom Nom".
  const sorted = useMemo(
    () => [...candidates].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' }),
    ),
    [candidates],
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return sorted;
    return sorted.filter(m => norm(m.fullName).includes(q) || norm(m.prenom).includes(q) || norm(m.nom).includes(q));
  }, [sorted, query]);

  const showSearch = candidates.length >= 3;

  const handleSelect = (m: AttributionCandidate) => {
    setPending({
      id: m.source === 'editorial' ? m.id : null,
      userId: m.source === 'participant' ? (m.userId ?? null) : null,
    });
  };

  const isSelected = (m: AttributionCandidate) => {
    if (m.source === 'editorial') return pending.id === m.id || currentAttributedId === m.id;
    return pending.userId === m.userId;
  };

  const isPendingSelection = (m: AttributionCandidate) => {
    if (m.source === 'editorial') return pending.id === m.id;
    return pending.userId === m.userId;
  };

  const canConfirm =
    !reattribute.isPending &&
    (pending.id || pending.userId) &&
    !(pending.id && pending.id === currentAttributedId);

  const handleConfirm = async () => {
    const target = filtered.find(m =>
      pending.id ? m.id === pending.id : m.userId === pending.userId,
    );
    await reattribute.mutateAsync({
      source,
      mediaId,
      marcheurId: pending.id,
      userId: pending.userId,
      explorationId,
      marcheurName: target?.fullName ?? null,
    });
    onOpenChange(false);
  };

  const handleClear = async () => {
    await reattribute.mutateAsync({
      source,
      mediaId,
      marcheurId: null,
      userId: null,
      explorationId,
      marcheurName: null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetOverlay className="z-[1200]" />
        <SheetPrimitive.Content
          className="fixed bottom-0 inset-x-0 z-[1210] bg-background p-0 rounded-t-2xl max-h-[85dvh] sm:max-w-md sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl flex flex-col gap-0 border border-border shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:slide-out-to-bottom-2 sm:data-[state=open]:slide-in-from-bottom-2"
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
                  placeholder="Rechercher un marcheur (prénom, nom)…"
                  autoFocus
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 px-3 pb-3">
            {pickerLoading && candidates.length === 0 ? (
              <div className="space-y-2 px-2 py-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-2 w-20 bg-muted/70 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 px-4">
                {query
                  ? 'Aucun marcheur ne correspond à votre recherche.'
                  : 'Aucun participant trouvé pour cette exploration. Vérifiez que les inscriptions à la marche sont validées.'}
              </div>
            ) : (
              <ul className="space-y-1">
                {filtered.map(m => {
                  const selected = isPendingSelection(m);
                  const isCurrent = currentAttributedId && m.id === currentAttributedId;
                  const isUploader = uploaderMarcheurId === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(m)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border ${
                          selected
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
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 flex-wrap">
                            <span>{ROLE_LABEL[m.role] || 'Marcheur·euse'}</span>
                            {m.source === 'participant' && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]">
                                participant·e
                              </span>
                            )}
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
                            selected
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
                disabled={!canConfirm}
              >
                {reattribute.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <UserCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Confirmer le crédit
              </Button>
            </div>
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export default MediaAttributionSheet;
