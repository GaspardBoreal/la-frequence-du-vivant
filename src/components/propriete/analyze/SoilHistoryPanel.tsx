import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Loader2, RotateCcw, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

const PAGE_SIZES = [10, 25, 50, 100];

interface SoilVersion {
  id: string;
  changed_at: string;
  samples_count: number | null;
  snapshot: any;
}

/** Nombre de valeurs renseignées dans un registre (mesure de « matière »). */
const countValues = (samples: SoilSample[] = []) =>
  samples.reduce((n, s) => {
    let c = 0;
    if (s.location) c++;
    if (s.lat != null && s.lng != null) c++;
    if (s.structure_result) c++;
    if (s.texture_result) c++;
    if (typeof s.ph_value === 'number') c++;
    if ((s.life_signs?.length ?? 0) > 0 || typeof s.worm_count === 'number') c++;
    return n + c;
  }, 0);

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Boîte noire du registre des prélèvements : liste des versions archivées
 * et restauration explicite d'une version antérieure.
 */
export const SoilHistoryPanel: React.FC<{ proprieteId?: string }> = ({ proprieteId }) => {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<SoilVersion | null>(null);
  const [restoring, setRestoring] = React.useState(false);
  const [pageSize, setPageSize] = React.useState(25);
  const [page, setPage] = React.useState(1);

  const { data: versions = [], isLoading } = useQuery<SoilVersion[]>({
    queryKey: ['propriete-soil-history', proprieteId],
    enabled: !!proprieteId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_soil_diagnostics_history' as any)
        .select('id, changed_at, samples_count, snapshot')
        .eq('propriete_id', proprieteId!)
        .order('changed_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const pageCount = Math.max(1, Math.ceil(versions.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const from = versions.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, versions.length);
  const pageVersions = versions.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, proprieteId]);

  const restore = async (v: SoilVersion) => {
    if (!proprieteId) return;
    setRestoring(true);
    const snap = v.snapshot ?? {};
    const { error } = await supabase.rpc('upsert_propriete_soil' as any, {
      p_propriete_id: proprieteId,
      p_terrain_status: snap.terrain_status ?? null,
      p_samples: (Array.isArray(snap.samples) ? snap.samples : []) as any,
      p_structure: snap.structure ?? null,
      p_texture: snap.texture ?? null,
      p_boudin_shape: snap.boudin_shape ?? null,
      p_ph: snap.ph ?? null,
      p_life_signs: snap.life_signs ?? [],
      p_synthesis: snap.synthesis ?? null,
      p_completed: null,
      // Restauration explicite : on lève le garde-fou de non-régression.
      p_allow_destructive: true,
    });
    setRestoring(false);
    setPending(null);
    if (error) {
      toast.error('Restauration impossible', { description: error.message });
      return;
    }
    await qc.invalidateQueries({ queryKey: ['propriete-soil', proprieteId] });
    await qc.invalidateQueries({ queryKey: ['propriete-soil-history', proprieteId] });
    toast.success(`Registre restauré à la version du ${fmt(v.changed_at)}`);
  };

  if (!proprieteId) return null;

  return (
    <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
          <History className="w-4 h-4 text-[hsl(var(--ds-forest))]" />
          Historique du registre
        </span>
        <span className="text-[11px] text-[hsl(var(--ds-forest))]/70">
          {open ? 'Masquer' : 'Voir les versions archivées'}
        </span>
      </button>

      {open && (
        <div className="border-t border-[hsl(var(--ds-line))] px-4 py-3">
          <p className="mb-3 inline-flex items-start gap-1.5 text-[11px] leading-snug text-[hsl(var(--ds-forest))]/75">
            <Shield className="mt-0.5 w-3 h-3 flex-shrink-0" />
            Chaque enregistrement du registre est archivé. En cas de perte, restaurez la
            version voulue : rien n'est jamais définitivement effacé.
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-[hsl(var(--ds-forest))]/70">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des versions…
            </div>
          ) : versions.length === 0 ? (
            <p className="py-2 text-xs text-[hsl(var(--ds-forest))]/60">
              Aucune version archivée pour l'instant.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {pageVersions.map((v) => {
                const samples: SoilSample[] = Array.isArray(v.snapshot?.samples)
                  ? v.snapshot.samples
                  : [];
                return (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[hsl(var(--ds-forest-deep))]">
                        {fmt(v.changed_at)}
                      </div>
                      <div className="text-[11px] text-[hsl(var(--ds-forest))]/70">
                        {v.samples_count ?? samples.length} prélèvement
                        {(v.samples_count ?? samples.length) > 1 ? 's' : ''} ·{' '}
                        {countValues(samples)} valeurs ·{' '}
                        {samples.filter((s) => s.lat != null && s.lng != null).length} géolocalisés
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 text-[11px]"
                      onClick={() => setPending(v)}
                    >
                      <RotateCcw className="w-3 h-3" /> Restaurer
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          {versions.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 border-t border-[hsl(var(--ds-line))] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[11px] tabular-nums text-[hsl(var(--ds-forest))]/70">
                {from}–{to} sur {versions.length} version{versions.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="min-w-[52px] text-center text-[11px] tabular-nums text-[hsl(var(--ds-forest-deep))]">
                  {safePage} / {pageCount}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(safePage + 1)}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-7 w-[78px] text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)} className="text-xs">
                        {s} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer cette version du registre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le registre actuel sera remplacé par la version du{' '}
              {pending ? fmt(pending.changed_at) : ''}. La version actuelle reste archivée :
              vous pourrez revenir en arrière.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={restoring}
              onClick={(e) => {
                e.preventDefault();
                if (pending) restore(pending);
              }}
            >
              {restoring ? 'Restauration…' : 'Restaurer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SoilHistoryPanel;
