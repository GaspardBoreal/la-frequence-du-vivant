/**
 * Sources de la palette végétale recommandée.
 *
 * Transparence assumée : chaque recommandation croise le sol mesuré du site
 * avec des optima écologiques publiés. On nomme les sources, on donne les liens.
 */

export interface PaletteSource {
  id: string;
  name: string;
  role: string;
  url: string;
}

export const PALETTE_SOURCES: PaletteSource[] = [
  {
    id: 'cnpf',
    name: 'CNPF — Flore forestière française, t.1 Plaines et collines (2018)',
    role: 'Optima écologiques des arbres et arbustes (eau, texture, nutrition, pH).',
    url: 'https://www.cnpf.fr/',
  },
  {
    id: 'baseflor',
    name: 'Baseflor / Catminat — Philippe Julve',
    role: 'Indices écologiques des herbacées et des cortèges bio-indicateurs.',
    url: 'https://www.tela-botanica.org/projets/phytosociologie/',
  },
  {
    id: 'tela',
    name: 'Tela Botanica',
    role: 'Nomenclature de référence et fiches espèces de la flore de France.',
    url: 'https://www.tela-botanica.org/',
  },
  {
    id: 'vegetal-local',
    name: 'Végétal local (OFB)',
    role: 'Disponibilité en filière locale et provenance génétique des plants.',
    url: 'https://www.vegetal-local.fr/',
  },
  {
    id: 'inaturalist',
    name: 'iNaturalist',
    role: 'Photographies de référence et observations citoyennes.',
    url: 'https://www.inaturalist.org/',
  },
  {
    id: 'gbif',
    name: 'GBIF',
    role: 'Occurrences mondiales et photographies de secours.',
    url: 'https://www.gbif.org/',
  },
  {
    id: 'herody',
    name: 'Méthode Hérody · lecture bio-indicatrice du sol',
    role: 'Profil du site issu de vos étapes « J’analyse » et « J’identifie ».',
    url: 'https://www.verredeterre.fr/',
  },
];

export const PALETTE_METHOD_NOTE =
  'La palette croise le sol mesuré sur votre site avec les optima publiés pour chaque espèce. Elle propose, elle ne prescrit pas : le dernier mot revient au terrain.';

/* ── Liens sortants par espèce ───────────────────────────────────────────── */

export const inaturalistUrl = (latin: string) =>
  `https://www.inaturalist.org/search?q=${encodeURIComponent(latin)}&source=taxa`;

export const telaBotanicaUrl = (latin: string) =>
  `https://www.tela-botanica.org/bdtfx/recherche/${encodeURIComponent(latin)}`;

export const gbifUrl = (latin: string) =>
  `https://www.gbif.org/species/search?q=${encodeURIComponent(latin)}`;

export const vegetalLocalUrl = () => 'https://www.vegetal-local.fr/';
