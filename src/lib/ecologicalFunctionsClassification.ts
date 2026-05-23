/**
 * Classification multi-étiquettes d'une espèce vers ses fonctions écologiques.
 *
 * Pipeline :
 *  1. KB curée (species/genus exact match, champ `functions: string[]`)
 *  2. Règles par famille / genre / nom scientifique
 *  3. Fallback iconic_taxon (mammifères/oiseaux/insectes → fonctions probables)
 *
 * Conçu pour rester rapide (mémoïsable) et 100% côté client : aucun appel
 * réseau. La curation éditoriale (`exploration_curations.functions`) viendra
 * en surcouche dans le hook `useEcologicalFunctions` (phase D).
 */

import speciesKB from '@/data/species-knowledge-base.json';
import type { EcoFunction } from './ecologicalFunctions';

interface KBEntry {
  primary?: string;
  secondary?: string[];
  functions?: EcoFunction[];
}

const KB = (speciesKB as { species: Record<string, KBEntry> }).species || {};

/** Familles botaniques → fonctions probables. */
const FAMILY_RULES: Record<string, EcoFunction[]> = {
  // Fabaceae (légumineuses) : fixateurs d'azote
  Fabaceae: ['fixateur_azote', 'mellifere'],
  // Tilleuls, saules, robiniers, érables : mellifères + arbres
  Tiliaceae: ['arbre', 'mellifere', 'vieil_arbre'],
  Malvaceae: ['mellifere'],
  Salicaceae: ['arbre', 'mellifere', 'refuge_faune'],
  Aceraceae: ['arbre', 'mellifere'],
  Sapindaceae: ['arbre', 'mellifere'],
  // Rosaceae arbustifs : nourriciers oiseaux + mellifères
  Rosaceae: ['mellifere', 'nourricier_oiseaux'],
  // Astéracées, Lamiacées, Boraginacées : mellifères majeures
  Asteraceae: ['mellifere', 'pollinisateur'],
  Lamiaceae: ['mellifere'],
  Boraginaceae: ['mellifere'],
  Apiaceae: ['mellifere', 'pollinisateur'],
  Brassicaceae: ['mellifere'],
  // Arbres forestiers
  Fagaceae: ['arbre', 'vieil_arbre', 'refuge_faune', 'nourricier_oiseaux'],
  Betulaceae: ['arbre', 'fixateur_azote'], // Alnus = fixateur via Frankia
  Juglandaceae: ['arbre', 'nourricier_oiseaux'],
  Oleaceae: ['arbre', 'mellifere'],
  Ulmaceae: ['arbre', 'mellifere'],
  // Pollinisateurs (insectes)
  Apidae: ['pollinisateur'],
  Andrenidae: ['pollinisateur'],
  Halictidae: ['pollinisateur'],
  Megachilidae: ['pollinisateur'],
  Syrphidae: ['pollinisateur'],
  Bombyliidae: ['pollinisateur'],
  // Décomposeurs
  Lumbricidae: ['decomposeur', 'ameliorant_sol'],
  Armadillidiidae: ['decomposeur'],
  Porcellionidae: ['decomposeur'],
  Glomeridae: ['decomposeur'],
  Julidae: ['decomposeur'],
};

