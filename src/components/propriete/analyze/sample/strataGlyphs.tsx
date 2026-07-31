/**
 * « Sceau des 4 strates » — langage graphique unique pour lire, sans ouvrir la
 * fiche carotte, le niveau de tests réalisés sur un prélèvement de sol.
 *
 * Une seule source de vérité : les glyphes sont décrits en fragments SVG (chaînes)
 * afin d'être rendus à la fois en React (StrataSeal) et en HTML brut dans les
 * `L.divIcon` de Leaflet (strataSealHtml).
 */
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import { SOIL_BLOCKS, type SoilBlockId } from '@/components/propriete/analyze/media/soilTestCatalog';
import { RESULT_SHORT, TEST_LABELS, type StructureResultId } from '@/components/propriete/analyze/structureTests';
import {
  TEXTURE_SHORT,
  TEXTURE_TEST_LABELS,
  type TextureResultId,
} from '@/components/propriete/analyze/textureTests';
import { classifyPh, PH_TEST_LABELS } from '@/components/propriete/analyze/phTests';
import { scoreLife, LIFE_CLASS_MAP, LIFE_TEST_LABELS } from '@/components/propriete/analyze/lifeTests';

export const STRATA_ORDER: SoilBlockId[] = ['structure', 'texture', 'ph', 'life'];

export const STRATA_LABEL: Record<SoilBlockId, string> = {
  structure: 'Structure',
  texture: 'Texture',
  ph: 'Acidité',
  life: 'Vie du sol',
};

/** État d'une strate pour un prélèvement donné. */
export interface StratumState {
  id: SoilBlockId;
  label: string;
  /** Résultat lu sur le terrain. */
  done: boolean;
  /** Test noté mais résultat manquant. */
  started: boolean;
  /** Couleur d'expression (résultat) ou accent du bloc. */
  color: string;
  /** Valeur courte affichée sous le picto. */
  short: string | null;
  /** Libellé du test employé. */
  test: string | null;
  /** Phrase de survol. */
  tooltip: string;
}

const TEXTURE_COLOR: Record<TextureResultId, string> = {
  sable: '#d8b26a',
  limon: '#a98c52',
  argile: '#a4644a',
};
const STRUCTURE_COLOR: Record<StructureResultId, string> = {
  compacte: '#b4603f',
  grumeleuse: '#2f7d4f',
  particulaire: '#c9a227',
};

export const MUTED = '#8a8577';

const accent = (id: SoilBlockId) => `hsl(${SOIL_BLOCKS[id].accent})`;

