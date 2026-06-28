// Helpers locaux pour générer des indices textuels manuscrits
// pour le jeu « Qui suis-je ? ». Aucun appel réseau.
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { displayName } from './gameUtils';

export function getKingdomHint(s: BiodiversitySpecies): { emoji: string; label: string } {
  const k = (s.kingdom || '').toLowerCase();
  const fam = (s.family || '').toLowerCase();
  if (k === 'fungi') return { emoji: '🍄', label: 'un champignon' };
  if (k === 'plantae') return { emoji: '🌿', label: 'une plante' };
  if (fam.includes('aves')) return { emoji: '🐦', label: 'un oiseau' };
  if (fam.includes('insecta') || fam.includes('idae')) return { emoji: '🦋', label: 'un insecte' };
  if (k === 'animalia') return { emoji: '🐾', label: 'un animal' };
  return { emoji: '✿', label: 'un être vivant' };
}

/** Renvoie l'initiale du nom commun et un gabarit « P • • • • • » */
export function getInitialHint(s: BiodiversitySpecies): { initial: string; pattern: string } {
  const name = displayName(s).trim();
  const initial = (name.charAt(0) || '?').toUpperCase();
  const pattern = name
    .split('')
    .map((c, i) => {
      if (i === 0) return c.toUpperCase();
      if (c === ' ' || c === "'" || c === '-') return c;
      return '•';
    })
    .join(' ');
  return { initial, pattern };
}

/** Révèle 2 lettres supplémentaires (en plus de l'initiale) à des positions stables. */
export function getRevealedLettersHint(s: BiodiversitySpecies): string {
  const name = displayName(s).trim();
  // Positions à révéler : ~ milieu, et avant-dernière lettre alphabétique
  const chars = name.split('');
  const alphaIdx: number[] = [];
  chars.forEach((c, i) => { if (/[A-Za-zÀ-ÿ]/.test(c) && i !== 0) alphaIdx.push(i); });
  const reveals = new Set<number>([0]);
  if (alphaIdx.length > 0) reveals.add(alphaIdx[Math.floor(alphaIdx.length / 2)]);
  if (alphaIdx.length > 1) reveals.add(alphaIdx[alphaIdx.length - 2] ?? alphaIdx[alphaIdx.length - 1]);
  return chars
    .map((c, i) => {
      if (reveals.has(i)) return c.toUpperCase();
      if (c === ' ' || c === "'" || c === '-') return c;
      if (/[A-Za-zÀ-ÿ]/.test(c)) return '•';
      return c;
    })
    .join(' ');
}

// Petit dictionnaire écologie par famille / règne (FR, courts).
const FAMILY_ECOLOGY: Record<string, string> = {
  columbidae: 'granivore, vit souvent en groupe',
  passeridae: 'petit passereau, vit près des humains',
  corvidae: 'très intelligent, omnivore opportuniste',
  apidae: 'pollinisateur essentiel des fleurs',
  formicidae: 'vit en colonie, ingénieur du sol',
  lepidoptera: 'pollinisateur, métamorphose complète',
  papilionidae: 'grand papillon coloré, pollinisateur',
  nymphalidae: 'papillon de jour, fréquente prairies et lisières',
  fagaceae: 'arbre fournissant glands ou faînes',
  rosaceae: 'famille du rosier, fruits charnus',
  asteraceae: 'fleurs en capitule, très visitées par les abeilles',
  poaceae: 'graminée, base des prairies',
  lamiaceae: 'plante aromatique, feuilles opposées',
  fabaceae: 'fixe l\'azote du sol, gousses caractéristiques',
  agaricaceae: 'champignon à lames, décomposeur',
  boletaceae: 'champignon à pores sous le chapeau',
};

const KINGDOM_ECOLOGY: Record<string, string> = {
  fungi: 'décomposeur essentiel, vit en symbiose avec les arbres',
  plantae: 'capte le soleil et nourrit toute la chaîne du vivant',
  animalia: 'se déplace pour se nourrir',
};

export function getFamilyEcologyHint(s: BiodiversitySpecies): { family: string; trait: string } {
  const fam = (s.family || '').toLowerCase();
  const trait =
    FAMILY_ECOLOGY[fam]
    || KINGDOM_ECOLOGY[(s.kingdom || '').toLowerCase()]
    || 'vit ici, autour de la marche';
  return { family: s.family || '—', trait };
}
