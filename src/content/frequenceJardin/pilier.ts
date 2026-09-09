/**
 * Contenu de référence des pages publiques « Fréquence Jardin ».
 *
 * Source unique : la fiche application (`frequenceJardinFiche.ts`) reste la
 * description technique ; ce fichier porte la vitrine et ses pages satellites.
 * Aucun chiffre n'est inventé : tout ce qui est affirmé ici provient du produit
 * ou des référentiels déjà cités dans le projet.
 */

import { fiche, SITE_URL } from '@/content/frequenceJardinFiche';

/** Adresse d'inscription à l'application Fréquence Jardin (tous les CTA de conversion y renvoient). */
export const FJ_SIGNUP_URL = 'https://frequence-jardin.lovable.app';

export const FJ_BASE = `${SITE_URL}/frequence-jardin`;

/** Phrase de définition — c'est elle que reprennent les moteurs et les IA. */
export const FJ_DEFINITION =
  "Fréquence Jardin est une application web française qui diagnostique le vivant d'un lieu — jardin, balcon, parc, domaine ou parcelle — en lisant son sol sur le terrain, en interprétant la flore spontanée qui y pousse, puis en proposant une palette végétale adaptée à ce que le lieu raconte.";

export const FJ_TAGLINE = fiche.baseline;

export interface FjPageRef {
  path: string;
  title: string;
  short: string;
  desc: string;
}

/** Les pages satellites, maillées entre elles et depuis la vitrine. */
export const FJ_PAGES: FjPageRef[] = [
  {
    path: '/frequence-jardin/diagnostiquer-son-jardin',
    title: 'Diagnostiquer son jardin : le guide complet',
    short: 'Diagnostiquer son jardin',
    desc:
      "Du premier tour de jardin au diagnostic écrit : ce qu'on observe, ce qu'on mesure, dans quel ordre, et ce que chaque étape produit.",
  },
  {
    path: '/frequence-jardin/plantes-bio-indicatrices',
    title: 'Plantes bio-indicatrices : ce que la flore spontanée dit du sol',
    short: 'Plantes bio-indicatrices',
    desc:
      "La table de lecture utilisée par Fréquence Jardin : pour chaque plante, ses quatre indices — eau, texture, nutrition, pH.",
  },
  {
    path: '/frequence-jardin/palette-vegetale',
    title: 'Palette végétale : choisir des plantes adaptées au lieu',
    short: 'Palette végétale',
    desc:
      "Comment une recommandation d'espèces se construit à partir d'un sol mesuré, d'un climat local et de sources botaniques nommées.",
  },
  {
    path: '/frequence-jardin/cas-jardin-monde-deviat',
    title: 'Cas concret : le Jardin Monde de Deviat (Charente)',
    short: 'Cas concret : Deviat',
    desc:
      "Un lieu suivi au long cours : prélèvements géolocalisés, photographies de terrain, lecture de sol et synthèse.",
  },
];

export interface FjPublic {
  id: string;
  title: string;
  lead: string;
  bullets: string[];
  cta: { label: string; to: string };
}

export const FJ_PUBLICS: FjPublic[] = [
  {
    id: 'particuliers',
    title: 'Particuliers — jardin, balcon, terrasse',
    lead:
      "Comprendre son bout de terre avant d'acheter des plantes. Aucune analyse de laboratoire, aucun matériel coûteux : des gestes de terrain et un carnet.",
    bullets: [
      'Un portrait de départ : votre lieu, votre temps disponible, votre envie.',
      "Jusqu'à dix prélèvements de sol posés sur le plan, structure, texture, pH et vie du sol.",
      'Une palette végétale illustrée, adaptée au sol lu et au climat de la commune.',
      "Un carnet de terrain imprimable et envoyable par courriel.",
    ],
    cta: { label: 'Démarrer mon jardin', to: FJ_SIGNUP_URL },
  },
  {
    id: 'organisations',
    title: 'Domaines, collectivités et entreprises',
    lead:
      "Documenter un site, suivre un chantier écologique et rendre compte, avec des données géolocalisées et exportables.",
    bullets: [
      'État avant / projeté / constaté sur un lot d’ouvrages, explicable ligne à ligne.',
      'Capteurs et sondes connectés (sol, météo, pluviométrie) en unités SI, posés sur le plan.',
      'Observations citoyennes des Marches du Vivant rattachées au site.',
      'Exports PDF, Excel, CSV, GeoJSON et KML pour vos rapports et vos SIG.',
    ],
    cta: { label: 'Nous écrire', to: '/marches-du-vivant/entreprises' },
  },
  {
    id: 'professionnels',
    title: 'Paysagistes et professionnels du vivant',
    lead:
      "Un outil de terrain pour argumenter vos choix devant un client : la plante proposée découle d'un sol mesuré, pas d'une habitude.",
    bullets: [
      "Indice de concordance sol / flore (ICG) opposable, détaillé espèce par espèce.",
      'Composition de massifs et de haies directement sur le plan cadastral.',
      'Dossier de chantier et rapport avant / après imprimables en A4.',
      'Clinique du vivant : foyers de maladies posés en GPS, tournée de soin ordonnée.',
    ],
    cta: { label: 'Voir la fiche technique', to: '/roadmap/frequence-jardin' },
  },
];

