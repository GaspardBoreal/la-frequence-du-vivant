/**
 * Trait d'union entre l'étape 2 « J'analyse le sol » (prélèvements A, B, C…)
 * et l'étape 5 « Palette végétale » (ouvrages dessinés dans l'Atelier).
 *
 * Un ouvrage peut être relié à un ou plusieurs prélèvements. La lecture du sol
 * fusionnée qui en découle alimente l'affichage, l'impression, et — au prochain
 * chantier — le contexte de l'IA de jardin.
 */
import { haversineM } from '@/utils/geoDistance';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import { buildSoilReading, type SoilReading } from '@/components/propriete/analyze/soilReading';
import { RESULT_SHORT, type StructureResultId } from '@/components/propriete/analyze/structureTests';
import { TEXTURE_SHORT, type TextureResultId } from '@/components/propriete/analyze/textureTests';
import { PH_CLASS_MAP } from '@/components/propriete/analyze/phTests';
import { LIFE_CLASS_MAP } from '@/components/propriete/analyze/lifeTests';
import { normalizeStructure, normalizeTexture } from '@/lib/soilVocabulary';
import type { SoilLite } from '@/lib/plantIndicatorKb';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { geometryCenter, measureFor } from '@/components/propriete/palette/studio/geoMetrics';

/** Clé de stockage du lien dans `propriete_objets.meta`. */
export const SOIL_LINK_KEY = 'soil_samples';

export const linkedSampleIds = (meta: any): string[] =>
  Array.isArray(meta?.[SOIL_LINK_KEY])
    ? (meta[SOIL_LINK_KEY] as unknown[]).map(String).filter(Boolean)
    : [];

export const withLinkedSamples = (meta: any, ids: string[]) => ({
  ...(meta ?? {}),
  [SOIL_LINK_KEY]: Array.from(new Set(ids)),
});

/** Prélèvements effectivement posés sur la carte. */
export const placedSamples = (samples: SoilSample[]): SoilSample[] =>
  (samples ?? []).filter((s) => s.lat != null && s.lng != null);

/* ── Géométrie ───────────────────────────────────────────────────────────── */

const pointInRing = (lat: number, lng: number, ring: Array<[number, number]>): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const distanceToGeometry = (lat: number, lng: number, geom: any): number => {
  if (!geom) return Number.POSITIVE_INFINITY;
  if (geom.type === 'Point') {
    const c = geom.coordinates;
    return haversineM(lat, lng, c[1], c[0]);
  }
  const coords: Array<[number, number]> =
    geom.type === 'Polygon' ? geom.coordinates?.[0] ?? [] : geom.coordinates ?? [];
  if (!coords.length) return Number.POSITIVE_INFINITY;
  return coords.reduce(
    (min, c) => Math.min(min, haversineM(lat, lng, c[1], c[0])),
    Number.POSITIVE_INFINITY,
  );
};

export interface SampleProximity {
  sample: SoilSample;
  /** Le prélèvement tombe à l'intérieur de l'emprise de l'ouvrage. */
  inside: boolean;
  /** Distance au contour (0 si à l'intérieur). */
  distanceM: number;
}

/**
 * Prélèvements classés par pertinence pour un ouvrage : d'abord ceux contenus
 * dans l'emprise, puis les plus proches.
 */
export function rankSamplesForGeometry(
  geometry: any,
  samples: SoilSample[],
): SampleProximity[] {
  const ring: Array<[number, number]> =
    geometry?.type === 'Polygon' ? geometry.coordinates?.[0] ?? [] : [];

  return placedSamples(samples)
    .map((s) => {
      const lat = s.lat as number;
      const lng = s.lng as number;
      const inside = ring.length >= 3 ? pointInRing(lat, lng, ring) : false;
      return {
        sample: s,
        inside,
        distanceM: inside ? 0 : distanceToGeometry(lat, lng, geometry),
      };
    })
    .sort((a, b) => Number(b.inside) - Number(a.inside) || a.distanceM - b.distanceM);
}

/** Suggestion automatique : les prélèvements contenus, sinon le plus proche. */
export function suggestSampleIds(geometry: any, samples: SoilSample[]): string[] {
  const ranked = rankSamplesForGeometry(geometry, samples);
  if (!ranked.length) return [];
  const inside = ranked.filter((r) => r.inside);
  if (inside.length) return inside.map((r) => r.sample.id);
  return [ranked[0].sample.id];
}

export const fmtDistance = (m: number): string =>
  !Number.isFinite(m) ? '—' : m < 1 ? '< 1 m' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

/* ── Lecture fusionnée ───────────────────────────────────────────────────── */

