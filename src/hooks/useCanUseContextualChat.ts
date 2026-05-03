import { useAuth } from '@/hooks/useAuth';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';

export type ContextualChatRole = 'admin' | 'ambassadeur' | 'sentinelle' | null;

/**
 * Détermine si l'utilisateur connecté peut voir le chatbot IA contextuel
 * sur les pages publiques (galerie, marches, traversées, explorations).
 *
 * Autorisé : Admin, Ambassadeur, Sentinelle.
 * Côté serveur, l'edge function `community-chat` revérifie via
 * `has_community_chat_access` (défense en profondeur).
 */
export function useCanUseContextualChat(): {
  canUse: boolean;
  role: ContextualChatRole;
  isLoading: boolean;
} {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { profile, loading: communityLoading } = useCommunityAuth();

  const communityRole = profile?.role?.toLowerCase() ?? null;
  let role: ContextualChatRole = null;
  if (isAdmin) role = 'admin';
  else if (communityRole === 'ambassadeur') role = 'ambassadeur';
  else if (communityRole === 'sentinelle') role = 'sentinelle';

  return {
    canUse: role !== null,
    role,
    isLoading: authLoading || communityLoading,
  };
}