/** Lit les 4 strates d'un prélèvement — aucun champ BDD nouveau. */
export const strataState = (s: SoilSample): StratumState[] => {
  const out: StratumState[] = [];

  // Structure
  {
    const r = s.structure_result as StructureResultId | null | undefined;
    const test = s.structure_test ? TEST_LABELS[s.structure_test] : null;
    out.push({
      id: 'structure',
      label: STRATA_LABEL.structure,
      done: !!r,
      started: !r && !!s.structure_test,
      color: r ? STRUCTURE_COLOR[r] : accent('structure'),
      short: r ? RESULT_SHORT[r] : null,
      test,
      tooltip: r
        ? `Structure${test ? ` · ${test}` : ''} — ${RESULT_SHORT[r]}`
        : `Structure — ${test ? `${test} engagé, résultat manquant` : 'test non réalisé'}`,
    });
  }

  // Texture
  {
    const r = s.texture_result as TextureResultId | null | undefined;
    const test = s.texture_test ? TEXTURE_TEST_LABELS[s.texture_test] : null;
    out.push({
      id: 'texture',
      label: STRATA_LABEL.texture,
      done: !!r,
      started: !r && !!s.texture_test,
      color: r ? TEXTURE_COLOR[r] : accent('texture'),
      short: r ? TEXTURE_SHORT[r] : null,
      test,
      tooltip: r
        ? `Texture${test ? ` · ${test}` : ''} — ${TEXTURE_SHORT[r]}`
        : `Texture — ${test ? `${test} engagé, résultat manquant` : 'test non réalisé'}`,
    });
  }

  // pH
  {
    const v = typeof s.ph_value === 'number' ? s.ph_value : null;
    const c = v != null ? classifyPh(v) : null;
    const test = s.ph_test ? PH_TEST_LABELS[s.ph_test] : null;
    out.push({
      id: 'ph',
      label: STRATA_LABEL.ph,
      done: v != null,
      started: v == null && !!s.ph_test,
      color: c?.color ?? accent('ph'),
      short: v != null ? v.toFixed(1) : null,
      test,
      tooltip:
        v != null
          ? `pH${test ? ` · ${test}` : ''} — ${v.toFixed(1)} · ${c!.short}`
          : `Acidité — ${test ? `${test} engagé, mesure manquante` : 'mesure non réalisée'}`,
    });
  }

  // Vie du sol
  {
    const signs = s.life_signs ?? [];
    const worms = typeof s.worm_count === 'number' ? s.worm_count : null;
    const has = signs.length > 0 || worms != null;
    const sc = has ? scoreLife(signs, worms) : null;
    const k = sc ? LIFE_CLASS_MAP[sc.klass] : null;
    const test = s.life_test ? LIFE_TEST_LABELS[s.life_test] : null;
    out.push({
      id: 'life',
      label: STRATA_LABEL.life,
      done: has,
      started: !has && !!s.life_test,
      color: k?.color ?? accent('life'),
      short: has ? (worms != null ? `${worms} vers` : k!.label) : null,
      test,
      tooltip: has
        ? `Vie du sol${test ? ` · ${test}` : ''} — ${k!.label}${worms != null ? ` · ${worms} vers` : ''}${
            signs.length ? ` · ${signs.length} indices` : ''
          }`
        : `Vie du sol — ${test ? `${test} engagé, relevé manquant` : 'relevé non réalisé'}`,
    });
  }

  return out;
};

export const strataCompletion = (s: SoilSample) => {
  const st = strataState(s);
  return { done: st.filter((x) => x.done).length, total: st.length, strata: st };
};

/* ------------------------------------------------------------------ */
/* Glyphes — fragments SVG dessinés dans un carré 24 × 24              */
/* ------------------------------------------------------------------ */

/**
 * Chaque glyphe est rendu avec `stroke=CURRENT` et un remplissage tramé quand
 * la strate est renseignée. `CURRENT` est remplacé par la couleur d'état.
 */
const GLYPH: Record<SoilBlockId, { solid: string; line: string }> = {
  // Motte fracturée
  structure: {
    solid:
      '<path d="M4 15.5 L8.5 8 L13 12 L11 17.5 Z" fill="FILL"/><path d="M13.5 11.2 L18.2 7.6 L20.5 13.4 L15.4 16.6 Z" fill="FILL"/>',
    line:
      '<path d="M4 15.5 L8.5 8 L13 12 L11 17.5 Z" fill="none" stroke="CURRENT" stroke-width="1.5" stroke-linejoin="round"/><path d="M13.5 11.2 L18.2 7.6 L20.5 13.4 L15.4 16.6 Z" fill="none" stroke="CURRENT" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.5 19.5 L17.5 19.5" stroke="CURRENT" stroke-width="1.3" stroke-linecap="round" opacity="0.55"/>',
  },
  // Boudin roulé
  texture: {
    solid:
      '<path d="M6 16.5 C6 10 10 6.5 14.5 6.5 C18 6.5 19.5 9 19.5 11 C19.5 13.6 17.4 15 15.4 15 C13.9 15 13 14.1 13 13" fill="none" stroke="FILL" stroke-width="4.6" stroke-linecap="round"/>',
    line:
      '<path d="M6 16.5 C6 10 10 6.5 14.5 6.5 C18 6.5 19.5 9 19.5 11 C19.5 13.6 17.4 15 15.4 15 C13.9 15 13 14.1 13 13" fill="none" stroke="CURRENT" stroke-width="1.7" stroke-linecap="round"/><path d="M4.5 19 L19.5 19" stroke="CURRENT" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/>',
  },
  // Goutte + bandelette
  ph: {
    solid:
      '<path d="M12 3.5 C12 3.5 6.8 9.6 6.8 13.4 A5.2 5.2 0 0 0 17.2 13.4 C17.2 9.6 12 3.5 12 3.5 Z" fill="FILL"/>',
    line:
      '<path d="M12 3.5 C12 3.5 6.8 9.6 6.8 13.4 A5.2 5.2 0 0 0 17.2 13.4 C17.2 9.6 12 3.5 12 3.5 Z" fill="none" stroke="CURRENT" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.4 20.6 L14.6 20.6" stroke="CURRENT" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>',
  },
  // Ver + feuille
  life: {
    solid:
      '<path d="M4.5 16.5 C7 16.5 7 12.5 9.8 12.5 C12.6 12.5 12.6 16.8 15.4 16.8" fill="none" stroke="FILL" stroke-width="3.4" stroke-linecap="round"/><path d="M19.6 5.4 C15 5.8 12.6 8.4 13.4 12.4 C17.6 12.6 19.9 9.9 19.6 5.4 Z" fill="FILL"/>',
    line:
      '<path d="M4.5 16.5 C7 16.5 7 12.5 9.8 12.5 C12.6 12.5 12.6 16.8 15.4 16.8" fill="none" stroke="CURRENT" stroke-width="1.6" stroke-linecap="round"/><path d="M19.6 5.4 C15 5.8 12.6 8.4 13.4 12.4 C17.6 12.6 19.9 9.9 19.6 5.4 Z" fill="none" stroke="CURRENT" stroke-width="1.5" stroke-linejoin="round"/>',
  },
};

