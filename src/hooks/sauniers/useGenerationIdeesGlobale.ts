import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SAUNIERS_EVENT_ID } from '@/content/sauniers/parcoursPropose';
import { genererIdeesPourArret } from '@/hooks/sauniers/useIdeesAnimation';
import type { ArretParcours } from '@/hooks/sauniers/useParcoursSauniers';

export interface ResultatGeneration {
  completes: number;
  ignores: number;
  secours: number;
  echecs: { nom: string; motif: string }[];
}

export interface EtatGenerationGlobale {
  enCours: boolean;
  index: number;
  total: number;
  nomCourant: string | null;
  ideesCreees: number;
  resultat: ResultatGeneration | null;
}

const VIDE: EtatGenerationGlobale = {
  enCours: false,
  index: 0,
  total: 0,
  nomCourant: null,
  ideesCreees: 0,
  resultat: null,
};

/** Compte les idées déjà enregistrées par arrêt de l'événement. */
async function compterParArret(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('marche_animation_idees')
    .select('waypoint_id')
    .eq('marche_event_id', SAUNIERS_EVENT_ID);
  if (error) throw new Error(`Lecture des idées : ${error.message}`);
  const carte = new Map<string, number>();
  for (const l of data ?? []) {
    carte.set(l.waypoint_id, (carte.get(l.waypoint_id) ?? 0) + 1);
  }
  return carte;
}

/**
 * Génère les idées d'animation de tous les arrêts, un arrêt après l'autre,
 * en exposant une progression lisible. Reprend là où elle s'est arrêtée.
 */
export function useGenerationIdeesGlobale(arrets: ArretParcours[]) {
  const qc = useQueryClient();
  const [etat, setEtat] = React.useState<EtatGenerationGlobale>(VIDE);
  const stop = React.useRef(false);

  const annuler = React.useCallback(() => {
    stop.current = true;
  }, []);

  const lancer = React.useCallback(
    async (remplacer: boolean) => {
      if (etat.enCours || arrets.length === 0) return;
      stop.current = false;
      setEtat({ ...VIDE, enCours: true, total: arrets.length });

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Vous devez être connecté pour enregistrer des idées.');

        const dejaLa = await compterParArret();
        const resultat: ResultatGeneration = {
          completes: 0,
          ignores: 0,
          secours: 0,
          echecs: [],
        };
        let creees = 0;

        for (let i = 0; i < arrets.length; i++) {
          if (stop.current) break;
          const arret = arrets[i];
          setEtat((e) => ({
            ...e,
            index: i + 1,
            nomCourant: arret.nom,
            ideesCreees: creees,
          }));

          if (!remplacer && (dejaLa.get(arret.id) ?? 0) > 0) {
            resultat.ignores += 1;
            continue;
          }

          try {
            const { secours } = await genererIdeesPourArret({
              waypointId: arret.id,
              point: {
                nom: arret.nom,
                sous: arret.sous,
                texte: arret.texte,
                segment: arret.segment,
              },
              remplacer,
              userId: user.id,
            });
            resultat.completes += 1;
            if (secours) resultat.secours += 1;
            creees += 6;
            await qc.invalidateQueries({ queryKey: ['sauniers-idees', arret.id] });
          } catch (e) {
            resultat.echecs.push({
              nom: arret.nom,
              motif: (e as Error)?.message ?? 'Erreur inconnue.',
            });
          }
        }

        setEtat((e) => ({
          ...e,
          enCours: false,
          nomCourant: null,
          ideesCreees: creees,
          resultat,
        }));
      } catch (e) {
        setEtat({
          ...VIDE,
          resultat: {
            completes: 0,
            ignores: 0,
            secours: 0,
            echecs: [{ nom: 'Génération', motif: (e as Error)?.message ?? 'Erreur inconnue.' }],
          },
        });
      }
    },
    [arrets, etat.enCours, qc],
  );

  const effacerResultat = React.useCallback(
    () => setEtat((e) => ({ ...e, resultat: null })),
    [],
  );

  const progression = etat.total > 0 ? Math.round((etat.index / etat.total) * 100) : 0;

  return { etat, progression, lancer, annuler, effacerResultat };
}

export default useGenerationIdeesGlobale;
