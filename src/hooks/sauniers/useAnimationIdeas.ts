import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fallbackIdees, type IdeesPoint } from '@/content/sauniers/animationsFallback';
import type { Segment } from '@/content/sauniers/parcoursPropose';

/** Cache mémoire par point, le temps de la session. */
const cache = new Map<string, IdeesPoint>();

export interface PointInput {
  id: string;
  nom: string;
  sous: string;
  texte: string;
  segment: Segment;
}

export function useAnimationIdeas(point: PointInput | null) {
  const [idees, setIdees] = React.useState<IdeesPoint | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [secours, setSecours] = React.useState(false);

  React.useEffect(() => {
    if (!point) {
      setIdees(null);
      setSecours(false);
      return;
    }
    const cached = cache.get(point.id);
    setIdees(cached ?? null);
    setSecours(false);
  }, [point?.id]);

  const generer = React.useCallback(
    async (force = false) => {
      if (!point) return;
      if (!force && cache.has(point.id)) {
        setIdees(cache.get(point.id)!);
        return;
      }
      setLoading(true);
      setSecours(false);
      try {
        const { data, error } = await supabase.functions.invoke('sauniers-animation-ideas', {
          body: {
            nom: point.nom,
            sous: point.sous,
            texte: point.texte,
            segment: point.segment,
          },
        });
        if (error || !data || (data as any).error || !(data as any).lieu) {
          throw new Error((data as any)?.error ?? error?.message ?? 'IA indisponible');
        }
        const result = data as IdeesPoint;
        cache.set(point.id, result);
        setIdees(result);
      } catch {
        const repli = fallbackIdees(point.nom, point.segment);
        setIdees(repli);
        setSecours(true);
      } finally {
        setLoading(false);
      }
    },
    [point?.id, point?.nom, point?.sous, point?.texte, point?.segment],
  );

  return { idees, loading, secours, generer };
}

export default useAnimationIdeas;
