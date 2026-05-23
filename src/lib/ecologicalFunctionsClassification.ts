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
  // Arbres urbains / parc / forêt — souvent centenaires
  Aesculus: ['arbre', 'vieil_arbre', 'mellifere', 'refuge_faune'],
  Platanus: ['arbre', 'vieil_arbre', 'refuge_faune'],
  Pinus: ['arbre', 'vieil_arbre', 'refuge_faune'],
  Cedrus: ['arbre', 'vieil_arbre', 'refuge_faune'],
  Abies: ['arbre', 'refuge_faune'],
  Picea: ['arbre', 'refuge_faune'],
  Betula: ['arbre', 'mellifere'],
  Juglans: ['arbre', 'nourricier_oiseaux'],
  Ulmus: ['arbre', 'haie_bocage'],
  Liquidambar: ['arbre'],
  Liriodendron: ['arbre', 'mellifere'],
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

/**
 * Familles d'insectes / oiseaux / champignons → tags par défaut.
 * Élargit considérablement la couverture auto (réduit les "à valider").
 */
const INSECT_FAMILY_RULES: Record<string, EcoFunction[]> = {
  // Pollinisateurs
  Vespidae: ['pollinisateur'],
  Pieridae: ['pollinisateur'],
  Nymphalidae: ['pollinisateur'],
  Lycaenidae: ['pollinisateur'],
  Papilionidae: ['pollinisateur'],
  Hesperiidae: ['pollinisateur'],
  Sphingidae: ['pollinisateur'],
  // Auxiliaires / régulateurs de ravageurs
  Coccinellidae: ['refuge_faune'],
  Carabidae: ['refuge_faune'],
  Chrysopidae: ['refuge_faune'],
  Cantharidae: ['pollinisateur', 'refuge_faune'],
  // Coléoptères floricoles
  Cetoniidae: ['pollinisateur'],
  Oedemeridae: ['pollinisateur'],
  Cleridae: ['pollinisateur'],
  Meloidae: ['pollinisateur'],
  Mordellidae: ['pollinisateur'],
  // Diptères butineurs
  Tachinidae: ['pollinisateur', 'refuge_faune'],
  // Décomposeurs
  Scarabaeidae: ['decomposeur'],
  Geotrupidae: ['decomposeur'],
  Silphidae: ['decomposeur'],
  Staphylinidae: ['decomposeur'],
};

const BIRD_FAMILY_RULES: Record<string, EcoFunction[]> = {
  // Disperseurs de graines / régulateurs
  Turdidae: ['refuge_faune'],
  Sylviidae: ['refuge_faune'],
  Paridae: ['refuge_faune'],
  Fringillidae: ['refuge_faune'],
  Emberizidae: ['refuge_faune'],
  Sittidae: ['refuge_faune', 'vieil_arbre'],
  Picidae: ['refuge_faune', 'vieil_arbre'],
  Certhiidae: ['refuge_faune', 'vieil_arbre'],
  Strigidae: ['refuge_faune'],
  Accipitridae: ['refuge_faune'],
  Hirundinidae: ['refuge_faune'],
  Apodidae: ['refuge_faune'],
};

const FUNGI_FAMILY_RULES: Record<string, EcoFunction[]> = {
  Russulaceae: ['decomposeur', 'ameliorant_sol'],
  Boletaceae: ['decomposeur', 'ameliorant_sol'],
  Amanitaceae: ['decomposeur', 'ameliorant_sol'],
  Cortinariaceae: ['decomposeur', 'ameliorant_sol'],
  Agaricaceae: ['decomposeur'],
  Tricholomataceae: ['decomposeur'],
  Polyporaceae: ['decomposeur', 'refuge_faune'],
};

/** Fallback iconic_taxon (kingdom/classe iNat) → tags génériques. */
const ICONIC_RULES: Partial<Record<string, EcoFunction[]>> = {
  Fungi: ['decomposeur'],
  Mollusca: ['decomposeur'],
  Annelida: ['decomposeur', 'ameliorant_sol'],
  Insecta: ['refuge_faune'],
  Arachnida: ['refuge_faune'],
  Aves: ['refuge_faune'],
  Amphibia: ['refuge_faune'],
  Reptilia: ['refuge_faune'],
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

  // 2. Famille (plantes + insectes + oiseaux + champignons)
  if (family) {
    if (FAMILY_RULES[family]) FAMILY_RULES[family].forEach(f => out.add(f));
    if (INSECT_FAMILY_RULES[family]) INSECT_FAMILY_RULES[family].forEach(f => out.add(f));
    if (BIRD_FAMILY_RULES[family]) BIRD_FAMILY_RULES[family].forEach(f => out.add(f));
    if (FUNGI_FAMILY_RULES[family]) FUNGI_FAMILY_RULES[family].forEach(f => out.add(f));
  }

  // 3. Fallback iconic_taxon (toujours appliqué pour donner au moins 1 tag aux groupes connus)
  if (iconic && ICONIC_RULES[iconic]) {
    ICONIC_RULES[iconic]!.forEach(f => out.add(f));
  }

  return Array.from(out);
}