export interface MergedSoil {
  samples: SoilSample[];
  reading: SoilReading;
  soilLite: SoilLite;
  /** Phrase de lecture agronomique de l'ouvrage. */
  sentence: string;
  /** Amplitude de pH quand plusieurs prélèvements sont reliés. */
  phSpread: number;
  hasData: boolean;
}

export function mergeSamples(samples: SoilSample[]): MergedSoil {
  const reading = buildSoilReading({ samples, life_signs: [] } as any);
  const structure = reading.structure.dominant as StructureResultId | null;
  const texture = reading.texture.dominant as TextureResultId | null;
  const phClass = reading.ph.dominant ? PH_CLASS_MAP[reading.ph.dominant] : null;
  const lifeClass = reading.life.dominant ? LIFE_CLASS_MAP[reading.life.dominant] : null;

  const parts: string[] = [];
  if (texture) parts.push(`Sol ${TEXTURE_SHORT[texture].toLowerCase()}`);
  if (structure)
    parts.push(`${texture ? 'à structure' : 'Structure'} ${RESULT_SHORT[structure].toLowerCase()}`);
  if (phClass) parts.push(phClass.short.toLowerCase());
  if (lifeClass) parts.push(lifeClass.label.toLowerCase());

  const hasData = parts.length > 0;

  return {
    samples,
    reading,
    soilLite: {
      structure: normalizeStructure(structure),
      texture: normalizeTexture(texture),
      ph: reading.ph.average ?? null,
      life_signs: reading.life.union ?? [],
    },
    sentence: hasData
      ? `${parts.join(', ')}.`
      : 'Aucune mesure encore reliée à cet ouvrage.',
    phSpread: reading.ph.amplitude ?? 0,
    hasData,
  };
}

/* ── Alertes de cohérence ouvrage ↔ sol ──────────────────────────────────── */

export type SoilAlertTone = 'alerte' | 'appui';

export interface SoilAlert {
  tone: SoilAlertTone;
  title: string;
  text: string;
}

const isAny = (key: string, list: string[]) => list.some((k) => key.includes(k));

export function ouvrageSoilAlerts(outilKey: string, merged: MergedSoil): SoilAlert[] {
  if (!merged.hasData) return [];
  const out: SoilAlert[] = [];
  const texture = merged.reading.texture.dominant as TextureResultId | null;
  const structure = merged.reading.structure.dominant as StructureResultId | null;
  const ph = merged.reading.ph.average;
  const life = merged.reading.life.dominant;
  const k = outilKey;

  const retenueEau = isAny(k, ['mare', 'bassin', 'jardin-pluie']);
  const infiltration = isAny(k, ['noue', 'baissiere', 'tranchee', 'desimperm']);
  const cultive = isAny(k, ['potager', 'carres', 'planche', 'butte', 'verger', 'foret-jardin', 'aromatiques', 'lasagne']);
  const massif = isAny(k, ['massif', 'bordure', 'prairie']);
  const structurant = isAny(k, ['mur', 'restanque', 'terrasse', 'cheminement', 'pas-japonais', 'cabane', 'serre']);

  if (retenueEau) {
    if (texture === 'sable' || structure === 'particulaire')
      out.push({
        tone: 'alerte',
        title: 'Sol drainant sous une pièce d’eau',
        text: 'La texture ne retiendra pas l’eau : prévoir une étanchéité (argile compactée, bentonite ou membrane) et vérifier la nappe avant terrassement.',
      });
    if (texture === 'argile')
      out.push({
        tone: 'appui',
        title: 'Argile favorable',
        text: 'La dominante argileuse permet d’envisager un gobetage naturel : tester une fosse témoin remplie 48 h avant d’engager la membrane.',
      });
  }

  if (infiltration && (texture === 'argile' || structure === 'compacte'))
    out.push({
      tone: 'alerte',
      title: 'Infiltration ralentie',
      text: 'Sol peu perméable : dimensionner plus large, décompacter le fond à la dent et prévoir un exutoire de trop-plein.',
    });

  if (cultive) {
    if (structure === 'compacte')
      out.push({
        tone: 'alerte',
        title: 'Sol compacté sous une zone cultivée',
        text: 'Décompacter sans retourner (grelinette / dent), puis couvrir en permanence. Culture sur butte ou planche surélevée la première année.',
      });
    if (typeof ph === 'number' && ph < 5.8)
      out.push({
        tone: 'alerte',
        title: 'pH bas pour la culture',
        text: `pH moyen ${ph.toFixed(1)} : amendement calcaire léger (maërl, lithothamne) et choix d’espèces tolérantes à l’acidité.`,
      });
    if (typeof ph === 'number' && ph > 7.8)
      out.push({
        tone: 'alerte',
        title: 'pH élevé — risque de chlorose',
        text: `pH moyen ${ph.toFixed(1)} : écarter les acidophiles, privilégier les porte-greffes tolérants au calcaire et le paillage organique acidifiant.`,
      });
    if (life === 'discrete')
      out.push({
        tone: 'alerte',
        title: 'Vie du sol discrète',
        text: 'Amorcer par un apport de compost mûr + BRF avant plantation ; la première saison sert à relancer la vie biologique.',
      });
    if (life === 'foisonnante')
      out.push({
        tone: 'appui',
        title: 'Sol vivant',
        text: 'La vie biologique est installée : ne pas retourner, se contenter de couvrir et de semer dans le mulch.',
      });
  }

  if (massif && texture === 'sable')
    out.push({
      tone: 'appui',
      title: 'Sol filtrant',
      text: 'Orienter la palette vers les vivaces de terrain sec (méditerranéennes, graminées) plutôt que d’arroser un massif inadapté.',
    });

  if (structurant && (texture === 'argile' || structure === 'compacte'))
    out.push({
      tone: 'alerte',
      title: 'Portance et retrait-gonflement',
      text: 'Sol argileux : fondations hors gel, lit de pose drainant et joints souples pour absorber les mouvements saisonniers.',
    });

  if (merged.phSpread >= 1)
    out.push({
      tone: 'alerte',
      title: 'Prélèvements contrastés',
      text: `Amplitude de pH de ${merged.phSpread.toFixed(1)} point${merged.phSpread >= 2 ? 's' : ''} entre les prélèvements reliés : traiter l’ouvrage par sous-secteurs plutôt qu’en bloc.`,
    });

  return out;
}

