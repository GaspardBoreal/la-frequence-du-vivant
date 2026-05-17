import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import RadiusSelector from '@/components/biodiversity/RadiusSelector';
import { useUpdateExplorationDefaultRadius } from '@/hooks/useUpdateRadius';
import { Info } from 'lucide-react';

interface Props {
  explorationId?: string;
  userRole?: string;
  fallbackSnapshotRadiusM?: number | null;
}

/**
 * Bloc « Rayon par défaut de l'exploration ».
 * - Lecture pour tous (avec affichage du rayon résolu).
 * - Édition pour admin / sentinelle / ambassadeur.
 * - N'écrase pas les overrides par marche, ne déclenche pas de re-collecte.
 */
const ExplorationDefaultRadiusBlock: React.FC<Props> = ({
  explorationId,
  userRole,
  fallbackSnapshotRadiusM,
}) => {
  const canEdit = userRole === 'admin' || userRole === 'sentinelle' || userRole === 'ambassadeur';
  const updateMut = useUpdateExplorationDefaultRadius();

  const { data: explo } = useQuery({
    queryKey: ['exploration-radius', explorationId],
    queryFn: async () => {
      if (!explorationId) return null;
      const { data } = await supabase
        .from('explorations')
        .select('id, default_radius_m')
        .eq('id', explorationId)
        .maybeSingle();
      return data as { id: string; default_radius_m: number | null } | null;
    },
    enabled: !!explorationId,
  });

  const persistedKm = explo?.default_radius_m != null
    ? explo.default_radius_m / 1000
    : (fallbackSnapshotRadiusM ? fallbackSnapshotRadiusM / 1000 : 0.5);

  const [value, setValue] = useState(persistedKm);
  useEffect(() => { setValue(persistedKm); }, [persistedKm]);

  const isDirty = Math.abs(value - persistedKm) > 1e-6;
  const isSet = explo?.default_radius_m != null;

  return (
    <div className="mb-4 space-y-2 rounded-2xl border border-border bg-card/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
        <Info className="w-3 h-3 text-emerald-500/70" />
        <span>Rayon d'observation par défaut de l'exploration</span>
      </div>
      <RadiusSelector value={value} onChange={setValue} readOnly={!canEdit || !explorationId} />
      {canEdit && explorationId && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">
            {isSet
              ? <>Défaut actuel : <strong>{Math.round(persistedKm * 1000)} m</strong></>
              : <>Aucun défaut défini (fallback 500 m)</>}
            {' · '}Appliqué aux marches sans rayon personnalisé.
          </span>
          {isDirty && (
            <button
              onClick={() => updateMut.mutate({ explorationId, radiusM: Math.round(value * 1000) })}
              disabled={updateMut.isPending}
              className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              Enregistrer comme défaut
            </button>
          )}
          {isSet && (
            <button
              onClick={() => updateMut.mutate({ explorationId, radiusM: null })}
              disabled={updateMut.isPending}
              className="px-2.5 py-1 rounded-full bg-background/40 border border-border/40 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Retirer le défaut
            </button>
          )}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground/60">
        Ne déclenche pas de nouvelle collecte. La prochaine collecte manuelle utilisera ces valeurs.
      </p>
    </div>
  );
};

export default ExplorationDefaultRadiusBlock;
