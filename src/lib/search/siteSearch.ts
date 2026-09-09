/**
 * Moteur de recherche des pages publiques.
 *
 * Le catalogue (`site_pages`) et les règles de classement (`site_search_rules`)
 * sont éditables depuis /admin/outils/recherche : ce fichier ne contient que la
 * mécanique (normalisation, classement par univers, score), jamais de contenu figé.
 */

import { Compass, Footprints, Grape, Sparkles, Sprout, type LucideIcon } from 'lucide-react';

export type UniversKey = 'jardin' | 'vignoble' | 'marches' | 'ecotourisme' | 'vivant';

export const UNIVERS_ORDER: UniversKey[] = ['jardin', 'vignoble', 'marches', 'ecotourisme', 'vivant'];

export const UNIVERS_META: Record<UniversKey, {
  label: string;
  short: string;
  icon: LucideIcon;
  /** Teinte du groupe — volontairement locale à l'overlay (fond sombre dédié). */
  accent: string;
  ring: string;
  glow: string;
}> = {
  jardin: {
    label: 'Fréquence Jardin', short: 'Jardin', icon: Sprout,
    accent: 'text-lime-300', ring: 'ring-lime-400/40', glow: 'from-lime-400/20',
  },
  vignoble: {
    label: 'Fréquence du Vignoble', short: 'Vignoble', icon: Grape,
    accent: 'text-fuchsia-300', ring: 'ring-fuchsia-400/40', glow: 'from-fuchsia-400/20',
  },
  marches: {
    label: 'Les Marches du Vivant', short: 'Marches', icon: Footprints,
    accent: 'text-emerald-300', ring: 'ring-emerald-400/40', glow: 'from-emerald-400/20',
  },
  ecotourisme: {
    label: 'Éco tourisme', short: 'Éco tourisme', icon: Compass,
    accent: 'text-amber-300', ring: 'ring-amber-400/40', glow: 'from-amber-400/20',
  },
  vivant: {
    label: 'La Fréquence du Vivant', short: 'Vivant', icon: Sparkles,
    accent: 'text-sky-300', ring: 'ring-sky-400/40', glow: 'from-sky-400/20',
  },
};


export interface SitePage {
  id: string;
  path: string;
  title: string;
  subtitle: string | null;
  univers: string | null;
  keywords: string[];
  priority: number;
  featured: boolean;
  is_active: boolean;
}

export interface SiteSearchRule {
  id: string;
  position: number;
  /** 'path_prefix' teste l'adresse, 'keyword' teste titre + sous-titre + mots-clés + adresse. */
  match_type: string;
  pattern: string;
  univers: string;
  is_active: boolean;
  note?: string | null;
}

/** Minuscules, sans accents, ponctuation réduite à des espaces. */
export const norm = (s: string): string =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const isUnivers = (v: string | null | undefined): v is UniversKey =>
  !!v && (UNIVERS_ORDER as string[]).includes(v);

/** Univers d'une page : valeur saisie > première règle qui correspond > « vivant ». */
export function resolveUnivers(page: SitePage, rules: SiteSearchRule[]): UniversKey {
  if (isUnivers(page.univers)) return page.univers;

  const haystack = norm([page.title, page.subtitle ?? '', page.keywords.join(' ')].join(' '));
  const path = page.path.toLowerCase();

  const ordered = [...rules].filter(r => r.is_active).sort((a, b) => a.position - b.position);
  for (const rule of ordered) {
    if (!isUnivers(rule.univers)) continue;
    if (rule.match_type === 'path_prefix') {
      if (path.startsWith(rule.pattern.toLowerCase())) return rule.univers;
    } else {
      const needle = norm(rule.pattern);
      if (needle && (haystack.includes(needle) || norm(path).includes(needle))) return rule.univers;
    }
  }
  return 'vivant';
}

/** Distance de Levenshtein bornée — tolère une petite faute de frappe. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export interface ScoredPage extends SitePage {
  univers_resolved: UniversKey;
  score: number;
}

/** Filtre + score le catalogue. Renvoie la liste triée, tous univers confondus. */
export function searchPages(
  pages: SitePage[],
  rules: SiteSearchRule[],
  query: string,
  limitPerUnivers = 6,
): ScoredPage[] {
  const q = norm(query);
  const terms = q.split(' ').filter(Boolean);

  const scored: ScoredPage[] = [];

  for (const page of pages) {
    if (!page.is_active) continue;
    const title = norm(page.title);
    const subtitle = norm(page.subtitle ?? '');
    const keywords = norm(page.keywords.join(' '));
    const path = norm(page.path);
    const base = page.priority / 20 + (page.featured ? 1 : 0);

    if (!terms.length) {
      if (page.featured) scored.push({ ...page, univers_resolved: resolveUnivers(page, rules), score: base });
      continue;
    }

    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      let best = 0;
      if (title === term) best = 12;
      else if (title.startsWith(term)) best = 9;
      else if (title.includes(term)) best = 7;
      else if (keywords.split(' ').some(w => w === term)) best = 6;
      else if (keywords.includes(term)) best = 4.5;
      else if (subtitle.includes(term)) best = 3.5;
      else if (path.includes(term)) best = 3;
      else if (term.length >= 4 && title.split(' ').some(w => withinOneEdit(w, term))) best = 2.5;
      else if (term.length >= 4 && keywords.split(' ').some(w => withinOneEdit(w, term))) best = 2;

      if (best === 0) { matchedAll = false; break; }
      score += best;
    }

    if (!matchedAll) continue;
    scored.push({ ...page, univers_resolved: resolveUnivers(page, rules), score: score + base });
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'fr'));

  // Plafonne chaque univers pour garder une lecture équilibrée.
  const counts: Record<string, number> = {};
  return scored.filter(p => {
    counts[p.univers_resolved] = (counts[p.univers_resolved] ?? 0) + 1;
    return counts[p.univers_resolved] <= limitPerUnivers;
  });
}

/** Regroupe dans l'ordre imposé des univers. */
export function groupByUnivers(results: ScoredPage[]): Array<{ univers: UniversKey; items: ScoredPage[] }> {
  return UNIVERS_ORDER
    .map(u => ({ univers: u, items: results.filter(r => r.univers_resolved === u) }))
    .filter(g => g.items.length > 0);
}
