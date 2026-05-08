/**
 * Indice de Sentinelle V2
 * - 20 pts : variété des gestes (5 piliers)
 * - 20 pts : volume des contributions (racine carrée, sature à 64)
 * - 20 pts : diversité d'espèces (linéaire, sature à 20)
 * - 40 pts : espèces sensibles (bio×1.5 + aux×1.0 + EEE×2.0, sature à ~10 pondérées)
 *
 * Plancher : 15 pts dès la 1ʳᵉ contribution.
 */

export interface SentinelleInputs {
  photos: number;
  sons: number;
  textes: number;
  hasTemoignage: boolean;
  speciesCount: number;
  bioCount: number;
  auxCount: number;
  eeeCount: number;
}

export type SentinelleTier = 'curieux' | 'eclaireur' | 'ambassadeur' | 'sentinelle';

export interface SentinelleBreakdown {
  pillars:  { value: number; max: number; count: number; of: number; missing: string[] };
  volume:   { value: number; max: number; raw: number; cap: number };
  species:  { value: number; max: number; count: number; cap: number };
  sensible: { value: number; max: number; bio: number; aux: number; eee: number; weighted: number; cap: number };
}

export interface SentinelleNextTip {
  text: string;
  gain: number;
}

export interface SentinelleResult {
  total: number;
  label: string;
  tier: SentinelleTier;
  breakdown: SentinelleBreakdown;
  nextTip: SentinelleNextTip;
}

const VOLUME_CAP = 64;
const SPECIES_CAP = 20;
const SENSIBLE_CAP = 15;

const PILLAR_LABELS: Record<string, string> = {
  photos: 'photo',
  sons: 'son',
  textes: 'texte',
  temoignage: 'témoignage',
  sensible: 'espèce sensible',
};

export function computeSentinelleIndex(input: SentinelleInputs): SentinelleResult {
  const { photos, sons, textes, hasTemoignage, speciesCount, bioCount, auxCount, eeeCount } = input;

  // 1. Piliers
  const pillarsState = {
    photos: photos > 0,
    sons: sons > 0,
    textes: textes > 0,
    temoignage: hasTemoignage,
    sensible: bioCount + auxCount + eeeCount > 0,
  };
  const pillarCount = Object.values(pillarsState).filter(Boolean).length;
  const pillarsValue = (pillarCount / 5) * 20;
  const missing = Object.entries(pillarsState).filter(([, v]) => !v).map(([k]) => PILLAR_LABELS[k]);

  // 2. Volume (√)
  const totalContribs = photos + sons + textes + (hasTemoignage ? 1 : 0);
  const volumeValue = Math.min(Math.sqrt(totalContribs) / Math.sqrt(VOLUME_CAP), 1) * 20;

  // 3. Espèces
  const speciesValue = Math.min(speciesCount / SPECIES_CAP, 1) * 20;

  // 4. Sensibles
  const weighted = bioCount * 1.5 + auxCount * 1.0 + eeeCount * 2.0;
  const sensibleValue = Math.min(weighted / SENSIBLE_CAP, 1) * 40;

  let total = pillarsValue + volumeValue + speciesValue + sensibleValue;
  // Plancher 15 si au moins 1 contribution
  if (totalContribs > 0 && total < 15) total = 15;
  total = Math.round(total);

  let tier: SentinelleTier = 'curieux';
  let label = 'Marcheur curieux';
  if (total >= 76)      { tier = 'sentinelle';  label = 'Sentinelle vigilante'; }
  else if (total >= 51) { tier = 'ambassadeur'; label = 'Ambassadeur confirmé'; }
  else if (total >= 26) { tier = 'eclaireur';   label = 'Éclaireur attentif'; }

  // Conseil dynamique : geste à plus haut ROI
  const nextTip = computeNextTip({
    pillarCount, missing,
    totalContribs, volumeValue,
    speciesCount, speciesValue,
    bioCount, auxCount, eeeCount, weighted, sensibleValue,
  });

  return {
    total,
    label,
    tier,
    breakdown: {
      pillars:  { value: Math.round(pillarsValue),  max: 20, count: pillarCount, of: 5, missing },
      volume:   { value: Math.round(volumeValue),   max: 20, raw: totalContribs, cap: VOLUME_CAP },
      species:  { value: Math.round(speciesValue),  max: 20, count: speciesCount, cap: SPECIES_CAP },
      sensible: { value: Math.round(sensibleValue), max: 40, bio: bioCount, aux: auxCount, eee: eeeCount, weighted, cap: SENSIBLE_CAP },
    },
    nextTip,
  };
}

function computeNextTip(args: {
  pillarCount: number; missing: string[];
  totalContribs: number; volumeValue: number;
  speciesCount: number; speciesValue: number;
  bioCount: number; auxCount: number; eeeCount: number; weighted: number; sensibleValue: number;
}): SentinelleNextTip {
  // 1. Sensibles : prioritaire (gain énorme)
  if (args.weighted < 15) {
    // Gain exact : ajouter 1 bio = +1.5/15 × 40 = 4 pts (≈)
    const gain = Math.round((1.5 / 15) * 40);
    return { text: `Détectez 1 bio-indicateur : +${gain} pts`, gain };
  }
  // 2. Pilier manquant
  if (args.missing.length > 0) {
    const target = args.missing[0];
    return { text: `Ajoutez 1 ${target} : +4 pts`, gain: 4 };
  }
  // 3. Volume
  if (args.totalContribs < 64) {
    const next = args.totalContribs + 5;
    const newVal = Math.min(Math.sqrt(next) / Math.sqrt(64), 1) * 20;
    const gain = Math.max(1, Math.round(newVal - args.volumeValue));
    return { text: `+5 contributions : +${gain} pts`, gain };
  }
  // 4. Espèces
  if (args.speciesCount < 20) {
    return { text: '+1 espèce = +1 pt', gain: 1 };
  }
  return { text: 'Vous êtes au sommet de l\'indice !', gain: 0 };
}
