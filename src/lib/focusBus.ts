/**
 * Lightweight global pub-sub for deep-linked focus from search.
 *
 * Why a custom bus instead of pure CustomEvent ?
 *   The deep-link sequence is:
 *     1) URL `?focus=` parsed → page sets tab + sub-tab
 *     2) child component (e.g. TestimoniesTab) mounts because of (1)
 *     3) child should "consume" the focus and react
 *   If we only relied on a `window.dispatchEvent`, step (2) usually happens
 *   AFTER the event fired → the child never receives it.
 *   This bus caches the latest focus for `RECENT_MS` so a listener mounted
 *   slightly later can still pick it up immediately.
 */

export interface FocusDetail {
  kind: 'species' | 'practice' | 'text' | 'testimony' | 'event';
  id: string;
  sub?: string | null;
  marcheId?: string | null;
  target?: string; // `kind:id`
  ts: number;
}

const RECENT_MS = 4_000;
let last: FocusDetail | null = null;
const listeners = new Set<(d: FocusDetail) => void>();

export function dispatchFocus(detail: Omit<FocusDetail, 'ts' | 'target'>) {
  const full: FocusDetail = {
    ...detail,
    target: `${detail.kind}:${detail.id}`,
    ts: Date.now(),
  };
  last = full;
  listeners.forEach(fn => {
    try { fn(full); } catch { /* swallow */ }
  });
  // Mirror as CustomEvent for non-React consumers / debug.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lfdv:focus', { detail: full }));
  }
}

export function subscribeFocus(handler: (d: FocusDetail) => void): () => void {
  listeners.add(handler);
  // Immediately replay if a focus was emitted very recently.
  if (last && Date.now() - last.ts < RECENT_MS) {
    queueMicrotask(() => handler(last!));
  }
  return () => listeners.delete(handler);
}

export function getLastFocus(): FocusDetail | null {
  if (!last) return null;
  return Date.now() - last.ts < RECENT_MS ? last : null;
}
