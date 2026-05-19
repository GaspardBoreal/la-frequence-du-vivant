import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, AlertTriangle, ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  marches: Array<{ id: string; nomMarche?: string; ville: string }>;
}

interface HistoryRow {
  id: string;
  marche_id: string;
  total_species: number | null;
  archived_at: string;
  original_created_at: string | null;
  delta_species: any;
  archive_reason: string | null;
}

/**
 * Affiche, par marche, l'historique des snapshots biodiversité :
 * - chaque version archivée avec le delta (+ ajoutées / − retirées)
 * - les snapshots mis en QUARANTAINE par le garde-fou anti-régression
 *
 * Source : table `biodiversity_snapshots_history` (admin-only via RLS).
 */
export default function BiodiversityHistoryTimeline({ marches }: Props) {
  const marcheIds = marches.map((m) => m.id);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['biodiv-snapshot-history', marcheIds],
    queryFn: async (): Promise<HistoryRow[]> => {
      if (marcheIds.length === 0) return [];
      const { data, error } = await supabase
        .from('biodiversity_snapshots_history' as any)
        .select('id, marche_id, total_species, archived_at, original_created_at, delta_species, archive_reason')
        .in('marche_id', marcheIds)
        .order('archived_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: marcheIds.length > 0,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Chargement de l'historique biodiversité…
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <History className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
          <div className="text-sm text-muted-foreground">
            Aucun historique de snapshot biodiversité pour les marches sélectionnées.
            <br />
            <span className="text-xs">L'historique se construit automatiquement à chaque resynchronisation iNaturalist (à partir de maintenant).</span>
          </div>
        </div>
      </Card>
    );
  }

  // Group by marche_id
  const byMarche = new Map<string, HistoryRow[]>();
  rows.forEach((r) => {
    const arr = byMarche.get(r.marche_id) ?? [];
    arr.push(r);
    byMarche.set(r.marche_id, arr);
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Historique des snapshots biodiversité</h3>
        <Badge variant="secondary" className="ml-auto">{rows.length} version{rows.length > 1 ? 's' : ''}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Chaque resynchronisation iNaturalist conserve une version précédente avec le diff des espèces.
        Les snapshots en <strong>quarantaine</strong> ont été rejetés automatiquement (régression &gt; 15 %) :
        la version précédente reste affichée à l'utilisateur.
      </p>
      <div className="space-y-3">
        {marches.map((m) => {
          const list = byMarche.get(m.id);
          if (!list || list.length === 0) return null;
          return (
            <MarcheHistoryCard
              key={m.id}
              title={m.nomMarche || m.ville}
              rows={list}
            />
          );
        })}
      </div>
    </Card>
  );
}

function MarcheHistoryCard({ title, rows }: { title: string; rows: HistoryRow[] }) {
  const [open, setOpen] = useState(false);
  const lastRegression = rows.find((r) => (r.archive_reason || '').startsWith('quarantine'));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card/50">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent/50 rounded-lg transition">
            {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="font-medium truncate">{title}</span>
            <Badge variant="outline" className="ml-auto">{rows.length} version{rows.length > 1 ? 's' : ''}</Badge>
            {lastRegression && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                quarantaine
              </Badge>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 pt-0 space-y-2">
            {rows.map((r) => (
              <HistoryRowItem key={r.id} row={r} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function HistoryRowItem({ row }: { row: HistoryRow }) {
  const [showLists, setShowLists] = useState(false);
  const delta = row.delta_species || {};
  const added: string[] = Array.isArray(delta.added) ? delta.added : [];
  const removed: string[] = Array.isArray(delta.removed) ? delta.removed : [];
  const reason = row.archive_reason || '';
  const isQuarantine = reason.startsWith('quarantine');
  const prevTotal = delta.prev_total ?? row.total_species ?? null;
  const newTotal = delta.new_total ?? null;
  const regressionPct = delta.regression_pct;

  return (
    <div className={`rounded-md border p-2.5 text-sm ${isQuarantine ? 'border-destructive/40 bg-destructive/5' : 'bg-background'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.archived_at), { addSuffix: true, locale: fr })}
        </span>
        {prevTotal != null && newTotal != null && (
          <Badge variant={isQuarantine ? 'destructive' : 'secondary'} className="font-mono text-xs">
            {prevTotal} → {newTotal}
          </Badge>
        )}
        {regressionPct != null && regressionPct > 0 && (
          <span className={`text-xs ${isQuarantine ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            −{Math.round(regressionPct * 100)} %
          </span>
        )}
        {added.length > 0 && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3" /> {added.length}
          </span>
        )}
        {removed.length > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
            <ArrowDownRight className="h-3 w-3" /> {removed.length}
          </span>
        )}
        {(added.length > 0 || removed.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 text-xs"
            onClick={() => setShowLists((v) => !v)}
          >
            {showLists ? 'Masquer' : 'Voir les espèces'}
          </Button>
        )}
      </div>
      {isQuarantine && (
        <p className="text-xs text-destructive mt-1.5">
          ⚠️ Snapshot rejeté automatiquement : la version précédente reste affichée.
        </p>
      )}
      {showLists && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {removed.length > 0 && (
            <div>
              <div className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Disparues ({removed.length})
              </div>
              <ul className="space-y-0.5 max-h-48 overflow-auto">
                {removed.map((s) => (
                  <li key={s} className="italic text-muted-foreground">{s}</li>
                ))}
              </ul>
            </div>
          )}
          {added.length > 0 && (
            <div>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Ajoutées ({added.length})
              </div>
              <ul className="space-y-0.5 max-h-48 overflow-auto">
                {added.map((s) => (
                  <li key={s} className="italic text-muted-foreground">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
