import { useCallback } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useAuth } from '@/hooks/useAuth';

/**
 * Trace les usages d'un jardin (module ouvert, action réalisée) afin de
 * reconstituer le parcours d'un marcheur dans la console d'administration.
 */
export function useProprieteTracker(proprieteId: string | undefined) {
  const { trackActivity } = useActivityTracker();
  const { user } = useAuth();

  return useCallback(
    (module: string, action = 'ouverture', cible?: string) => {
      if (!user?.id || !proprieteId) return;
      trackActivity(user.id, 'propriete_view', `${module}${cible ? `:${cible}` : ''}`, {
        proprieteId,
        metadata: { module, action, cible: cible ?? null },
      });
    },
    [proprieteId, trackActivity, user?.id],
  );
}

export default useProprieteTracker;
