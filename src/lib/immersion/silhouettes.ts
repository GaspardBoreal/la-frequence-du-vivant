/**
 * Silhouettes végétales paramétriques.
 *
 * Aucune donnée morphologique n'existe pour toutes les espèces : on dessine
 * donc un port *crédible* déduit de la strate, décliné de façon déterministe
 * par le nom de l'espèce — de sorte qu'une même plante garde toujours la même
 * allure d'une session à l'autre, comme un croquis de carnet.
 */
import type { Strate } from '@/lib/plantSpread';
import { rng, seedOf } from './growthModel';

export type SeasonKey = 'printemps' | 'ete' | 'automne' | 'hiver';

export const SEASON_LABELS: Record<SeasonKey, { label: string; glyph: string }> = {
  printemps: { label: 'Printemps', glyph: '🌱' },
  ete: { label: 'Été', glyph: '☀️' },
  automne: { label: 'Automne', glyph: '🍂' },
  hiver: { label: 'Hiver', glyph: '❄️' },
};

/** Palette de feuillage par saison et par strate (teintes encre-forêt). */
export function foliageColor(strate: Strate, season: SeasonKey, variant: number): string {
  const base: Record<SeasonKey, [number, number, number]> = {
    printemps: [96, 52, 46],
    ete: [140, 38, 34],
    automne: [32, 62, 46],
    hiver: [150, 14, 32],
  };
  const [h, s, l] = base[season];
  const woody = strate === 'arbre' || strate === 'arbuste';
  return `hsl(${h + (variant - 0.5) * 16} ${s + (woody ? -4 : 6)}% ${l + (variant - 0.5) * 10}%)`;
}

export const BARK_COLOR = 'hsl(28 18% 26%)';

export interface SilhouettePart {
  d: string;
  fill: string;
  opacity?: number;
}

/**
 * Construit la silhouette dans un repère où (0,0) est le collet au sol,
 * les y négatifs montent, l'unité est le pixel.
 */
