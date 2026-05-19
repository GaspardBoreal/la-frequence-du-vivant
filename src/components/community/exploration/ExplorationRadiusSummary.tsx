import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Crosshair, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useExplorationMarchesRadius,
  type MarcheRadiusRow,
} from '@/hooks/useExplorationMarchesRadius';
import {
  useUpdateMarcheRadius,
  useUpdateExplorationDefaultRadius,
  useBulkUpdateMarchesRadius,
} from '@/hooks/useUpdateRadius';
import { useTriggerBiodiversityCollection } from '@/hooks/useTriggerBiodiversityCollection';
import RadiusPresetPopover from './RadiusPresetPopover';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RADIUS_OPTIONS } from '@/components/biodiversity/RadiusSelector';

interface Props {
  explorationId?: string;
  userRole?: string;
}

const formatM = (m: number) =>
  m >= 1000 ? `${(m / 1000).toString().replace(/\.0$/, '')} km` : `${m} m`;
const areaKm2 = (m: number) => {
  const km = m / 1000;
  return (Math.PI * km * km).toFixed(km < 0.5 ? 3 : 2);
};
const formatDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const ExplorationRadiusSummary: React.FC<Props> = ({ explorationId, userRole }) => {
  const canEdit = userRole === 'admin' || userRole === 'sentinelle' || userRole === 'ambassadeur';
  const [expanded, setExpanded] = useState(false);
  const [bulkRadius, setBulkRadius] = useState<number | null | undefined>(undefined);

  const { data } = useExplorationMarchesRadius(explorationId);
  const updateOne = useUpdateMarcheRadius();
  const updateDefault = useUpdateExplorationDefaultRadius();
  const bulkUpdate = useBulkUpdateMarchesRadius();
  const triggerCollection = useTriggerBiodiversityCollection();

  // Debounce pour grouper les changements unitaires successifs en un seul appel collect.
  const pendingIds = useRef<Set<string>>(new Set());
  const debounceTimer = useRef<number | null>(null);

  const scheduleRecollect = (marcheIds: string[]) => {
    if (!explorationId) return;
    marcheIds.forEach(id => pendingIds.current.add(id));
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      const ids = Array.from(pendingIds.current);
      pendingIds.current.clear();
      debounceTimer.current = null;
      const tId = toast.loading(
        ids.length > 1
          ? `Recalcul des taxons sur ${ids.length} marches…`
          : 'Recalcul des taxons…',
      );
      triggerCollection.mutate(
        { explorationId, force: true, marcheIds: ids },
        {
          onSuccess: (res) => {
            toast.success(
              `${res.totalSpecies ?? 0} espèces · ${res.marchesProcessed ?? 0} marches recalculées`,
              { id: tId },
            );
          },
          onError: (err) => {
            toast.error(err?.message || 'Échec du recalcul des taxons', { id: tId });
          },
        },
      );
    }, 800);
  };

  const handlePickOne = (row: MarcheRadiusRow, m: number | null) => {
    if (!explorationId) return;
    updateOne.mutate(
      { marcheId: row.marcheId, radiusM: m },
      { onSuccess: () => scheduleRecollect([row.marcheId]) },
    );
  };

  const handleBulkConfirm = () => {
    if (!explorationId || !data) return;
    const ids = data.rows.map(r => r.marcheId);
    if (!ids.length) {
      setBulkRadius(undefined);
      return;
    }
    bulkUpdate.mutate(
      { marcheIds: ids, radiusM: bulkRadius ?? null },
      {
        onSuccess: () => {
          setBulkRadius(undefined);
          scheduleRecollect(ids);
        },
      },
    );
  };

  const stats = useMemo(() => {
    if (!data || data.count === 0) return null;
    return {
      count: data.count,
      avg: data.avgM,
      min: data.minM,
      max: data.maxM,
      defaultM: data.defaultRadiusM,
    };
  }, [data]);

  if (!explorationId) return null;

  const summaryLine = stats ? (
    <>
      <span className="font-medium text-foreground/80">
        {stats.count} marche{stats.count > 1 ? 's' : ''}
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span>moy. {formatM(stats.avg)}</span>
      {stats.min !== stats.max && (
        <>
          <span className="text-muted-foreground/50">·</span>
          <span>
            {formatM(stats.min)} – {formatM(stats.max)}
          </span>
        </>
      )}
    </>
  ) : (
    <span className="text-muted-foreground">Chargement…</span>
  );

  return (
    <div className="mb-4 rounded-xl border border-border/40 bg-card/30 overflow-hidden">
      {/* Bandeau replié */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-foreground/70 hover:bg-card/50 transition-colors"
      >
        <Crosshair className="w-3.5 h-3.5 text-emerald-500/70 flex-shrink-0" />
        <span className="text-foreground/60">Rayons d'observation</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1.5 flex-wrap">{summaryLine}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 ml-auto text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && data && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-border/30"
          >
            <div className="p-3 space-y-3">
              {/* Barre actions + défaut exploration */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {canEdit && data.rows.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      >
                        Appliquer à toutes les marches…
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                      <div className="grid grid-cols-3 gap-1">
                        {RADIUS_OPTIONS.map(opt => {
                          const m = Math.round(opt.value * 1000);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setBulkRadius(m)}
                              className="px-2.5 py-1 rounded-full text-[11px] border border-border/40 bg-background text-foreground/70 hover:bg-muted transition-colors"
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBulkRadius(null)}
                        className="mt-2 w-full text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        Retirer tous les overrides (utiliser le défaut)
                      </button>
                    </PopoverContent>
                  </Popover>
                )}
                <span className="text-muted-foreground/70">
                  Défaut exploration :{' '}
                  <span className="text-foreground/70">
                    {data.defaultRadiusM ? formatM(data.defaultRadiusM) : '500 m (fallback)'}
                  </span>
                </span>
                {canEdit && (
                  <RadiusPresetPopover
                    valueM={data.defaultRadiusM ?? 500}
                    isOverride={data.defaultRadiusM != null}
                    onPick={(m) =>
                      updateDefault.mutate({ explorationId, radiusM: m })
                    }
                    allowClearOverride={data.defaultRadiusM != null}
                  />
                )}
                {(updateOne.isPending ||
                  bulkUpdate.isPending ||
                  triggerCollection.isPending) && (
                  <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {triggerCollection.isPending ? 'Recalcul…' : 'Enregistrement…'}
                  </span>
                )}
              </div>

              {/* Tableau compact */}
              <div className="rounded-lg border border-border/30 overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-normal w-8">#</th>
                      <th className="text-left px-2 py-1.5 font-normal">Marche</th>
                      <th className="text-left px-2 py-1.5 font-normal w-12 hidden sm:table-cell">
                        Date
                      </th>
                      <th className="text-left px-2 py-1.5 font-normal w-20">Rayon</th>
                      <th className="text-right px-2 py-1.5 font-normal w-20 hidden sm:table-cell">
                        Zone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr
                        key={row.marcheId}
                        className="border-t border-border/20 hover:bg-muted/10"
                      >
                        <td className="px-2 py-1.5 text-muted-foreground">{row.ordre || '·'}</td>
                        <td className="px-2 py-1.5 text-foreground/80 truncate max-w-[12rem]">
                          {row.nom}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground hidden sm:table-cell">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-2 py-1.5">
                          <RadiusPresetPopover
                            valueM={row.resolvedRadiusM}
                            isOverride={row.isOverride}
                            readOnly={!canEdit}
                            onPick={(m) => handlePickOne(row, m)}
                            allowClearOverride={row.isOverride}
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right text-muted-foreground hidden sm:table-cell">
                          {areaKm2(row.resolvedRadiusM)} km²
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-muted-foreground/60">
                Tout changement relance automatiquement la collecte des taxons sur les
                marches concernées.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation bulk */}
      <AlertDialog
        open={bulkRadius !== undefined}
        onOpenChange={(o) => !o && setBulkRadius(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkRadius == null
                ? 'Retirer tous les rayons personnalisés ?'
                : `Définir ${formatM(bulkRadius)} pour toutes les marches ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkRadius == null
                ? 'Toutes les marches reprendront le rayon par défaut de l’exploration. La collecte des taxons sera automatiquement relancée.'
                : `Les ${data?.rows.length ?? 0} marches de cette exploration utiliseront ce rayon. Les valeurs personnalisées existantes seront remplacées et la collecte des taxons sera automatiquement relancée.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExplorationRadiusSummary;
