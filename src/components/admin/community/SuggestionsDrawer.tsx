import React, { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Link2, X, ExternalLink, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { NETWORK_META, type ScienceNetwork } from '@/types/scienceAccounts';
import {
  useScienceAccountSuggestions,
  useLinkSuggestion,
  useIgnoreSuggestion,
  type ScienceAccountSuggestion,
} from '@/hooks/useScienceAccountSuggestions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const SuggestionsDrawer: React.FC<Props> = ({ open, onOpenChange }) => {
  const { data: suggestions = [], isLoading } = useScienceAccountSuggestions();
  const link = useLinkSuggestion();
  const ignore = useIgnoreSuggestion();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  const evidence = useMemo(
    () => suggestions.filter(s => s.confidence === 'exact' && s.homonym_count <= 1),
    [suggestions],
  );

  const handleLink = async (s: ScienceAccountSuggestion) => {
    const id = `${s.profile_id}-${s.network}`;
    setBusyId(id);
    try { await link.mutateAsync(s); } finally { setBusyId(null); }
  };
  const handleIgnore = async (s: ScienceAccountSuggestion) => {
    const id = `${s.profile_id}-${s.network}`;
    setBusyId(id);
    try { await ignore.mutateAsync(s); } finally { setBusyId(null); }
  };

  const handleBulk = async () => {
    setBulk(true);
    try {
      for (const s of evidence) {
        // Sequential to respect iNat rate-limit
        // eslint-disable-next-line no-await-in-loop
        await link.mutateAsync(s).catch(() => {});
        // eslint-disable-next-line no-await-in-loop
        if (s.network === 'inaturalist') await new Promise(r => setTimeout(r, 1000));
      }
    } finally {
      setBulk(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Suggestions intelligentes
          </SheetTitle>
          <SheetDescription>
            Marcheurs détectés comme contributeurs sur iNaturalist, eBird ou GBIF par
            correspondance de nom. Validez en 1 clic — aucune liaison n'est créée automatiquement.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Aucune suggestion en attente. ✨
          </div>
        ) : (
          <>
            {evidence.length > 0 && (
              <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-3">
                <Zap className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-medium text-emerald-700 dark:text-emerald-300">
                    {evidence.length} évidence{evidence.length > 1 ? 's' : ''} sans ambiguïté
                  </div>
                  <div className="text-muted-foreground">
                    Aucun homonyme détecté — liaison fiable.
                  </div>
                </div>
                <Button size="sm" onClick={handleBulk} disabled={bulk}>
                  {bulk ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Link2 className="h-3 w-3 mr-1" />}
                  Tout lier
                </Button>
              </div>
            )}

            <div className="space-y-2 mt-4">
              {suggestions.map(s => {
                const meta = NETWORK_META[s.network as ScienceNetwork];
                const Icon = meta.icon;
                const id = `${s.profile_id}-${s.network}`;
                const busy = busyId === id;
                const fuzzy = s.confidence === 'fuzzy' || s.homonym_count > 1;
                return (
                  <div
                    key={id}
                    className="rounded-xl border border-border/60 bg-card p-3 flex items-start gap-3"
                  >
                    <div className={`h-10 w-10 rounded-lg ring-1 ${meta.badgeRing} ${meta.badgeBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${meta.badgeText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {s.prenom} {s.nom}
                        </span>
                        {s.ville && <span className="text-xs text-muted-foreground">· {s.ville}</span>}
                        <Badge variant="outline" className={`text-[10px] ${meta.badgeText} ${meta.badgeRing}`}>
                          {meta.label}
                        </Badge>
                        {fuzzy && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40 gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {s.homonym_count} homonymes
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        « {s.observer_name} » · <strong>{s.observer_count}</strong> obs ·{' '}
                        <strong>{s.species_count}</strong> esp. · MAJ {fmtDate(s.last_observation_date)}
                      </div>
                      {s.sample_url && (
                        <a
                          href={s.sample_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Voir une observation
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleLink(s)}
                        disabled={busy || bulk}
                        className="h-7 text-xs"
                      >
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Link2 className="h-3 w-3 mr-1" />Lier</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleIgnore(s)}
                        disabled={busy || bulk}
                        className="h-7 text-xs text-muted-foreground"
                      >
                        <X className="h-3 w-3 mr-1" /> Ignorer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SuggestionsDrawer;