/** Le parcours en cinq temps, repris de la fiche application (source unique). */
export const FJ_PARCOURS =
  fiche.sections.find((s) => s.id === 'parcours')?.items ?? [];

export const FJ_MODULES = fiche.sections.find((s) => s.id === 'modules')?.items ?? [];

export interface FjQa {
  q: string;
  a: string;
}

/** Réponses factuelles, courtes, citables telles quelles. */
export const FJ_FAQ: FjQa[] = [
  {
    q: "Qu'est-ce que Fréquence Jardin ?",
    a: FJ_DEFINITION,
  },
  {
    q: 'Qui édite Fréquence Jardin ?',
    a: "L'association La Fréquence du Vivant, association loi 1901 dont le siège est à Deviat (16 190, Charente), présidée par Laurent Tripied. Fréquence Jardin prolonge le programme Les Marches du Vivant.",
  },
  {
    q: 'À qui Fréquence Jardin s’adresse-t-il ?',
    a: "Aux particuliers qui veulent comprendre leur jardin, leur balcon ou leur terrasse ; aux domaines, collectivités et entreprises qui suivent un site et doivent en rendre compte ; aux paysagistes et professionnels du vivant qui veulent fonder leurs choix d'espèces sur un sol mesuré.",
  },
  {
    q: 'Faut-il une analyse de laboratoire ?',
    a: "Non. Le diagnostic repose sur douze méthodes de terrain sans laboratoire — bêche, test du boudin, sédimentation, pH en bandelette ou pHmètre, bêche vivante, vinaigre, sachet de thé. Ce ne sont pas des dosages normés mais des classes de terrain, assumées comme telles avec leur incertitude.",
  },
  {
    q: 'Comment la flore spontanée est-elle interprétée ?',
    a: "Chaque plante bio-indicatrice porte quatre indices — eau, texture, nutrition, pH — issus de la méthode du diagnostic sensible du sol et des référentiels botaniques publiés. Le croisement avec le sol mesuré donne l'Indice de Concordance Globale (ICG), détaillable espèce par espèce.",
  },
  {
    q: "Sur quelles sources s'appuient les recommandations de plantes ?",
    a: "Sur la Flore forestière française du CNPF, les indices écologiques Baseflor / Catminat de Philippe Julve, la nomenclature de Tela Botanica, la filière Végétal local de l'Office français de la biodiversité, ainsi que les observations et photographies d'iNaturalist et de GBIF.",
  },
  {
    q: 'Les données sont-elles exportables ?',
    a: "Oui : impressions A4 (registre des prélèvements, atlas du cortège, palette végétale, dossier de chantier), Pack Vivant en archive ZIP réunissant PDF, Excel, CSV, GeoJSON et KML, et exports Markdown ou JSON des contextes transmis à l'IA.",
  },
  {
    q: "Y a-t-il une intelligence artificielle, et à quel coût écologique ?",
    a: "Oui, une IA de jardin volontairement frugale : l'utilisateur attache explicitement les contextes envoyés au modèle et peut consulter le Bordereau du vivant, qui détaille exactement ce qui a été transmis et le poids de chaque bloc. La démarche de mesure est documentée publiquement sur la page consacrée aux outils de mesure de l'IA frugale.",
  },
  {
    q: 'Comment commencer ?',
    a: "Depuis la page « Démarrer mon jardin » : on crée son jardin ou on rejoint celui d'un proche avec un code d'invitation, puis on répond au portrait d'intention avant le premier tour de terrain.",
  },
];

/** Repères chiffrés — tous vérifiables dans le produit ou la fiche technique. */
export const FJ_REPERES = [
  { value: '5', label: 'temps du parcours', hint: 'Observer, analyser, identifier, synthétiser, planter' },
  { value: '12', label: 'méthodes de sol', hint: 'Gestes de terrain, sans laboratoire' },
  { value: '10', label: 'prélèvements par lieu', hint: 'Géolocalisés, photographiés, historisés' },
  { value: '4', label: 'curseurs de lecture', hint: 'Eau, texture, nutrition, pH' },
];
