import type { PartnerAuditSynthesis } from './types';

/**
 * Lecture synthétique de l'audit Vienne Nature.
 * Tous les chiffres proviennent de l'audit détaillé (Semrush base FR + GSC).
 */
export const vienneNatureSynthesis: PartnerAuditSynthesis = {
  verdict:
    "Il a l'autorité mais pas le contenu qui convertit. Nous avons le contenu qui convertit mais pas l'autorité.",
  kpis: [
    {
      label: 'Authority Score',
      themText: '30 / 100',
      usText: '2 / 100',
      themPct: 100,
      usPct: 7,
      note: "L'écart d'autorité est notre principal frein — et son principal actif.",
    },
    {
      label: 'Domaines référents',
      themText: '423',
      usText: '26',
      themPct: 100,
      usPct: 6,
      note: 'Dont une majorité de fermes à backlinks côté Fréquence.',
    },
    {
      label: 'Trafic organique estimé',
      themText: '~8 600 /mois',
      usText: 'sous le seuil',
      themPct: 100,
      usPct: 2,
      note: '41 % de son trafic tient à une seule page : /loir-lerot/.',
    },
    {
      label: 'Taux de clic (CTR)',
      themText: 'non qualifié',
      usText: '24 %',
      themPct: 18,
      usPct: 100,
      note: "Quand nous apparaissons, on nous clique. 52 % sur la page d'accueil.",
    },
    {
      label: 'Position moyenne',
      themText: 'n°1-3 sur des requêtes info',
      usText: '4,2',
      themPct: 90,
      usPct: 74,
      note: 'Déjà en page 1 sur « les marches du vivant » (3,9).',
    },
    {
      label: 'Requêtes d’action',
      themText: '0 position',
      usText: 'positionnement natif',
      themPct: 4,
      usPct: 88,
      note: '« Sortie nature », « inventaire participatif », « biodiversité entreprise » : terrain libre.',
    },
  ],
  themBrings: [
    'Une autorité réelle (AS 30) et un réseau institutionnel crédible',
    '8 600 visiteurs/mois captés sur des fiches espèces à forte audience',
    "L'antériorité et la validation taxonomique d'experts naturalistes",
    'Une entité reconnue, sans homonymie, dans les corpus régionaux',
  ],
  usBring: [
    "L'intention d'action : pages segmentées entreprises, agriculture, explorer",
    'Une lisibilité machine déjà en place (llms.txt, JSON-LD, sitemap)',
    'De la donnée primaire terrain, géolocalisée, connectée au GBIF',
    'Un canal de financement privé : offres entreprises et CSRD',
  ],
  shared: [
    'Des marches co-organisées et co-brandées, indexables commune par commune',
    'Un observatoire partagé qui couvre ses zones blanches',
    'Une co-citation dans les réponses des IA génératives',
  ],
  geo: {
    themLine: "Cité comme source de savoir naturaliste — jamais comme acteur d'action.",
    usLine: 'Techniquement prêt pour le GEO — mais corroboré par personne.',
    points: [
      'llms.txt absent chez le partenaire (404 confirmé), présent et hiérarchisé chez nous',
      'Ses contenus sont descriptifs mais peu citables : peu de chiffres datés et sourcés',
      'Nos données sont quantifiées et ouvertes — le carburant le plus citable pour un modèle',
      "Dans trois ans, une ou deux entités seront citées par défaut sur « biodiversité Vienne ». Cette place se prend maintenant.",
    ],
  },
  levers: [
    {
      title: 'Le maillage croisé',
      forThem: 'Un profil de liens rajeuni par des pages d’action fraîches et thématiques.',
      forUs: 'Un seul lien depuis vienne-nature.fr vaut plus que nos 26 domaines actuels.',
    },
    {
      title: 'Les marches co-organisées',
      forThem: 'Une couverture territoriale nouvelle, argument décisif pour ses subventions.',
      forUs: 'Un SEO local libre, atteignable en quelques semaines — mais seulement à deux.',
    },
    {
      title: 'La caution scientifique',
      forThem: 'Un accès au marché entreprises et au mécénat, aujourd’hui hors de portée.',
      forUs: 'Une donnée opposable CSRD, validée par une association naturaliste agréée.',
    },
  ],
  closing:
    'Nous lui apportons le marché, il nous apporte la caution. Le partenariat n’est pas une opération de communication : c’est une prise de position dans le corpus.',
};
