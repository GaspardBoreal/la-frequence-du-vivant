import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, CalendarDays, ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import TourStatusBadge from './TourStatusBadge';
import NewTourDialog from './NewTourDialog';
import type { ProprieteTour, TourStatut } from '@/hooks/propriete/useProprieteTours';

type Period = '3m' | '12m' | 'all' | 'custom';

interface Props {
  tours: ProprieteTour[];
  isLoading?: boolean;
  onOpen: (tour: ProprieteTour) => void;
  onCreate: (input: {
    titre: string;
    date_tour: string;
    intention?: string | null;
    statut?: TourStatut;
    duree_min?: number | null;
  }) => Promise<unknown>;
  onSuggest: () => void;
  suggesting?: boolean;
}

const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Index texte + comptage des actions, pour la recherche « mot contient ». */
function useToursActionsIndex(tourIds: string[]) {
  const key = tourIds.slice().sort().join(',');
  return useQuery<Record<string, { text: string; total: number; done: number }>>({
    queryKey: ['propriete-tours-actions-index', key],
    enabled: tourIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('propriete_tour_actions')
        .select('tour_id, titre, detail, done')
        .in('tour_id', tourIds);
      if (error) throw error;
      const out: Record<string, { text: string; total: number; done: number }> = {};
      for (const r of (data ?? []) as any[]) {
        const e = (out[r.tour_id] ??= { text: '', total: 0, done: 0 });
        e.text += ` ${r.titre ?? ''} ${r.detail ?? ''}`;
        e.total += 1;
        if (r.done) e.done += 1;
      }
      return out;
    },
  });
}

export const TourList: React.FC<Props> = ({
  tours,
  isLoading,
  onOpen,
  onCreate,
  onSuggest,
  suggesting,
}) => {
  const [q, setQ] = React.useState('');
  const [period, setPeriod] = React.useState<Period>('all');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  const { data: index } = useToursActionsIndex(tours.map((t) => t.id));

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    if (period === '3m') start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    if (period === '12m') start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    if (period === 'custom') {
      start = from ? new Date(`${from}T00:00:00`) : null;
      end = to ? new Date(`${to}T23:59:59`) : null;
    }

    return tours.filter((t) => {
      const d = new Date(`${t.date_tour}T12:00:00`);
      if (start && d < start) return false;
      if (end && d > end) return false;
      if (!needle) return true;
      const hay = [
        t.titre,
        t.intention ?? '',
        t.notes ?? '',
        ...t.points_forts,
        ...t.potentiels,
        index?.[t.id]?.text ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [tours, q, period, from, to, index]);

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un mot (titre, note, action)…"
            className="pl-8"
            aria-label="Rechercher dans les tours de jardin"
          />
        </div>
        <NewTourDialog onCreate={onCreate} />
        <Button size="sm" onClick={onSuggest} disabled={suggesting}>
          <Sparkles className="h-4 w-4 mr-1.5" />
          {suggesting ? 'L\u2019IA réfléchit…' : 'Proposer un tour'}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
        <div className="flex gap-1.5">
          {([
            ['3m', '3 mois'],
            ['12m', '12 mois'],
            ['all', 'Tout'],
            ['custom', 'Période…'],
          ] as [Period, string][]).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setPeriod(v)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                period === v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="tour-from" className="text-[11px] text-muted-foreground">Du</Label>
              <Input id="tour-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tour-to" className="text-[11px] text-muted-foreground">Au</Label>
              <Input id="tour-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-[150px]" />
            </div>
          </div>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Chargement des tours…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun tour ne correspond. Créez-en un, ou demandez une proposition à l'IA de Jardin.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => {
            const stats = index?.[t.id];
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen(t)}
                  className="w-full text-left rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{t.titre}</span>
                    <TourStatusBadge statut={t.statut} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />{fmtDate(t.date_tour)}
                    </span>
                    {stats && (
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5" />{stats.done}/{stats.total} action(s)
                      </span>
                    )}
                    {t.source === 'ia' && <span className="text-primary">proposé par l'IA</span>}
                  </div>
                  {t.intention && (
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{t.intention}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TourList;
