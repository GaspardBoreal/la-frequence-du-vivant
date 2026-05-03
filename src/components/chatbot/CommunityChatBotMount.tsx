import { useLocation, useParams, matchPath } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ChatBot } from './ChatBot';
import type { ChatContext } from './chatConfig';
import type { ChatEntity } from '@/hooks/useChatPageContext';
import { useCanUseContextualChat } from '@/hooks/useCanUseContextualChat';
import { supabase } from '@/integrations/supabase/client';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Routes publiques où le chatbot contextuel est disponible. */
const COMMUNITY_ROUTE_PATTERNS = [
  '/galerie-fleuve',
  '/galerie-fleuve/exploration/:slug/*',
  '/galerie-fleuve/exploration/:slug',
  '/explorations/:slug',
  '/explorations/:slug/*',
  '/marche/:slug',
  '/marches/:id',
  '/traversees/:slug',
  '/traversees',
  '/marcheur/:slug/carnet',
];

function isCommunityRoute(pathname: string): boolean {
  // Exclure /admin (le AdminChatBotMount s'en charge)
  if (pathname.startsWith('/admin')) return false;
  return COMMUNITY_ROUTE_PATTERNS.some((p) => matchPath({ path: p, end: false }, pathname));
}

function detectContext(pathname: string): ChatContext {
  if (pathname.includes('/exploration/') || pathname.startsWith('/explorations/') || pathname.startsWith('/galerie-fleuve')) {
    return 'exploration';
  }
  if (pathname.startsWith('/marche/') || pathname.startsWith('/marches/')) return 'marches';
  if (pathname.startsWith('/marcheur/')) return 'community';
  return 'exploration';
}

/** Hook : résout un slug d'exploration en id (uuid) via cache supabase. */
function useExplorationIdFromSlug(slug: string | undefined): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    if (!slug) {
      setId(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('explorations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setId(data?.id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return id;
}

/** Hook : résout un slug de marche-event vers son id. */
function useMarcheEventIdFromSlug(slug: string | undefined): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    if (!slug) {
      setId(null);
      return;
    }
    if (UUID_RE.test(slug)) {
      setId(slug);
      return;
    }
    let cancelled = false;
    // Marches publiques : MarcheDetail utilise marches.slug ; on cherche d'abord
    // un marche_event lié, sinon on retourne null (la fiche d'événement
    // n'est pas systématiquement reliée à une marche publique).
    supabase
      .from('marche_events')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setId(data?.id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return id;
}

function CommunityChatBotInner() {
  const location = useLocation();
  const { role } = useCanUseContextualChat();

  // Extraction de slugs des routes connues
  const explorationMatch =
    matchPath({ path: '/galerie-fleuve/exploration/:slug/*', end: false }, location.pathname) ||
    matchPath({ path: '/explorations/:slug/*', end: false }, location.pathname);
  const marcheMatch =
    matchPath({ path: '/marche/:slug', end: false }, location.pathname) ||
    matchPath({ path: '/marches/:id', end: false }, location.pathname);

  const explorationSlug = (explorationMatch?.params as any)?.slug as string | undefined;
  const marcheSlug = (marcheMatch?.params as any)?.slug || (marcheMatch?.params as any)?.id;

  const explorationId = useExplorationIdFromSlug(explorationSlug);
  const marcheEventId = useMarcheEventIdFromSlug(marcheSlug);

  const context = useMemo(() => detectContext(location.pathname), [location.pathname]);

  const urlEntity: ChatEntity | null = useMemo(() => {
    if (explorationId) return { type: 'exploration', id: explorationId };
    if (marcheEventId) return { type: 'marche_event', id: marcheEventId };
    return null;
  }, [explorationId, marcheEventId]);

  const roleBadge =
    role === 'admin' ? 'Admin' : role === 'ambassadeur' ? 'Ambassadeur' : role === 'sentinelle' ? 'Sentinelle' : null;

  // Remount on context+entity change
  const entityKey = urlEntity ? `${urlEntity.type}:${urlEntity.id}` : 'none';
  return (
    <ChatBot
      key={`community-${context}-${entityKey}`}
      currentContext={context}
      urlEntity={urlEntity}
      edgeFunctionPath="community-chat"
      assistantNameOverride="Compagnon du Vivant"
      roleBadge={roleBadge}
    />
  );
}

export function CommunityChatBotMount() {
  const location = useLocation();
  const { canUse, isLoading } = useCanUseContextualChat();

  if (isLoading) return null;
  if (!canUse) return null;
  if (!isCommunityRoute(location.pathname)) return null;

  return <CommunityChatBotInner />;
}
