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
    slug: 'comment-analyser-le-sol-de-son-jardin',
    metaTitle: 'Comment analyser le sol de son jardin soi-même',
    description:
      "Analyser le sol de son jardin sans laboratoire : structure, texture, pH et vie du sol en une demi-journée, avec une bêche, un bocal et une bandelette. Gestes, repères et lecture.",
    eyebrow: 'Guide pratique',
    h1: 'Comment analyser le sol de son jardin soi-même',
    answer:
      "Analyser le sol de son jardin consiste à mesurer quatre choses sur le terrain : sa structure (test de la bêche), sa texture (test du boudin), son acidité (bandelette pH) et sa vie biologique (comptage des vers de terre). Ces quatre tests demandent une bêche, un bocal, un peu d'eau déminéralisée et une demi-journée — aucun laboratoire n'est nécessaire.",
    intro:
      "Un laboratoire donne des chiffres ; le terrain donne une lecture. Pour choisir des plantes, décider d'un amendement ou comprendre pourquoi l'eau stagne, la lecture de terrain suffit — à condition d'être méthodique et de toujours rattacher chaque mesure à l'endroit précis où elle a été prise.",
    blocks: [
      {
        title: 'Avant de creuser : l’histoire du terrain',
        lead: "Un sol remanié, remblayé ou décaissé ne se lit pas comme un sol en place. Cette question se pose avant le premier coup de bêche, sans quoi toutes les mesures suivantes sont mal interprétées.",
        methodIds: ['terrain', 'prelevements'],
      },
      {
        title: 'La structure : comment la terre se tient',
        lead: "Une motte qui tombe en bloc massif, en agrégats nets ou en grains ne raconte pas la même histoire. C'est la structure qui décide si l'eau s'infiltre et si les racines passent.",
        methodIds: ['beche', 'stabilite'],
      },
      {
        title: 'La texture : de quoi la terre est faite',
        lead: "Sable, limon, argile : la proportion se lit à la main en cinq minutes, puis se confirme au bocal en vingt-quatre heures.",
        methodIds: ['boudin', 'sedimentation'],
      },
      {
        title: 'L’acidité : le pH',
        lead: "Le pH conditionne la disponibilité des éléments nutritifs et détermine quelles plantes prospéreront. Il se mesure à la bandelette, ou au pHmètre pour une valeur plus fine.",
        methodIds: ['bandelette', 'phmetre'],
      },
      {
        title: 'La vie du sol : ce qui travaille pour vous',
        lead: "Vers de terre, galeries, mycélium, radicelles : la vie du sol fabrique la fertilité. Elle se compte.",
        methodIds: ['beche_vivante', 'vinaigre', 'sachet'],
      },
      {
        title: 'La lecture d’ensemble',
        lead: "Les mesures isolées ne servent à rien tant qu'elles ne sont pas agrégées en une lecture du site, puis confrontées à la flore spontanée qui pousse déjà là.",
        methodIds: ['synthese'],
      },
    ],
    questions: [
      {
        q: 'Faut-il envoyer un échantillon en laboratoire ?',
        a: "Non pour choisir des plantes, comprendre l'eau ou évaluer la vie du sol : les tests de terrain suffisent. Une analyse de laboratoire reste utile pour doser précisément les éléments nutritifs ou rechercher des polluants — ce que les tests de terrain ne font pas.",
      },
      {
        q: 'Combien de prélèvements faut-il faire ?',
        a: "Un seul point ne représente jamais un jardin entier. Fréquence Jardin permet jusqu'à dix prélèvements géolocalisés par propriété ; en pratique, trois à cinq points suffisent pour un jardin de particulier, davantage dès qu'il y a des zones d'usage différentes.",
      },
      {
        q: 'À quelle saison faut-il faire les tests ?',
        a: "Sur un sol frais, ni sec ni détrempé : le printemps et l'automne sont les meilleures périodes. Un sol gelé ou desséché fausse le test de la bêche et le comptage des vers de terre.",
      },
      {
        q: 'Combien de temps cela prend-il ?',
        a: "Une demi-journée de terrain pour un jardin de particulier, hors tests différés : la sédimentation demande 24 heures de repos, le sachet de thé enterré 6 à 8 semaines.",
      },
    ],
    ctaLabel: 'Diagnostiquer mon jardin',
  },
  {
    slug: 'test-du-boudin-texture-du-sol',
    metaTitle: 'Test du boudin : connaître la texture de sa terre',
    description:
      "Le test du boudin dit en cinq minutes si votre terre est sableuse, limoneuse ou argileuse. Le geste, les trois résultats possibles et leur teneur en argile.",
    eyebrow: 'Test de terrain',
    h1: 'Le test du boudin : sableux, limoneux ou argileux ?',
    answer:
      "Le test du boudin consiste à rouler de la terre humidifiée en un boudin d'environ 1 cm de diamètre, puis à le courber entre les doigts. Un boudin qui ne tient pas droit indique environ 10 % d'argile (sol sableux) ; un boudin qui se courbe en lune, 10 à 30 % d'argile ; un boudin qui se referme en cercle sans casser, plus de 30 % d'argile (sol argileux).",
    intro:
      "C'est le test le plus rapide et le plus fiable pour connaître la nature d'une terre. Il ne demande que de la terre et un peu d'eau, et se refait à chaque prélèvement pour comparer les zones d'un même jardin.",
    blocks: [
      {
        title: 'Le geste, pas à pas',
        methodIds: ['boudin'],
      },
      {
        title: 'Confirmer au bocal',
        lead: "Quand le boudin hésite entre deux classes, la sédimentation tranche : les particules se déposent par taille et les strates se lisent à l'œil.",
        methodIds: ['sedimentation'],
      },
    ],
    questions: [
      {
        q: 'Quelle humidité faut-il pour le test du boudin ?',
        a: "La terre doit être humidifiée jusqu'à devenir malléable, sans coller ni ruisseler. Trop sèche, elle s'effrite et fait conclure à tort à un sol sableux ; détrempée, elle se laisse rouler quelle que soit sa nature.",
      },
      {
        q: 'Que faire si le résultat diffère d’un endroit à l’autre du jardin ?',
        a: "C'est normal et c'est une information : la texture varie selon les zones, surtout sur un terrain remanié. Chaque résultat reste attaché à son point de prélèvement plutôt que d'être moyenné.",
      },
      {
        q: 'Une terre argileuse est-elle un mauvais sol ?',
        a: "Non. Une argile retient l'eau et les éléments nutritifs ; elle se travaille simplement plus difficilement et se compacte plus vite. Le problème n'est jamais la texture en soi, mais l'inadéquation entre la texture et ce qu'on veut y planter.",
      },
    ],
    ctaLabel: 'Enregistrer mes tests dans un carnet',
  },
  {
    slug: 'test-de-sedimentation-bocal',
    metaTitle: 'Test de sédimentation : lire sa terre dans un bocal',
    description:
      "Un bocal, de la terre, de l'eau et 24 heures de repos : le test de sédimentation sépare sable, limon et argile en strates lisibles. Méthode et interprétation.",
    eyebrow: 'Test de terrain',
    h1: 'Le test de sédimentation au bocal',
    answer:
      "Le test de sédimentation consiste à remplir un bocal transparent au tiers de terre, à compléter d'eau claire, à agiter énergiquement puis à laisser reposer 24 heures. Les particules se déposent par taille : le sable au fond, le limon au milieu, l'argile au-dessus. L'épaisseur relative des strates donne la classe de texture du sol.",
    intro:
      "C'est le complément visuel du test du boudin : là où le boudin se juge à la main, la sédimentation se juge à l'œil, et se photographie. Le bocal devient une preuve datée du relevé.",
    blocks: [
      { title: 'La méthode', methodIds: ['sedimentation'] },
      {
        title: 'À croiser avec le test du boudin',
        lead: "Les deux tests mesurent la même chose par deux voies différentes. Quand ils concordent, la texture est établie ; quand ils divergent, c'est souvent l'humidité de la terre au moment du boudin qui est en cause.",
        methodIds: ['boudin'],
      },
    ],
    questions: [
      {
        q: 'Combien de temps faut-il laisser reposer le bocal ?',
        a: "24 heures sans y toucher. Le sable se dépose en quelques minutes, le limon en quelques heures, l'argile met une journée entière — c'est elle qui impose le délai.",
      },
      {
        q: 'Peut-on utiliser l’eau du robinet ?',
        a: "Pour la sédimentation, oui : elle ne mesure que des tailles de particules. En revanche, jamais pour le pH — l'eau du robinet est souvent calcaire et fausse la lecture.",
      },
      {
        q: 'Que signifie la matière qui flotte à la surface ?',
        a: "Ce sont les débris organiques : racines, fragments de feuilles, matière non décomposée. Ils ne comptent pas dans la lecture des strates minérales, mais leur abondance renseigne sur la matière organique du sol.",
      },
    ],
    ctaLabel: 'Photographier et dater mes bocaux',
  },
  {
    slug: 'mesurer-le-ph-de-son-sol',
    metaTitle: 'Mesurer le pH de son sol sans laboratoire',
    description:
      "Mesurer le pH de sa terre à la bandelette ou au pHmètre : la méthode exacte, l'erreur de l'eau du robinet, et ce que la valeur change pour vos plantations.",
    eyebrow: 'Test de terrain',
    h1: 'Mesurer le pH de son sol',
    answer:
      "Pour mesurer le pH d'un sol sans laboratoire, on mélange une cuillère de terre humide à deux volumes d'eau déminéralisée, on laisse reposer dix minutes, puis on trempe une bandelette pH dans le liquide clarifié et on compare immédiatement la teinte au nuancier. L'échelle de lecture utile va de 4 à 9. L'eau du robinet, souvent calcaire, fausse le résultat et ne doit jamais être utilisée.",
    intro:
      "Le pH ne dit pas si un sol est bon : il dit quels éléments nutritifs y sont disponibles, et donc quelles plantes s'y sentiront bien. Une hortensia bleue, une bruyère ou un buis ne demandent pas le même sol — et aucune ne se force durablement.",
    blocks: [
      { title: 'À la bandelette', methodIds: ['bandelette'] },
      { title: 'Au pHmètre électronique', methodIds: ['phmetre'] },
      {
        title: 'Le test du vinaigre : y a-t-il du calcaire actif ?',
        lead: "Complément immédiat du pH, il se fait sur une motte sèche et répond en quelques secondes.",
        methodIds: ['vinaigre'],
      },
    ],
    questions: [
      {
        q: 'Pourquoi ne pas utiliser l’eau du robinet ?',
        a: "Parce qu'elle est souvent calcaire et porte son propre pH : elle tire la mesure vers le basique et rend la lecture inexploitable. Seule l'eau déminéralisée convient.",
      },
      {
        q: 'Le pH est-il le même partout dans le jardin ?',
        a: "Rarement. Un ancien tas de gravats, une bordure de mur ou un massif amendé peuvent s'écarter nettement du reste du terrain. C'est pourquoi la valeur reste attachée à son prélèvement, et que la synthèse retient à la fois la moyenne et l'amplitude.",
      },
      {
        q: 'Peut-on modifier le pH de son sol ?',
        a: "On peut l'infléchir localement et temporairement, jamais le transformer durablement sur un jardin entier. Choisir des plantes adaptées au pH mesuré coûte moins cher et tient plus longtemps que de corriger le sol chaque année.",
      },
    ],
    ctaLabel: 'Suivre le pH de mes prélèvements',
  },
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
