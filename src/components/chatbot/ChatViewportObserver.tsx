/**
 * ChatViewportObserver
 *
 * Observe générique du DOM affiché et publie un snapshot léger dans
 * `chatPageContext.visibleData['screen.dom']` pour que le Compagnon du Vivant
 * "voie" réellement ce que l'utilisateur voit, sans devoir instrumenter chaque
 * sous-composant.
 *
 * Convention de marquage (optionnelle, augmente la qualité du snapshot) :
 *   - `data-chat-viewport`   : élément racine à observer
 *   - `data-chat-card`       : carte / vignette
 *   - `data-chat-title="..."`: titre principal de la carte
 *   - `data-chat-subtitle`   : sous-titre éventuel (latin, lieu, etc.)
 *   - `data-chat-badges="A,B"`: badges/catégories séparés par virgule
 *   - `data-chat-chip`       : chip/filtre cliquable
 *   - `data-chat-active="true"` : état actif d'un chip/onglet
 *
 * Sans aucun marquage, l'observer retombe sur les heuristiques DOM standards
 * (boutons aria-pressed, headings, onglets actifs).
 */
import { useEffect, useRef } from 'react';
import { chatPageContext } from '@/hooks/useChatPageContext';

interface DomSnapshot {
  /** Onglets/chips/filtres actifs visibles à l'écran. */
  activeChips: string[];
  /** Titres structurants visibles (h1-h3). */
  headings: string[];
  /** Cartes / vignettes visibles. */
  visibleCards: Array<{
    title: string;
    subtitle?: string;
    badges?: string[];
  }>;
  /** Contexte de l'écran (modal, tab actif…). */
  context?: {
    type?: string;
    title?: string;
    subtitle?: string;
    activeTab?: string;
  };
  /** Méta : nombre total détecté (avant troncature). */
  meta: {
    cardsTotal: number;
    truncated: boolean;
    capturedAt: string;
  };
}

const MAX_CARDS = 40;
const MAX_CHIPS = 30;
const MAX_HEADINGS = 12;
const MAX_TEXT = 120;
const SNAPSHOT_KEY = 'screen.dom';

function txt(el: Element | null | undefined, max = MAX_TEXT): string {
  if (!el) return '';
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  // Considère "visible" si au moins partiellement dans le viewport vertical
  if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
  return true;
}

function extractDomSnapshot(root: HTMLElement): DomSnapshot {
  const snapshot: DomSnapshot = {
    activeChips: [],
    headings: [],
    visibleCards: [],
    meta: { cardsTotal: 0, truncated: false, capturedAt: new Date().toISOString() },
  };

  // ── Headings ─────────────────────────────────────────────
  const headingNodes = root.querySelectorAll('h1, h2, h3, [data-chat-heading]');
  headingNodes.forEach(h => {
    if (snapshot.headings.length >= MAX_HEADINGS) return;
    if (!isVisible(h)) return;
    const t = txt(h, 80);
    if (t) snapshot.headings.push(t);
  });

  // ── Chips / filtres / onglets actifs ─────────────────────
  // 1) marqueurs explicites
  const explicitChips = root.querySelectorAll(
    '[data-chat-chip][data-chat-active="true"], [data-chat-chip].is-active',
  );
  explicitChips.forEach(c => {
    if (snapshot.activeChips.length >= MAX_CHIPS) return;
    const t = txt(c, 60);
    if (t) snapshot.activeChips.push(t);
  });

  // 2) heuristiques génériques (aria-pressed, aria-selected, role=tab)
  const ariaActive = root.querySelectorAll(
    'button[aria-pressed="true"], [role="tab"][aria-selected="true"], [aria-current="page"]',
  );
  ariaActive.forEach(c => {
    if (snapshot.activeChips.length >= MAX_CHIPS) return;
    if (!isVisible(c)) return;
    const t = txt(c, 60);
    if (t && !snapshot.activeChips.includes(t)) snapshot.activeChips.push(t);
  });

  // ── Cartes ───────────────────────────────────────────────
  const cards = Array.from(root.querySelectorAll('[data-chat-card]'));
  snapshot.meta.cardsTotal = cards.length;

  // Filtre les cartes réellement visibles dans le viewport ; si toutes hors
  // écran (gros scroll), retombe sur les premières.
  const visibleCards = cards.filter(isVisible);
  const pool = visibleCards.length > 0 ? visibleCards : cards;

  pool.slice(0, MAX_CARDS).forEach(card => {
    const title =
      (card as HTMLElement).dataset.chatTitle ||
      txt(card.querySelector('[data-chat-title]'), 80) ||
      txt(card.querySelector('h3, h4, .font-semibold'), 80);
    if (!title) return;

    const subtitle =
      (card as HTMLElement).dataset.chatSubtitle ||
      txt(card.querySelector('[data-chat-subtitle]'), 80) ||
      undefined;

    const badgesAttr = (card as HTMLElement).dataset.chatBadges;
    const badges = badgesAttr
      ? badgesAttr.split(',').map(b => b.trim()).filter(Boolean).slice(0, 6)
      : undefined;

    snapshot.visibleCards.push({ title, ...(subtitle ? { subtitle } : {}), ...(badges ? { badges } : {}) });
  });

  snapshot.meta.truncated = pool.length > MAX_CARDS;
  return snapshot;
}

