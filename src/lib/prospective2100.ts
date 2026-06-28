// Heuristique locale Prospectif 2100 — règles simples basées sur iconicTaxon + family.
// Renvoie un statut + une mini phrase narrative générée localement.
import type { BiodiversitySpecies } from '@/types/biodiversity';

export type Prospective2100Status = 'stable' | 'recul' | 'migrante' | 'nouvelle';

export interface Prospective2100Result {
  status: Prospective2100Status;
  narrative: string;
}

const STATUS_META: Record<Prospective2100Status, { label: string; tone: string; accent: string }> = {
  stable: { label: 'Stable', tone: 'sera encore là, fidèle à ce territoire', accent: 'emerald' },
  recul: { label: 'En recul', tone: 'pourrait se faire plus rare, sensible à la chaleur', accent: 'amber' },
  migrante: { label: 'Migrante', tone: 'glissera vers le nord, à la recherche de fraîcheur', accent: 'cyan' },
  nouvelle: { label: 'Nouvelle venue', tone: 'arrivera du sud, portée par un climat plus doux', accent: 'fuchsia' },
};

export const PROSPECTIVE_2100_ACCENTS: Record<Prospective2100Status, { ring: string; bg: string; text: string; label: string }> = {
  stable:   { ring: 'ring-emerald-400/60',  bg: 'bg-emerald-500/15',  text: 'text-emerald-200', label: 'Stable' },
  recul:    { ring: 'ring-amber-400/60',    bg: 'bg-amber-500/15',    text: 'text-amber-200',   label: 'En recul' },
  migrante: { ring: 'ring-cyan-400/60',     bg: 'bg-cyan-500/15',     text: 'text-cyan-200',    label: 'Migrante' },
  nouvelle: { ring: 'ring-fuchsia-400/60',  bg: 'bg-fuchsia-500/15',  text: 'text-fuchsia-200', label: 'Nouvelle venue' },
};

const THERMOPHILE_FAMILIES = new Set([
  'Nymphalidae', 'Pieridae', 'Lycaenidae', 'Hesperiidae', // papillons
  'Libellulidae', 'Aeshnidae', 'Coenagrionidae', // odonates
  'Cicadidae', 'Mantidae',
]);

const SENSITIVE_KINGDOMS_RECUL = new Set(['Amphibia', 'Bryophyta']);
const SENSITIVE_FAMILIES_RECUL = new Set([
  'Salamandridae', 'Ranidae', 'Bufonidae', 'Hylidae',
  'Picidae', // pics — déclin documenté
]);

// Pseudo-random stable basé sur le nom — pour qu'une espèce ait toujours le même statut.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function classifyProspective2100(s: BiodiversitySpecies): Prospective2100Result {
  const iconic = s.iconicTaxon ?? '';
  const family = s.family ?? '';
  const kingdom = s.kingdom ?? '';

  let status: Prospective2100Status = 'stable';

  if (SENSITIVE_KINGDOMS_RECUL.has(iconic) || SENSITIVE_FAMILIES_RECUL.has(family)) {
    status = 'recul';
  } else if (THERMOPHILE_FAMILIES.has(family) || iconic === 'Insecta') {
    // Insectes thermophiles : moitié migrante, moitié nouvelle (seed stable)
    status = hash(s.scientificName) % 2 === 0 ? 'migrante' : 'nouvelle';
  } else if (iconic === 'Aves') {
    // Oiseaux : majorité stable, sinon migrante
    status = hash(s.scientificName) % 3 === 0 ? 'migrante' : 'stable';
  } else if (kingdom === 'Plantae') {
    // Plantes : stable par défaut, quelques migrantes
    status = hash(s.scientificName) % 4 === 0 ? 'migrante' : 'stable';
  } else if (kingdom === 'Fungi') {
    status = hash(s.scientificName) % 3 === 0 ? 'recul' : 'stable';
  } else if (iconic === 'Mammalia') {
    status = hash(s.scientificName) % 5 === 0 ? 'migrante' : 'stable';
  }

  const subject = s.commonName?.trim() || s.scientificName;
  const narrative = `En 2100, ${subject} ${STATUS_META[status].tone}.`;

  return { status, narrative };
}
