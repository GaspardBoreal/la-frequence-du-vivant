import React, { useState } from 'react';
import { Sparkles, Link2, X, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NETWORK_META, type ScienceNetwork } from '@/types/scienceAccounts';
import {
  useScienceAccountSuggestions,
  useLinkSuggestion,
  useIgnoreSuggestion,
} from '@/hooks/useScienceAccountSuggestions';

interface Props {
  profileId: string;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

export const ProfileSuggestionsList: React.FC<Props> = ({ profileId }) => {
  const { data: all = [], isLoading } = useScienceAccountSuggestions();
  const link = useLinkSuggestion();
  const ignore = useIgnoreSuggestion();
  const [busy, setBusy] = useState<string | null>(null);

  const suggestions = all.filter(s => s.profile_id === profileId);
  if (isLoading || suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
        <Sparkles className="h-3.5 w-3.5" />
        Suggestion{suggestions.length > 1 ? 's' : ''} détectée{suggestions.length > 1 ? 's' : ''}
      </div>
      {suggestions.map(s => {
        const meta = NETWORK_META[s.network as ScienceNetwork];
        const Icon = meta.icon;
        const id = `${s.profile_id}-${s.network}`;
        const isBusy = busy === id;
        const fuzzy = s.confidence === 'fuzzy' || s.homonym_count > 1;
        return (
          <div key={id} className="flex items-start gap-2 rounded-lg bg-background/60 p-2">
            <div className={`h-8 w-8 rounded-md ring-1 ${meta.badgeRing} ${meta.badgeBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-4 w-4 ${meta.badgeText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-medium">{meta.label}</span>
                <span className="text-muted-foreground">« {s.observer_name} »</span>
                {fuzzy && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40 gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" /> homonyme
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {s.observer_count} obs · {s.species_count} esp · MAJ {fmtDate(s.last_observation_date)}
                {s.sample_url && (
                  <a
                    href={s.sample_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    <ExternalLink className="h-2.5 w-2.5" /> exemple
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={async () => { setBusy(id); try { await link.mutateAsync(s); } finally { setBusy(null); } }}
                disabled={isBusy}
              >
                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Link2 className="h-3 w-3 mr-1" />Lier</>}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] px-2 text-muted-foreground"
                onClick={async () => { setBusy(id); try { await ignore.mutateAsync(s); } finally { setBusy(null); } }}
                disabled={isBusy}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileSuggestionsList;
