import { OUVRAGE_RECO_KB } from '@/lib/ouvrageRecoKb';

export interface OuvragePrompt {
  emoji: string;
  label: string;
  text: string;
}

/**
 * Amorces contextuelles proposées quand on interroge l'IA de jardin
 * sur un ouvrage précis de l'Atelier. Elles ne sont que des textes :
 * la donnée, elle, ne part qu'avec les contextes activés.
 */
export function promptsForOuvrage(
  outilKey: string,
  label: string,
  nom?: string | null,
): OuvragePrompt[] {
  const who = nom?.trim() ? `« ${nom.trim()} » (${label.toLowerCase()})` : label.toLowerCase();
  const base: OuvragePrompt[] = [
    {
      emoji: '🌿',
      label: 'Palette adaptée',
      text: `Propose-moi une palette végétale pour ${who}, en te fondant sur le sol lu et le cortège observé autour. Justifie chaque espèce.`,
    },
    {
      emoji: '⚠️',
      label: 'Ce qu’il faut éviter',
      text: `Quelles plantations et quelles erreurs éviter sur ${who} au regard du sol et des contraintes du site ?`,
    },
    {
      emoji: '🗓️',
      label: 'Calendrier de chantier',
      text: `Donne-moi le calendrier de mise en œuvre et d’entretien (an 0, an 1, an 3) pour ${who}.`,
    },
  ];

  const reco = OUVRAGE_RECO_KB[outilKey];
  if (reco?.especes?.length) {
    base.push({
      emoji: '🔍',
      label: 'Cortège présent',
      text: `Parmi les espèces déjà observées sur le site, lesquelles confortent ${who} et lesquelles signalent une contrainte ?`,
    });
  } else {
    base.push({
      emoji: '💡',
      label: 'Intention du lieu',
      text: `Quelle intention paysagère et quelles fonctions écologiques donner à ${who} dans l’ensemble de la propriété ?`,
    });
  }
  return base;
}

/** Presets du rayon d'écoute autour de l'ouvrage. */
export const FOCUS_RADII = [10, 25, 50, 100] as const;
