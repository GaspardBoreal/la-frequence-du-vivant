export type IsegcomMba = "Communication Globale & Stratégies d'Influence" | "Communication & Événementiel";

export type IsegcomProject = {
  id: string;
  title: string;
  mba: IsegcomMba;
  url: string;
  description: string;
  highlights: string[];
};

export const ISEGCOM_PROJECTS: IsegcomProject[] = [
  {
    id: "marketing-automation",
    title: "Catalogue Marketing Automation",
    mba: "Communication Globale & Stratégies d'Influence",
    url: "https://marketing-automation-lmdv.lovable.app",
    description:
      "Module intelligent d'automation pour multiplier la participation aux marches biodiversité (parcours email, scoring, relances).",
    highlights: ["Scénarios CRM", "Scoring engagement", "Relances multi-canal"],
  },
  {
    id: "offre-mecenat",
    title: "Mécénat & Expérience Collaborateurs",
    mba: "Communication & Événementiel",
    url: "https://offre-mecenat-lmdv.lovable.app",
    description:
      "Page premium présentant l'offre mécénat aux entreprises : valeurs, contreparties, parcours collaborateurs sur le terrain.",
    highlights: ["Pitch B2B", "Contreparties RSE", "Expérience salariés"],
  },
  {
    id: "rv-biodiv",
    title: "Réalité Virtuelle & Biodiversité locale",
    mba: "Communication & Événementiel",
    url: "https://realite-vituelle-biodiv-locale.lovable.app",
    description:
      "Concept de team-building immersif mêlant casque VR et reconnaissance d'espèces locales pour réenchanter l'entreprise.",
    highlights: ["VR & terrain", "Team building", "Biodiv ludique"],
  },
  {
    id: "notification-sms",
    title: "Notification SMS",
    mba: "Communication Globale & Stratégies d'Influence",
    url: "https://notification-sms-lmdv.lovable.app",
    description:
      "Système de notifications SMS responsives pour mobiliser les marcheurs avant, pendant et après chaque sortie.",
    highlights: ["SMS contextuels", "Rappels J-1", "Feedback à chaud"],
  },
  {
    id: "france-travail",
    title: "Op. France Travail & Missions Locales",
    mba: "Communication Globale & Stratégies d'Influence",
    url: "https://op-france-travail-missionlocale.lovable.app",
    description:
      "Plaquette interactive premium pensée pour France Travail et les Missions Locales : insertion par le vivant.",
    highlights: ["Insertion sociale", "Plaquette interactive", "Story-driven"],
  },
  {
    id: "ambassadeurs",
    title: "Recrutement Ambassadeurs",
    mba: "Communication Globale & Stratégies d'Influence",
    url: "https://ambassadeurs-marches-du-vivants.lovable.app",
    description:
      "Landing de recrutement des ambassadeurs locaux des Marches du Vivant : promesse, parcours, formulaire.",
    highlights: ["Recrutement", "Promesse claire", "Funnel conversion"],
  },
  {
    id: "app-famille",
    title: "App Famille — Écosystème personnel",
    mba: "Communication & Événementiel",
    url: "https://versionjoueur.lovable.app",
    description:
      "Application famille avec écosystème personnel évolutif (avatar vivant) qui grandit au fil des observations.",
    highlights: ["Gamification", "Avatar évolutif", "Famille-friendly"],
  },
  {
    id: "agence-tourisme",
    title: "Offre Agence Tourisme",
    mba: "Communication & Événementiel",
    url: "https://agence-tourisme-bordeaux.lovable.app",
    description:
      "Site web pour positionner Les Marches du Vivant auprès des agences de tourisme bordelaises : circuits, valeurs, devis.",
    highlights: ["Pitch tourisme", "Circuits sur-mesure", "Conversion B2B"],
  },
  {
    id: "onboarding",
    title: "Onboarding Ambassadeurs",
    mba: "Communication Globale & Stratégies d'Influence",
    url: "https://onboarding-ambassadeur.lovable.app",
    description:
      "App mobile-first guidant l'aspirant ambassadeur de la découverte du rôle jusqu'au bon contact humain.",
    highlights: ["Mobile-first", "Parcours guidé", "Match humain"],
  },
  {
    id: "newsletter",
    title: "Générateur de Newsletter",
    mba: "Communication Globale & Stratégies d'Influence",
    url: "https://newsletter-lmdv-generator.lovable.app",
    description:
      "Outil web (HTML/CSS/JS) qui assemble en quelques clics une newsletter Marches du Vivant prête à envoyer.",
    highlights: ["Drag & assemble", "Templates éditoriaux", "Export prêt"],
  },
  {
    id: "universite",
    title: "Offre Université Bordeaux",
    mba: "Communication & Événementiel",
    url: "https://offre-universite-bordeaux.lovable.app",
    description:
      "Brief complet adressé à l'Université de Bordeaux : observatoire poétique, partenariats étudiants & recherche.",
    highlights: ["Académique", "Observatoire poétique", "Partenariats"],
  },
  {
    id: "configurateur-marche",
    title: "Configurateur de Marche",
    mba: "Communication & Événementiel",
    url: "https://generateur-de-marche.lovable.app",
    description:
      "Page intégrée à la plateforme : configurer une marche idéale (durée, thème, public, ambiance) en quelques étapes.",
    highlights: ["UX guidée", "Personnalisation", "Intégration plateforme"],
  },
  {
    id: "cooperatives",
    title: "Offre Coopératives & Caves Coop",
    mba: "Communication & Événementiel",
    url: "https://team-building-lesmarchesduvivant.lovable.app",
    description:
      "Landing B2B premium pour l'expérience team-building « Marche Collaborative » destinée aux coopératives et caves coop.",
    highlights: ["B2B premium", "Team building", "Marché coopératif"],
  },
];
