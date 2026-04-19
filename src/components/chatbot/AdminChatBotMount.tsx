import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ChatBot } from './ChatBot';
import type { ChatContext } from './chatConfig';

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

export function AdminChatBotMount() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const isAdminRoute = location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/admin/login') &&
    !location.pathname.startsWith('/admin/reset-password') &&
    !location.pathname.startsWith('/admin/setup');

  const context = useMemo(() => detectContext(location.pathname), [location.pathname]);

  if (!isAdminRoute || !user || !isAdmin) return null;

  // Remount on context change so the chat re-evaluates suggestions and scope
  return <ChatBot key={context} currentContext={context} />;
}