/* ── Dossier sol par ouvrage — contexte destiné à l'IA de jardin ─────────── */

export interface OuvrageSoilDossier {
  ouvrage: {
    id: string;
    nom: string | null;
    type: string;
    typeLabel: string;
    famille: string;
    mesure: { unite: 'm2' | 'ml' | 'u'; valeur: number };
    centre: { lat: number; lng: number } | null;
    intention: string | null;
  };
  prelevements: Array<{
    id: string;
    label: string;
    lieu?: string | null;
    distanceM: number | null;
    interieur: boolean;
    structure: string | null;
    texture: string | null;
    ph: number | null;
    vie: { signes: string[]; vers: number | null };
  }>;
  lectureSol: {
    phrase: string;
    structure: string | null;
    texture: string | null;
    phMoyen: number | null;
    amplitudePh: number;
    vie: string | null;
  };
  contraintes: SoilAlert[];
  especesRetenues: string[];
}

export function buildOuvrageSoilDossier(params: {
  objet: { id: string; nom: string | null; outil_key: string; geometry: any; meta?: any };
  samples: SoilSample[];
  selectedSpecies?: string[];
}): OuvrageSoilDossier {
  const { objet, samples, selectedSpecies = [] } = params;
  const tool = TOOL_BY_KEY[objet.outil_key];
  const ids = linkedSampleIds(objet.meta);
  const linked = placedSamples(samples).filter((s) => ids.includes(s.id));
  const merged = mergeSamples(linked);
  const ranked = rankSamplesForGeometry(objet.geometry, linked);
  const center = geometryCenter(objet.geometry);

  return {
    ouvrage: {
      id: objet.id,
      nom: objet.nom,
      type: objet.outil_key,
      typeLabel: tool?.label ?? objet.outil_key,
      famille: tool?.family ?? 'usage',
      mesure: {
        unite: tool?.unit ?? 'u',
        valeur: Math.round(measureFor(tool?.unit ?? 'u', objet.geometry)),
      },
      centre: center ? { lat: center[0], lng: center[1] } : null,
      intention: objet.meta?.note ?? null,
    },
    prelevements: linked.map((s) => {
      const prox = ranked.find((r) => r.sample.id === s.id);
      return {
        id: s.id,
        label: s.label,
        lieu: s.location ?? null,
        distanceM: prox ? Math.round(prox.distanceM) : null,
        interieur: !!prox?.inside,
        structure: s.structure_result ?? null,
        texture: s.texture_result ?? null,
        ph: s.ph_value ?? null,
        vie: { signes: s.life_signs ?? [], vers: s.worm_count ?? null },
      };
    }),
    lectureSol: {
      phrase: merged.sentence,
      structure: merged.reading.structure.dominant ?? null,
      texture: merged.reading.texture.dominant ?? null,
      phMoyen: merged.reading.ph.average ?? null,
      amplitudePh: merged.phSpread,
      vie: merged.reading.life.dominant ?? null,
    },
    contraintes: ouvrageSoilAlerts(objet.outil_key, merged),
    especesRetenues: selectedSpecies,
  };
}