interface Props {
  /** Sélecteur racine. Défaut : `[data-chat-viewport]` puis `<main>`. */
  rootSelector?: string;
  /** Throttle entre captures (ms). */
  throttleMs?: number;
}

const ChatViewportObserver: React.FC<Props> = ({
  rootSelector,
  throttleMs = 400,
}) => {
  const lastSerialized = useRef<string>('');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const findRoots = (): HTMLElement[] => {
      const roots: HTMLElement[] = [];
      const main =
        (rootSelector
          ? document.querySelector<HTMLElement>(rootSelector)
          : document.querySelector<HTMLElement>('[data-chat-viewport]')) ||
        document.querySelector<HTMLElement>('main');
      if (main) roots.push(main);
      // Overlays portaillés (Radix Dialog / Sheet, Vaul Drawer) — montés hors du viewport
      const overlays = document.querySelectorAll<HTMLElement>(
        '[role="dialog"][data-state="open"], [data-vaul-drawer][data-state="open"]'
      );
      overlays.forEach(o => {
        if (!roots.includes(o)) roots.push(o);
      });
      return roots;
    };

    let mainObserver: MutationObserver | null = null;
    let bodyObserver: MutationObserver | null = null;

    const mergeSnapshots = (snaps: DomSnapshot[]): DomSnapshot => {
      const merged: DomSnapshot = {
        activeChips: [],
        headings: [],
        visibleCards: [],
        meta: { cardsTotal: 0, truncated: false, capturedAt: new Date().toISOString() },
      };
      snaps.forEach(s => {
        s.activeChips.forEach(c => { if (!merged.activeChips.includes(c)) merged.activeChips.push(c); });
        s.headings.forEach(h => { if (!merged.headings.includes(h)) merged.headings.push(h); });
        merged.visibleCards.push(...s.visibleCards);
        merged.meta.cardsTotal += s.meta.cardsTotal;
        merged.meta.truncated = merged.meta.truncated || s.meta.truncated;
      });
      // Truncate after merge
      if (merged.visibleCards.length > MAX_CARDS) {
        merged.visibleCards = merged.visibleCards.slice(0, MAX_CARDS);
        merged.meta.truncated = true;
      }
      return merged;
    };

    const capture = () => {
      const roots = findRoots();
      if (roots.length === 0) return;
      try {
        const snaps = roots.map(r => extractDomSnapshot(r));
        const snap = mergeSnapshots(snaps);
        const serialized = JSON.stringify(snap);
        if (serialized === lastSerialized.current) return;
        lastSerialized.current = serialized;
        chatPageContext.setVisibleSlice(SNAPSHOT_KEY, snap);
      } catch (e) {
        console.warn('[ChatViewportObserver] capture failed:', e);
      }
    };

    const scheduleCapture = () => {
      if (timer.current !== null) return;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        capture();
      }, throttleMs);
    };

    // Capture initiale
    scheduleCapture();

    // Observer mutations DOM dans la racine principale
    const mainRoot = findRoots()[0];
    if (mainRoot) {
      mainObserver = new MutationObserver(scheduleCapture);
      mainObserver.observe(mainRoot, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-chat-active', 'aria-pressed', 'aria-selected', 'data-chat-title', 'data-chat-badges', 'data-state'],
      });
    }

    // Observer ouverture/fermeture des portails (Dialog, Sheet, Drawer) sur body
    bodyObserver = new MutationObserver(scheduleCapture);
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: false,
      attributes: false,
    });
    // Re-capture sur changement d'état des dialogues déjà existants
    document.querySelectorAll('[role="dialog"], [data-vaul-drawer]').forEach(el => {
      bodyObserver?.observe(el, { attributes: true, attributeFilter: ['data-state'] });
    });

    window.addEventListener('scroll', scheduleCapture, { passive: true, capture: true });
    window.addEventListener('resize', scheduleCapture, { passive: true });

    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      mainObserver?.disconnect();
      bodyObserver?.disconnect();
      window.removeEventListener('scroll', scheduleCapture, true);
      window.removeEventListener('resize', scheduleCapture);
      chatPageContext.setVisibleSlice(SNAPSHOT_KEY, undefined);
    };
  }, [rootSelector, throttleMs]);

  return null;
};

export default ChatViewportObserver;
