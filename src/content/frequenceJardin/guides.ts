/**
 * Guides publics « Fréquence Jardin ».
 *
 * Chaque guide répond à une question réellement tapée dans les moteurs.
 * Aucun contenu n'est inventé : les gestes, matériels et repères chiffrés
 * proviennent de `etudeDeSolMethodes.ts` (PUBLIC_METHODS), la lecture de la
 * flore de `plantIndicatorKb.ts`.
 */

export interface FjGuideBlock {
  title: string;
  lead?: string;
  bullets?: string[];
  /** Identifiants de méthodes de PUBLIC_METHODS à détailler dans ce bloc. */
  methodIds?: string[];
}

export interface FjQuestion {
  q: string;
  a: string;
}

export interface FjGuide {
  slug: string;
  /** Titre <title> (60 caractères visés). */
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  /** La réponse en une phrase, placée juste sous le H1 : c'est elle que citent les IA. */
  answer: string;
  intro: string;
  blocks: FjGuideBlock[];
  questions: FjQuestion[];
  /** Affiche la table complète des plantes bio-indicatrices. */
  showPlantTable?: boolean;
  ctaLabel: string;
}

export const FJ_GUIDES: FjGuide[] = [
  {
    slug: 'tableau-plantes-bio-indicatrices',
    metaTitle: 'Tableau des plantes bio-indicatrices et de leurs indices',
    description:
      "Le tableau complet des plantes bio-indicatrices utilisé par Fréquence Jardin : pour chaque espèce, ses quatre indices — eau, texture, nutrition et pH — de -3 à +3.",
    eyebrow: 'Table de lecture',
    h1: 'Tableau des plantes bio-indicatrices',
    answer:
      "Une plante bio-indicatrice est une espèce spontanée dont la présence renseigne sur les conditions du sol. Dans la table de lecture ci-dessous, chaque plante porte quatre indices notés de -3 à +3 : l'eau (de très sec à très humide), la texture (de sableuse à argile lourde), la nutrition (de pauvre à très riche) et le pH (d'acide à calcaire).",
    intro:
      "Ce tableau est la table de référence utilisée par l'application. Une plante isolée ne prouve rien : c'est la convergence de plusieurs espèces sur une même zone qui fait un indice sérieux, et cet indice se confronte toujours aux tests de sol.",
    blocks: [],
    showPlantTable: true,
    questions: [
      {
        q: 'Comment lire les indices ?',
        a: "Un indice à 0 signifie que la plante est indifférente à ce facteur : elle n'apprend rien sur lui. Ce sont les valeurs extrêmes, -3 et +3, qui portent l'information la plus forte.",
      },
      {
        q: 'Une seule plante suffit-elle à conclure ?',
        a: "Non. Une graine peut arriver n'importe où. Il faut plusieurs espèces convergentes sur une même zone, et une population installée plutôt que quelques pieds isolés.",
      },
      {
        q: 'Que faire quand la flore contredit les tests de sol ?',
        a: "On affiche l'écart au lieu de le lisser. Une divergence signale souvent un changement récent : apport de terre, amendement, drainage, ou modification de l'usage de la zone.",
      },
    ],
    ctaLabel: 'Relever la flore de mon jardin',
  },
  {
    slug: 'la-methode-frequence-jardin',
    metaTitle: 'La méthode Fréquence Jardin, expliquée',
    description:
      "Comment fonctionne Fréquence Jardin : observation, tests de sol de terrain, lecture de la flore spontanée, synthèse en quatre curseurs et palette végétale sourcée.",
    eyebrow: 'La méthode',
    h1: 'La méthode Fréquence Jardin',
    answer:
      "La méthode Fréquence Jardin lit un lieu en cinq temps : on observe le terrain et son histoire, on mesure le sol sur place par des tests reproductibles, on relève la flore spontanée qui y pousse déjà, on agrège le tout en quatre curseurs — eau, texture, nutrition, pH — puis on en déduit une palette végétale justifiable espèce par espèce.",
    intro:
      "Ce qui distingue la méthode n'est pas la difficulté des tests : ils sont tous simples. C'est la discipline de traçabilité — chaque mesure reste attachée à son point de prélèvement, daté, géolocalisé et photographiable, et rien n'est moyenné à l'aveugle.",
    blocks: [
      {
        title: 'Ce qui est mesuré, et par quel geste',
        lead: "Douze méthodes de terrain, sans laboratoire, réparties en sept familles.",
        methodIds: ['terrain', 'prelevements', 'beche', 'boudin', 'bandelette', 'beche_vivante', 'synthese'],
      },
    ],
    questions: [
      {
        q: 'Qu’est-ce que Fréquence Jardin ?',
        a: "Fréquence Jardin est une application web française qui diagnostique le vivant d'un lieu — jardin, balcon, parc, domaine ou parcelle — en lisant son sol sur le terrain, en interprétant la flore spontanée qui y pousse, puis en proposant une palette végétale adaptée à ce que le lieu raconte.",
      },
      {
        q: 'Qui édite Fréquence Jardin ?',
        a: "L'association La Fréquence du Vivant, qui organise également Les Marches du Vivant, des immersions collectives de mesure de la biodiversité d'un territoire.",
      },
      {
        q: 'À qui s’adresse l’application ?',
        a: "Aux particuliers (jardin, balcon, terrasse), aux domaines, collectivités et entreprises qui gèrent des espaces extérieurs, et aux paysagistes et professionnels du végétal qui ont besoin d'un diagnostic traçable.",
      },
      {
        q: 'Que produit un diagnostic ?',
        a: "Un carnet de terrain daté et imprimable en A4 : chaque prélèvement avec sa position, ses mesures et ses photographies, la synthèse du site en quatre curseurs, la lecture de la flore, et la palette végétale associée.",
      },
      {
        q: 'Faut-il des compétences en botanique ou en agronomie ?',
        a: "Non. Les tests sont conçus pour être exécutés sans formation préalable, avec du matériel courant. L'interprétation est produite par l'application à partir des valeurs saisies.",
      },
    ],
    ctaLabel: 'Commencer un diagnostic',
  },
];

export const FJ_GUIDE_MAP: Record<string, FjGuide> = FJ_GUIDES.reduce((acc, g) => {
  acc[g.slug] = g;
  return acc;
}, {} as Record<string, FjGuide>);
