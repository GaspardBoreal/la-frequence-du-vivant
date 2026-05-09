/**
 * Indice de Sentinelle V3
 * - 15 pts : variété des gestes (5 piliers)
 * - 15 pts : volume des contributions (racine carrée, sature à 64)
 * - 15 pts : diversité d'espèces (linéaire, sature à 20)
 * - 35 pts : espèces sensibles (bio×1.5 + aux×1.0 + EEE×2.0, sature à ~10 pondérées)
 * - 20 pts : voix singulière (textes + sons + témoignages, valorisés ×2.5, sature à 10 pondérés)
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
  voix:     { value: number; max: number; textes: number; sons: number; temoignage: number; weighted: number; cap: number };
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
const VOIX_CAP = 10;
const VOIX_WEIGHT = 2.5;

const PILLAR_LABELS: Record<string, string> = {
  photos: 'photo',
  sons: 'son',
  textes: 'texte',
  temoignage: 'témoignage',
  sensible: 'espèce sensible',
};

export function computeSentinelleIndex(input: SentinelleInputs): SentinelleResult {
  const { photos, sons, textes, hasTemoignage, speciesCount, bioCount, auxCount, eeeCount } = input;

  // 1. Piliers (15 pts)
  const pillarsState = {
    photos: photos > 0,
    sons: sons > 0,
    textes: textes > 0,
    temoignage: hasTemoignage,
    sensible: bioCount + auxCount + eeeCount > 0,
  };
  const pillarCount = Object.values(pillarsState).filter(Boolean).length;
  const pillarsValue = (pillarCount / 5) * 15;
  const missing = Object.entries(pillarsState).filter(([, v]) => !v).map(([k]) => PILLAR_LABELS[k]);

  // 2. Volume √ (15 pts)
  const totalContribs = photos + sons + textes + (hasTemoignage ? 1 : 0);
  const volumeValue = Math.min(Math.sqrt(totalContribs) / Math.sqrt(VOLUME_CAP), 1) * 15;

  // 3. Espèces (15 pts)
  const speciesValue = Math.min(speciesCount / SPECIES_CAP, 1) * 15;

  // 4. Sensibles (35 pts)
  const weighted = bioCount * 1.5 + auxCount * 1.0 + eeeCount * 2.0;
  const sensibleValue = Math.min(weighted / SENSIBLE_CAP, 1) * 35;

  // 5. Voix singulière (20 pts) — textes, sons, témoignages valorisés
  const temoignageNum = hasTemoignage ? 1 : 0;
  const voixWeighted = (textes + sons + temoignageNum) * VOIX_WEIGHT;
  let voixValue = Math.min(voixWeighted / VOIX_CAP, 1) * 20;
  // Plancher voix : au moins 5 pts dès la 1ʳᵉ contribution d'expression
  if (voixWeighted > 0 && voixValue < 5) voixValue = 5;

  let total = pillarsValue + volumeValue + speciesValue + sensibleValue + voixValue;
  // Plancher 15 si au moins 1 contribution
  if (totalContribs > 0 && total < 15) total = 15;
  total = Math.round(total);

  let tier: SentinelleTier = 'curieux';
  let label = 'Marcheur curieux';
  if (total >= 76)      { tier = 'sentinelle';  label = 'Sentinelle vigilante'; }
  else if (total >= 51) { tier = 'ambassadeur'; label = 'Ambassadeur confirmé'; }
  else if (total >= 26) { tier = 'eclaireur';   label = 'Éclaireur attentif'; }

  const nextTip = computeNextTip({
    pillarCount, missing,
    totalContribs, volumeValue,
    speciesCount, speciesValue,
    bioCount, auxCount, eeeCount, weighted, sensibleValue,
    voixWeighted, voixValue,
  });

  return {
    total,
    label,
    tier,
    breakdown: {
      pillars:  { value: Math.round(pillarsValue),  max: 15, count: pillarCount, of: 5, missing },
      volume:   { value: Math.round(volumeValue),   max: 15, raw: totalContribs, cap: VOLUME_CAP },
      species:  { value: Math.round(speciesValue),  max: 15, count: speciesCount, cap: SPECIES_CAP },
      sensible: { value: Math.round(sensibleValue), max: 35, bio: bioCount, aux: auxCount, eee: eeeCount, weighted, cap: SENSIBLE_CAP },
      voix:     { value: Math.round(voixValue),     max: 20, textes, sons, temoignage: temoignageNum, weighted: voixWeighted, cap: VOIX_CAP },
    },
    nextTip,
  };
}

function computeNextTip(args: {
  pillarCount: number; missing: string[];
  totalContribs: number; volumeValue: number;
  speciesCount: number; speciesValue: number;
  bioCount: number; auxCount: number; eeeCount: number; weighted: number; sensibleValue: number;
  voixWeighted: number; voixValue: number;
}): SentinelleNextTip {
  // 1. Sensibles : prioritaire (gain énorme)
  if (args.weighted < 15) {
    const gain = Math.round((1.5 / 15) * 35);
    return { text: `Détectez 1 bio-indicateur : +${gain} pts`, gain };
  }
  // 2. Voix singulière : valorise l'expression sensible
  if (args.voixWeighted < 10) {
    const next = args.voixWeighted + 2.5;
    const newVal = Math.min(next / 10, 1) * 20;
    const gain = Math.max(5, Math.round(newVal - args.voixValue));
    return { text: `Ajoutez 1 texte ou 1 son : +${gain} pts`, gain };
  }
  // 3. Pilier manquant
  if (args.missing.length > 0) {
    const target = args.missing[0];
    return { text: `Ajoutez 1 ${target} : +3 pts`, gain: 3 };
  }
  // 4. Volume
  if (args.totalContribs < 64) {
    const next = args.totalContribs + 5;
    const newVal = Math.min(Math.sqrt(next) / Math.sqrt(64), 1) * 15;
    const gain = Math.max(1, Math.round(newVal - args.volumeValue));
    return { text: `+5 contributions : +${gain} pts`, gain };
  }
  // 5. Espèces
  if (args.speciesCount < 20) {
    return { text: '+1 espèce = +1 pt', gain: 1 };
  }
  return { text: 'Vous êtes au sommet de l\'indice !', gain: 0 };
}