/** Fragment SVG d'un glyphe, prêt à insérer dans un `<svg viewBox="0 0 24 24">`. */
export const glyphMarkup = (
  id: SoilBlockId,
  opts: { color: string; done: boolean; started: boolean; mono?: boolean },
): string => {
  const color = opts.mono ? '#3a2f22' : opts.color;
  const g = GLYPH[id];
  if (opts.done) {
    return (
      g.solid.replace(/FILL/g, color) +
      g.line.replace(/CURRENT/g, color)
    );
  }
  const dim = opts.started ? color : MUTED;
  const dash = opts.started ? ' stroke-dasharray="2.6 2.4"' : '';
  return g.line
    .replace(/CURRENT/g, dim)
    .replace(/stroke-width="/g, `${dash} stroke-width="`);
};

/* ------------------------------------------------------------------ */
/* Anneau de complétude (marqueur carte)                               */
/* ------------------------------------------------------------------ */

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

/**
 * 4 arcs de quart autour de la carotte : un par strate.
 * Rempli = strate renseignée, pointillé gris = strate manquante.
 */
export const completionRingSvg = (
  s: SoilSample,
  opts: { cx: number; cy: number; r: number; width?: number } = { cx: 22, cy: 22, r: 17 },
): string => {
  const { cx, cy, r } = opts;
  const w = opts.width ?? 3.2;
  const gap = 7; // degrés de respiration entre quarts
  return strataState(s)
    .map((st, i) => {
      const start = i * 90 + gap / 2;
      const end = (i + 1) * 90 - gap / 2;
      const [x1, y1] = polar(cx, cy, r, start);
      const [x2, y2] = polar(cx, cy, r, end);
      const color = st.done ? st.color : st.started ? st.color : MUTED;
      const dash = st.done ? '' : st.started ? ' stroke-dasharray="4 3"' : ' stroke-dasharray="1.6 3.4"';
      const opacity = st.done ? 0.98 : st.started ? 0.7 : 0.4;
      return `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(
        2,
      )}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash} opacity="${opacity}"/>`;
    })
    .join('');
};

/** Bande HTML de 4 pictos, pour les popups Leaflet rendues hors React. */
export const strataSealHtml = (s: SoilSample, size = 22): string =>
  `<span style="display:inline-flex;gap:6px;align-items:center;">${strataState(s)
    .map(
      (st) =>
        `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="opacity:${
          st.done ? 1 : st.started ? 0.8 : 0.38
        }">${glyphMarkup(st.id, { color: st.color, done: st.done, started: st.started })}</svg>`,
    )
    .join('')}</span>`;
