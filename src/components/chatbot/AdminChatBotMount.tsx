import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ChatBot } from './ChatBot';
import type { ChatContext } from './chatConfig';
import type { ChatEntity } from '@/hooks/useChatPageContext';

/**
 * Détecte le contexte admin depuis l'URL et monte le ChatBot
 * uniquement sur les routes /admin/* pour les administrateurs authentifiés.
 */
function detectContext(pathname: string): ChatContext {
  if (pathname.startsWith('/admin/marche-events')) return 'events';
  if (pathname.startsWith('/admin/community')) return 'community';
  if (pathname.startsWith('/admin/marches')) return 'marches';
  if (pathname.startsWith('/admin/exportations')) return 'exportations';
  if (pathname.startsWith('/admin/outils')) return 'outils';
  if (pathname.startsWith('/admin')) return 'dashboard';
  return 'dashboard';
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Extraction d'entité focale depuis l'URL admin. */
function detectEntityFromUrl(pathname: string): ChatEntity | null {
  // /admin/marche-events/:id
  let m = pathname.match(/^\/admin\/marche-events\/([^/]+)/);
  if (m && UUID_RE.test(m[1])) return { type: 'marche_event', id: m[1] };

  // /admin/community/marcheur/:slug-or-id
  m = pathname.match(/^\/admin\/community\/marcheur\/([^/]+)/);
  if (m) return { type: 'marcheur', id: m[1] };

  // /admin/exportations/:id (exploration ou event)
  m = pathname.match(/^\/admin\/exportations\/([^/]+)/);
  if (m && UUID_RE.test(m[1])) return { type: 'exploration', id: m[1] };

  return null;
}

export function AdminChatBotMount() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const isAdminRoute = location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/admin/login') &&
    !location.pathname.startsWith('/admin/reset-password') &&
    !location.pathname.startsWith('/admin/setup');

  const context = useMemo(() => detectContext(location.pathname), [location.pathname]);
  const urlEntity = useMemo(() => detectEntityFromUrl(location.pathname), [location.pathname]);

  if (!isAdminRoute || !user || !isAdmin) return null;

  // Remount on context+entity change so the chat re-evaluates suggestions and scope
  const entityKey = urlEntity ? `${urlEntity.type}:${urlEntity.id}` : 'none';
  return <ChatBot key={`${context}-${entityKey}`} currentContext={context} urlEntity={urlEntity} />;
}