/** Genres botaniques explicites (priorité sur la famille). */
const GENUS_RULES: Record<string, EcoFunction[]> = {
  Tilia: ['arbre', 'mellifere', 'vieil_arbre'],
  Quercus: ['arbre', 'vieil_arbre', 'nourricier_oiseaux', 'refuge_faune'],
  Fagus: ['arbre', 'vieil_arbre', 'refuge_faune'],
  Castanea: ['arbre', 'mellifere', 'nourricier_oiseaux'],
  Salix: ['arbre', 'mellifere', 'haie_bocage', 'phytoremediation'],
  Populus: ['arbre', 'phytoremediation'],
  Alnus: ['arbre', 'fixateur_azote', 'phytoremediation'],
  Robinia: ['arbre', 'mellifere', 'fixateur_azote'],
  Acer: ['arbre', 'mellifere'],
  Fraxinus: ['arbre', 'haie_bocage'],
  Carpinus: ['arbre', 'haie_bocage'],
  Corylus: ['arbre', 'haie_bocage', 'nourricier_oiseaux'],
  Sambucus: ['haie_bocage', 'nourricier_oiseaux', 'mellifere'],
  Crataegus: ['haie_bocage', 'mellifere', 'nourricier_oiseaux'],
  Prunus: ['haie_bocage', 'mellifere', 'nourricier_oiseaux'],
  Sorbus: ['arbre', 'nourricier_oiseaux'],
  Ilex: ['haie_bocage', 'nourricier_oiseaux'],
  Hedera: ['mellifere', 'nourricier_oiseaux', 'refuge_faune'],
  Rubus: ['haie_bocage', 'mellifere', 'nourricier_oiseaux', 'refuge_faune'],
  Trifolium: ['fixateur_azote', 'mellifere'],
  Medicago: ['fixateur_azote', 'mellifere'],
  Lotus: ['fixateur_azote', 'mellifere'],
  Vicia: ['fixateur_azote', 'mellifere'],
  Lavandula: ['mellifere', 'pollinisateur'],
  Thymus: ['mellifere'],
  Origanum: ['mellifere'],
  Echium: ['mellifere'],
  Borago: ['mellifere'],
  Phacelia: ['mellifere'],
  Urtica: ['plante_hote_papillons', 'ameliorant_sol'],
  Symphytum: ['ameliorant_sol', 'mellifere'],
  // Pollinisateurs vedettes
  Apis: ['pollinisateur'],
  Bombus: ['pollinisateur'],
  Xylocopa: ['pollinisateur'],
  Osmia: ['pollinisateur'],
  // Lépidoptères imagos = pollinisateurs (les hôtes côté plantes)
  Vanessa: ['pollinisateur'],
  Pieris: ['pollinisateur'],
  Aglais: ['pollinisateur'],
  Polyommatus: ['pollinisateur'],
  // Décomposeurs
  Lumbricus: ['decomposeur', 'ameliorant_sol'],
  Eisenia: ['decomposeur', 'ameliorant_sol'],
};

const ICONIC_RULES: Partial<Record<string, EcoFunction[]>> = {
  Fungi: ['decomposeur'],
  Mollusca: ['decomposeur'],
};

export interface ClassifyFnInput {
  scientificName?: string | null;
  family?: string | null;
  kingdom?: string | null;
  iconicTaxon?: string | null;
}

const isUsableFamily = (f: string) =>
  !!f && f !== 'Unknown' && !/^\d+$/.test(f);

export function classifyFunctions(sp: ClassifyFnInput): EcoFunction[] {
  const sn = (sp.scientificName || '').trim();
  const family = isUsableFamily((sp.family || '').trim()) ? (sp.family || '').trim() : '';
  const iconic = (sp.iconicTaxon || '').trim();
  const out = new Set<EcoFunction>();

  // 1. KB (espèce puis genre)
  if (sn) {
    const direct = KB[sn];
    direct?.functions?.forEach(f => out.add(f));
    const genus = sn.split(/\s+/)[0];
    if (genus && KB[genus]) KB[genus].functions?.forEach(f => out.add(f));
    if (genus && GENUS_RULES[genus]) GENUS_RULES[genus].forEach(f => out.add(f));
  }

  // 2. Famille
  if (family && FAMILY_RULES[family]) FAMILY_RULES[family].forEach(f => out.add(f));

  // 3. Fallback iconic_taxon
  if (out.size === 0 && iconic && ICONIC_RULES[iconic]) {
    ICONIC_RULES[iconic]!.forEach(f => out.add(f));
  }

  return Array.from(out);
}
