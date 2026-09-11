/**
 * Idées d'animation de secours — affichées si l’Assistant est momentanément
 * indisponible. Volontairement génériques et fidèles aux quatre éléments du
 * récit (Sel / Eau / Argile / Vivant) : aucun fait historique inventé.
 */

import type { Segment } from './parcoursPropose';

export interface Idee {
  titre: string;
  description: string;
  duree: string;
  materiel: string;
}

export interface IdeesPoint {
  lieu: Idee[];
  vivant: Idee[];
}

export function fallbackIdees(nom: string, segment: Segment): IdeesPoint {
  const lieuVillage: Idee[] = [
    {
      titre: 'Le mot du lieu',
      description: `Chacun choisit un mot qui décrit « ${nom} » et le dépose à voix haute. La série des mots devient le titre collectif de l'arrêt.`,
      duree: '10 min',
      materiel: 'Aucun',
    },
    {
      titre: 'Cadrer le détail',
      description: 'Chacun photographie un seul détail bâti ou matière. Les images se comparent ensuite en cercle.',
      duree: '15 min',
      materiel: 'Téléphone',
    },
    {
      titre: 'Le geste retrouvé',
      description: 'Mimer ensemble un geste de travail lié à cet endroit, puis en discuter avec un saunier présent.',
      duree: '15 min',
      materiel: 'Aucun',
    },
  ];

  const lieuMarais: Idee[] = [
    {
      titre: 'Lire la pente',
      description: `Repérer d'où vient l'eau et où elle va depuis « ${nom} ». Dessiner le sens de circulation sur un carnet.`,
      duree: '15 min',
      materiel: 'Carnet, crayon',
    },
    {
      titre: 'Toucher la matière',
      description: 'Comparer à la main l’argile, la vase et le sel sec. Nommer les sensations avant toute explication.',
      duree: '10 min',
      materiel: 'Eau claire pour se rincer',
    },
    {
      titre: 'Le silence du bassin',
      description: 'Trois minutes sans parler, puis chacun nomme un son entendu. Les sons se notent avec l’heure.',
      duree: '10 min',
      materiel: 'Carnet',
    },
  ];

  const vivant: Idee[] = [
    {
      titre: 'Test du boudin',
      description: 'Humidifier une noix de terre et tenter de former un boudin, puis un anneau. La forme obtenue indique la texture dominante.',
      duree: '15 min',
      materiel: 'Un peu d’eau, une petite truelle',
    },
    {
      titre: 'Herbier des halophiles',
      description: 'Photographier trois plantes qui poussent dans le sel et les identifier ensemble, sans les cueillir.',
      duree: '20 min',
      materiel: 'Téléphone, application d’identification',
    },
    {
      titre: 'Point d’écoute avifaune',
      description: 'Cinq minutes d’écoute immobile, chacun compte les espèces distinctes entendues ou vues.',
      duree: '10 min',
      materiel: 'Jumelles si disponibles',
    },
  ];

  return { lieu: segment === 'aval' ? lieuMarais : lieuVillage, vivant };
}