export function buildSilhouette(opts: {
  key: string;
  strate: Strate;
  widthPx: number;
  heightPx: number;
  season: SeasonKey;
  /** 0→1 : fraction de développement (feuillage plus clairsemé si jeune). */
  maturity?: number;
}): { parts: SilhouettePart[]; leafColor: string } {
  const { key, strate, widthPx: w, heightPx: h, season } = opts;
  const seed = seedOf(`${key}|${strate}`);
  const rand = rng(seed);
  const maturity = opts.maturity ?? 1;
  const leafColor = foliageColor(strate, season, seed);
  const parts: SilhouettePart[] = [];
  const bare = season === 'hiver' && (strate === 'arbre' || strate === 'arbuste');

  const blob = (cx: number, cy: number, rx: number, ry: number, wobble = 0.22) => {
    const pts: string[] = [];
    const n = 10;
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (rand() - 0.5) * wobble;
      const x = cx + Math.cos(a) * rx * k;
      const y = cy + Math.sin(a) * ry * k;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `M ${pts[0]} ${pts
      .slice(1)
      .map((p) => `L ${p}`)
      .join(' ')} Z`;
  };

  if (strate === 'arbre' || strate === 'arbuste') {
    const trunkH = strate === 'arbre' ? h * 0.42 : h * 0.18;
    const trunkW = Math.max(2, w * (strate === 'arbre' ? 0.07 : 0.05));
    parts.push({
      d: `M ${-trunkW / 2} 0 L ${-trunkW * 0.32} ${-trunkH} L ${trunkW * 0.32} ${-trunkH} L ${trunkW / 2} 0 Z`,
      fill: BARK_COLOR,
    });
    // Charpentières
    const branches = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < branches; i += 1) {
      const dir = i % 2 === 0 ? 1 : -1;
      const y0 = -trunkH * (0.5 + 0.45 * rand());
      const x1 = dir * w * (0.18 + rand() * 0.25);
      const y1 = y0 - h * (0.12 + rand() * 0.18);
      parts.push({
        d: `M 0 ${y0.toFixed(1)} Q ${(x1 * 0.5).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} L ${(x1 * 0.92).toFixed(1)} ${(y1 + 2).toFixed(1)} Q ${(x1 * 0.45).toFixed(1)} ${((y0 + y1) / 2 + 2).toFixed(1)} 0 ${(y0 + 2).toFixed(1)} Z`,
        fill: BARK_COLOR,
        opacity: 0.85,
      });
    }
    if (!bare) {
      const lobes = 4 + Math.floor(rand() * 3);
      for (let i = 0; i < lobes; i += 1) {
        const cx = (rand() - 0.5) * w * 0.62;
        const cy = -trunkH - h * (0.16 + rand() * 0.36);
        const rx = w * (0.2 + rand() * 0.2);
        const ry = h * (0.1 + rand() * 0.12);
        parts.push({
          d: blob(cx, cy, rx, ry),
          fill: leafColor,
          opacity: 0.62 + 0.3 * rand() * maturity,
        });
      }
    }
  } else if (strate === 'grimpante') {
    const stems = 3;
    for (let i = 0; i < stems; i += 1) {
      const x = (i - 1) * w * 0.22;
      parts.push({
        d: `M ${x} 0 Q ${(x + w * 0.18).toFixed(1)} ${(-h * 0.5).toFixed(1)} ${(x + (rand() - 0.5) * w * 0.2).toFixed(1)} ${-h} L ${(x + 1.6).toFixed(1)} ${-h} Q ${(x + w * 0.2).toFixed(1)} ${(-h * 0.5).toFixed(1)} ${(x + 1.6).toFixed(1)} 0 Z`,
        fill: BARK_COLOR,
        opacity: 0.75,
      });
    }
    if (!bare) {
      for (let i = 0; i < 7; i += 1) {
        const cy = -h * (0.15 + rand() * 0.8);
        parts.push({
          d: blob((rand() - 0.5) * w * 0.7, cy, w * 0.14, h * 0.06),
          fill: leafColor,
          opacity: 0.7,
        });
      }
    }
  } else if (strate === 'aquatique') {
    parts.push({ d: blob(0, -h * 0.3, w * 0.5, h * 0.35, 0.3), fill: leafColor, opacity: 0.8 });
    parts.push({ d: blob(w * 0.2, -h * 0.15, w * 0.28, h * 0.2, 0.3), fill: leafColor, opacity: 0.6 });
  } else {
    // Touffes : couvre-sol, herbacées, sous-arbrisseaux
    const blades = strate === 'couvre-sol' ? 9 : 11;
    for (let i = 0; i < blades; i += 1) {
      const t = i / (blades - 1) - 0.5;
      const x0 = t * w * 0.5;
      const lean = (rand() - 0.5) * w * 0.35;
      const bh = h * (0.55 + rand() * 0.45) * (1 - Math.abs(t) * 0.35);
      const bw = Math.max(1.4, w * 0.055);
      parts.push({
        d: `M ${x0.toFixed(1)} 0 Q ${(x0 + lean * 0.4).toFixed(1)} ${(-bh * 0.6).toFixed(1)} ${(x0 + lean).toFixed(1)} ${(-bh).toFixed(1)} L ${(x0 + lean + bw * 0.5).toFixed(1)} ${(-bh * 0.94).toFixed(1)} Q ${(x0 + lean * 0.4 + bw).toFixed(1)} ${(-bh * 0.55).toFixed(1)} ${(x0 + bw).toFixed(1)} 0 Z`,
        fill: leafColor,
        opacity: 0.72 + rand() * 0.28,
      });
    }
    if (season === 'printemps' || season === 'ete') {
      const flowers = Math.round(2 + rand() * 3);
      for (let i = 0; i < flowers; i += 1) {
        parts.push({
          d: blob((rand() - 0.5) * w * 0.5, -h * (0.7 + rand() * 0.3), w * 0.05, w * 0.05, 0.5),
          fill: season === 'printemps' ? 'hsl(44 82% 72%)' : 'hsl(28 78% 66%)',
          opacity: 0.9,
        });
      }
    }
  }

  return { parts, leafColor };
}
