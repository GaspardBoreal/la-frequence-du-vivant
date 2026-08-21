import { DOMAINE, USAGE } from '@/lib/iot/anomalies';
import { fmtProfondeur, grandeurMeta } from '@/lib/iot/grandeurs';

/**
 * Jugement de fiabilité d'une lecture instantanée.
 *
 * Le moteur d'alertes (`anomalies.ts`) travaille sur une période complète ;
 * ici on statue sur la dernière valeur d'une sonde, avec le peu de contexte
 * disponible sur un écran de synthèse : les bornes de la grandeur et les
 * autres profondeurs de la même sonde au même instant.
 *
 * Le verdict ne corrige jamais la valeur : il l'accompagne d'un doute.
 */
export interface Verdict {
  fiable: boolean;
  /** Phrase courte et lisible, destinée à l'infobulle. */
  motif: string | null;
  /** Écart entre profondeurs, si c'est ce qui a déclenché le doute. */
  regle: 'domaine' | 'usage' | 'coherence' | null;
}

const FIABLE: Verdict = { fiable: true, motif: null, regle: null };

/** Écart maximal admis, en points, entre deux profondeurs d'une même sonde. */
const ECART_PROFONDEURS: Record<string, number> = {
  soil_moisture: 20,
};

export interface LectureLite {
  grandeur: string;
  valeur: number;
  profondeur_m?: number | null;
  unite?: string | null;
}

const fmt = (v: number, g: string) => {
  const meta = grandeurMeta(g);
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: meta.digits })} ${meta.unite}`.trim();
};

/**
 * @param lecture la valeur à juger
 * @param voisines les autres relevés de la même sonde au même instant
 */
export function jugerLecture(lecture: LectureLite, voisines: LectureLite[] = []): Verdict {
  const { grandeur, valeur } = lecture;
  if (!Number.isFinite(valeur)) return FIABLE;

  const dom = DOMAINE[grandeur];
  if (dom && (valeur < dom[0] || valeur > dom[1])) {
    return {
      fiable: false,
      motif: `${fmt(valeur, grandeur)} sort du domaine physique de la grandeur (${fmt(dom[0], grandeur)} à ${fmt(dom[1], grandeur)}) — donnée brute ou mal étalonnée.`,
      regle: 'domaine',
    };
  }

  const use = USAGE[grandeur];
  if (use && (valeur < use[0] || valeur > use[1])) {
    return {
      fiable: false,
      motif: `${fmt(valeur, grandeur)} est hors de la plage rencontrée sur le terrain (${fmt(use[0], grandeur)} à ${fmt(use[1], grandeur)}) — contact de la sonde avec le sol à contrôler.`,
      regle: 'usage',
    };
  }

  /* Cohérence entre profondeurs : une même sonde ne peut pas lire un sol
     détrempé en profondeur et un sol quasi sec en surface sans transition. */
  const seuil = ECART_PROFONDEURS[grandeur];
  if (seuil != null && lecture.profondeur_m != null) {
    const autre = voisines.find(
      (v) =>
        v.grandeur === grandeur &&
        v.profondeur_m != null &&
        v.profondeur_m !== lecture.profondeur_m &&
        Number.isFinite(v.valeur) &&
        Math.abs(v.valeur - valeur) > seuil,
    );
    if (autre) {
      return {
        fiable: false,
        motif: `${fmt(valeur, grandeur)} à ${fmtProfondeur(lecture.profondeur_m)} alors que la même sonde lit ${fmt(autre.valeur, grandeur)} à ${fmtProfondeur(autre.profondeur_m)} — écart improbable, voie de mesure à vérifier.`,
        regle: 'coherence',
      };
    }
  }

  return FIABLE;
}

export const VERDICT_FIABLE = FIABLE;
