import { useCallback } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';

/**
 * Trace les usages d'un jardin (module ouvert, action réalisée) afin de
 * reconstituer le parcours d'un marcheur dans la console d'administration.
 * L'identité provient de la connexion communauté, celle utilisée sur /propriete/...
 */
export function useProprieteTracker(proprieteId: string | undefined, proprieteNom?: string | null) {
  const { trackActivity } = useActivityTracker();
  const { user } = useCommunityAuth();

  return useCallback(
    (
      module: string,
      action = 'ouverture',
      cible?: string | null,
      extra?: Record<string, unknown>,
    ) => {
      if (!user?.id || !proprieteId) return;
      trackActivity(user.id, 'propriete_view', `${module}${cible ? `:${cible}` : ''}`, {
        proprieteId,
        metadata: {
          module,
          action,
          cible: cible ?? null,
          propriete_nom: proprieteNom ?? null,
          ...extra,
        },
      });
    },
    [proprieteId, proprieteNom, trackActivity, user?.id],
  );
}

export default useProprieteTracker;
