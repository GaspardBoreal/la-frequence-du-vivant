/**
 * Journal des briques — Ver de Terre Production × La Fréquence du Vivant.
 * Chaque brique livrée depuis la proposition du 9 juillet 2026 = une entrée.
 * Ajouter une brique = ajouter une entrée ici, sans toucher à la page.
 */

export type JournalTheme = 'observer' | 'mesurer' | 'raconter' | 'piloter';

export interface JournalEntry {
  /** Date de livraison (ISO) */
  date: string;
  titre: string;
  description: string;
  theme: JournalTheme;
  /** Lien vers la démo ou la page concernée (facultatif) */
  lien?: string;
  lienLabel?: string;
  statut: 'livre' | 'en_cours';
}

export const JOURNAL_THEME_LABEL: Record<JournalTheme, string> = {
  observer: 'Observer',
  mesurer: 'Mesurer',
  raconter: 'Raconter',
  piloter: 'Piloter',
};

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    date: '2026-07-09',
    titre: 'La proposition fondatrice',
    description:
      'La page de négociation qui a tout lancé : les Marches du Vivant comme prolongement digital et IA de la formation « À la racine du paysage ». Diagnostic biodiversité, Pack Vivant RSE, chatbot géo-contextuel.',
    theme: 'piloter',
    lien: '/offre-VDT-MDV',
    lienLabel: 'Relire la proposition',
    statut: 'livre',
  },
  {
    date: '2026-08-10',
    titre: 'Couche IoT en production',
    description:
      'Sondes de sol BRAD TECHNOLOGY multi-profondeurs (5/15/30/60 cm) raccordées par webhook signé, stations météo parcellaires WEENAT à collecte horaire. Le sol parle en continu, la plateforme écoute.',
    theme: 'mesurer',
    statut: 'livre',
  },
  {
    date: '2026-08-24',
    titre: 'Chantier avant / après',
    description:
      'Chaque chantier devient un lot d’ouvrages persistant : prélèvements de sol et médias par phase, Indice de Continuité Écologique avant / projeté / constaté, rapport A4 simple ou complet.',
    theme: 'piloter',
    statut: 'livre',
  },
  {
    date: '2026-09-05',
    titre: 'Trois démonstrateurs animés',
    description:
      '« La haie qui chasse la nuit », « Le sol éponge », « La fenêtre de butinage » : trois animations pédagogiques interactives, avec fiches sources, pour montrer ce qu’un diagnostic vivant raconte.',
    theme: 'raconter',
    statut: 'livre',
  },
  {
    date: '2026-09-12',
    titre: 'L’Herbier du moment',
    description:
      'Sur chaque propriété, les espèces observées se regroupent par nom scientifique : galerie chronologique des photos de terrain, recherche « contient » sur les noms français et latins, onglets Flore / Faune / Autres.',
    theme: 'observer',
    statut: 'livre',
  },
  {
    date: '2026-09-18',
    titre: 'Le configurateur Jardin nourricier',
    description:
      'Le patrimoine logiciel lu de trois façons, à la carte : chaque brique cochée recalcule le montant en direct, avec récapitulatif imprimable et lien de sélection partageable.',
    theme: 'piloter',
    lien: '/partenaires/vdtp/configurateur-18-09-2026',
    lienLabel: 'Ouvrir la version officielle du 18.09.2026',
    statut: 'livre',
  },
  {
    date: '2026-09-20',
    titre: 'Plan d’action généré par IA',
    description:
      'Sur la page partenaire, un simulateur produit un plan d’action crédible en un appel : dimensionnement en sites sentinelles, calendrier sur fenêtres biologiques réelles, protocoles nationaux (OAB, Vigie-Chiro, Spipoll), export PDF. Chaque simulation est archivée pour analyse.',
    theme: 'piloter',
    statut: 'livre',
  },
  {
    date: '2026-09-26',
    titre: 'Le Cortège vivant',
    description:
      'Dans chaque chantier, les espèces s’affichent en orbites autour du tracé choisi : rayon d’écoute réglable depuis le bord, curseur temporel avant / après les travaux, liseré doré pour les espèces apparues après.',
    theme: 'observer',
    statut: 'livre',
  },
  {
    date: '2026-09-28',
    titre: 'Ce journal des briques',
    description:
      'La frise que vous lisez : chaque livraison y sera ajoutée, datée et reliée à sa démo. Une seule source de contenu, mise à jour à chaque livraison.',
    theme: 'raconter',
    statut: 'livre',
  },
  {
    date: '2026-09-28',
    titre: 'Configurateur enrichi et synthèse mensuelle',
    description:
      'La version officielle du 18 septembre 2026 est figée et datée ; un configurateur enrichi valorise en plus les briques livrées depuis, sans changer le prix du périmètre initial. Une synthèse graphique mensuelle résume les nouveautés.',
    theme: 'piloter',
    lien: '/partenaires/vdtp/configurateur',
    lienLabel: 'Ouvrir le configurateur enrichi',
    statut: 'livre',
  },
];
