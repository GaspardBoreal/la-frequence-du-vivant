import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haversineM } from '@/utils/geoDistance';
import {
  PARCOURS_PROPOSE,
  SAUNIERS_EVENT_ID,
  SAUNIERS_EXPLORATION_ID,
  SAUNIERS_VILLE,
  SAUNIERS_DATE,
  SEGMENT_MARCHE_NOM,
  type Segment,
} from '@/content/sauniers/parcoursPropose';

export interface ArretParcours {
  id: string;
  marcheId: string;
  segment: Segment;
  nom: string;
  sous: string;
  texte: string;
  lat: number;
  lng: number;
  ordre: number;
}

export interface MarcheSegment {
  id: string;
  segment: Segment;
  nom: string;
}

interface Parcours {
  marches: MarcheSegment[];
  arrets: ArretParcours[];
}

const CLE = ['sauniers-parcours'] as const;

const metaDe = (label: string) => PARCOURS_PROPOSE.find((p) => p.nom === label);

const segmentDe = (nom: string | null): Segment =>
  nom === SEGMENT_MARCHE_NOM.aval ? 'aval' : 'amont';

async function lireParcours(): Promise<Parcours> {
  const { data: marches, error } = await supabase
    .from('marches')
    .select('id, nom_marche')
    .in('nom_marche', [SEGMENT_MARCHE_NOM.amont, SEGMENT_MARCHE_NOM.aval]);
  if (error) throw new Error(`Lecture des marches : ${error.message}`);

  const liste: MarcheSegment[] = (marches ?? []).map((m) => ({
    id: m.id,
    nom: m.nom_marche ?? '',
    segment: segmentDe(m.nom_marche),
  }));
  if (liste.length === 0) return { marches: [], arrets: [] };

  const { data: wp, error: wErr } = await supabase
    .from('exploration_waypoints')
    .select('id, after_marche_id, ordre, latitude, longitude, label')
    .eq('marche_event_id', SAUNIERS_EVENT_ID)
    .in(
      'after_marche_id',
      liste.map((m) => m.id),
    )
    .order('ordre', { ascending: true });
  if (wErr) throw new Error(`Lecture des arrêts : ${wErr.message}`);

  const arrets: ArretParcours[] = (wp ?? []).map((w) => {
    const marche = liste.find((m) => m.id === w.after_marche_id)!;
    const meta = metaDe(w.label ?? '');
    return {
      id: w.id,
      marcheId: w.after_marche_id,
      segment: marche.segment,
      nom: w.label ?? 'Arrêt',
      sous: meta?.sous ?? 'Arrêt du parcours',
      texte: meta?.texte ?? '',
      lat: Number(w.latitude),
      lng: Number(w.longitude),
      ordre: w.ordre,
    };
  });

  // Ordre global : le village d'abord, puis le marais.
  arrets.sort((a, b) => {
    if (a.segment !== b.segment) return a.segment === 'amont' ? -1 : 1;
    return a.ordre - b.ordre;
  });

  return { marches: liste, arrets };
}

export function distanceKmDe(points: { lat: number; lng: number }[]): number {
  let m = 0;
  for (let i = 0; i < points.length - 1; i++) {
    m += haversineM(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
  }
  return Math.round((m / 1000) * 100) / 100;
}

/** Recalcule distance et point de départ de la marche d'un segment. */
async function majMarche(marcheId: string, arrets: ArretParcours[]) {
  const suite = arrets.filter((a) => a.marcheId === marcheId).sort((a, b) => a.ordre - b.ordre);
  if (suite.length === 0) return;
  await supabase
    .from('marches')
    .update({
      latitude: suite[0].lat,
      longitude: suite[0].lng,
      distance_km: distanceKmDe(suite),
    })
    .eq('id', marcheId);
}

/* ------------------------------- amorçage -------------------------------- */

export interface EtatAmorcage {
  actif: boolean;
  libelle: string;
  progression: number;
  erreur: string | null;
}

/**
 * Crée, si elles manquent, les deux marches de l'événement et leurs arrêts.
 * Idempotent : ne crée que ce qui n'existe pas encore.
 */
async function amorcer(
  parcours: Parcours,
  userId: string,
  avance: (libelle: string, progression: number) => void,
): Promise<void> {
  avance('Lecture du parcours…', 15);

  const segments: Segment[] = ['amont', 'aval'];
  let fait = 15;

  for (const segment of segments) {
    let marche = parcours.marches.find((m) => m.segment === segment);

    if (!marche) {
      avance(
        segment === 'amont'
          ? 'Création de la marche du village…'
          : 'Création de la marche du marais…',
        (fait += 15),
      );
      const tete = PARCOURS_PROPOSE.find((p) => p.segment === segment)!;
      const { data, error } = await supabase
        .from('marches')
        .insert({
          nom_marche: SEGMENT_MARCHE_NOM[segment],
          ville: SAUNIERS_VILLE,
          departement: 'Charente-Maritime',
          region: 'Nouvelle-Aquitaine',
          latitude: tete.lat,
          longitude: tete.lng,
          date: SAUNIERS_DATE,
          radius_m: 500,
          theme_principal: 'Marais salants',
          descriptif_court:
            segment === 'amont'
              ? "Les stations patrimoniales d'Ars-en-Ré, le sel raconté par le bâti."
              : 'Le marais salant : le sel, l’eau, l’argile et le vivant.',
        })
        .select('id, nom_marche')
        .single();
      if (error) throw new Error(`Création de la marche : ${error.message}`);
      marche = { id: data.id, nom: data.nom_marche ?? '', segment };

      const { error: lErr } = await supabase
        .from('exploration_marches')
        .insert({ exploration_id: SAUNIERS_EXPLORATION_ID, marche_id: marche.id });
      if (lErr && !lErr.message.includes('duplicate')) {
        throw new Error(`Rattachement à l’expérience : ${lErr.message}`);
      }
    }

    const dejaLa = parcours.arrets.filter((a) => a.marcheId === marche!.id);
    if (dejaLa.length === 0) {
      avance('Enregistrement des arrêts…', (fait += 25));
      const aCreer = PARCOURS_PROPOSE.filter((p) => p.segment === segment);
      const { error: wErr } = await supabase.from('exploration_waypoints').insert(
        aCreer.map((p, i) => ({
          marche_event_id: SAUNIERS_EVENT_ID,
          after_marche_id: marche!.id,
          ordre: i + 1,
          latitude: p.lat,
          longitude: p.lng,
          label: p.nom,
          include_in_biodiversity: true,
          created_by: userId,
        })),
      );
      if (wErr) throw new Error(`Enregistrement des arrêts : ${wErr.message}`);
      await majMarche(
        marche.id,
        aCreer.map((p, i) => ({
          id: '',
          marcheId: marche!.id,
          segment,
          nom: p.nom,
          sous: p.sous,
          texte: p.texte,
          lat: p.lat,
          lng: p.lng,
          ordre: i + 1,
        })),
      );
    }
  }

  avance('Parcours prêt.', 100);
}

/* --------------------------------- hook ---------------------------------- */

export function useParcoursSauniers(peutEcrire: boolean) {
  const qc = useQueryClient();
  const [etat, setEtat] = React.useState<EtatAmorcage>({
    actif: false,
    libelle: 'Lecture du parcours…',
    progression: 5,
    erreur: null,
  });
  const lance = React.useRef(false);

  const requete = useQuery({
    queryKey: CLE,
    queryFn: lireParcours,
    staleTime: 10_000,
  });

  const parcours = requete.data;
  const complet =
    !!parcours &&
    parcours.marches.length === 2 &&
    parcours.marches.every((m) => parcours.arrets.some((a) => a.marcheId === m.id));

  const demarrer = React.useCallback(async () => {
    if (!parcours) return;
    lance.current = true;
    setEtat({ actif: true, libelle: 'Lecture du parcours…', progression: 10, erreur: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expirée : reconnectez-vous.');
      await amorcer(parcours, user.id, (libelle, progression) =>
        setEtat((e) => ({ ...e, libelle, progression })),
      );
      await qc.invalidateQueries({ queryKey: CLE });
      setEtat({ actif: false, libelle: 'Parcours prêt.', progression: 100, erreur: null });
    } catch (e) {
      setEtat({
        actif: false,
        libelle: 'Préparation interrompue.',
        progression: 100,
        erreur: (e as Error)?.message ?? 'Erreur inconnue.',
      });
    }
  }, [parcours, qc]);

  React.useEffect(() => {
    if (!peutEcrire || !parcours || complet || lance.current) return;
    void demarrer();
  }, [peutEcrire, parcours, complet, demarrer]);

  const reessayer = React.useCallback(() => {
    lance.current = false;
    setEtat((e) => ({ ...e, erreur: null }));
    void demarrer();
  }, [demarrer]);

  const arrets = parcours?.arrets ?? [];

  const apres = async (marcheId?: string) => {
    const frais = await lireParcours();
    qc.setQueryData(CLE, frais);
    if (marcheId) await majMarche(marcheId, frais.arrets);
    await qc.invalidateQueries({ queryKey: CLE });
  };

  const deplacer = useMutation({
    mutationFn: async ({ id, lat, lng }: { id: string; lat: number; lng: number }) => {
      const arret = arrets.find((a) => a.id === id);
      const { error } = await supabase
        .from('exploration_waypoints')
        .update({ latitude: lat, longitude: lng })
        .eq('id', id);
      if (error) throw new Error(error.message);
      await apres(arret?.marcheId);
    },
  });

  const renommer = useMutation({
    mutationFn: async ({ id, nom }: { id: string; nom: string }) => {
      const { error } = await supabase
        .from('exploration_waypoints')
        .update({ label: nom })
        .eq('id', id);
      if (error) throw new Error(error.message);
      await apres();
    },
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const arret = arrets.find((a) => a.id === id);
      const { error } = await supabase.from('exploration_waypoints').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await apres(arret?.marcheId);
    },
  });

  const ajouter = useMutation({
    mutationFn: async ({
      segment,
      nom,
      lat,
      lng,
    }: {
      segment: Segment;
      nom: string;
      lat: number;
      lng: number;
    }) => {
      const marche = parcours?.marches.find((m) => m.segment === segment);
      if (!marche) throw new Error('La marche de ce segment n’existe pas encore.');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const max = Math.max(0, ...arrets.filter((a) => a.marcheId === marche.id).map((a) => a.ordre));
      const { data, error } = await supabase
        .from('exploration_waypoints')
        .insert({
          marche_event_id: SAUNIERS_EVENT_ID,
          after_marche_id: marche.id,
          ordre: max + 1,
          latitude: lat,
          longitude: lng,
          label: nom,
          include_in_biodiversity: true,
          created_by: user?.id ?? null,
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      await apres(marche.id);
      return data.id as string;
    },
  });

  const changerSegment = useMutation({
    mutationFn: async (id: string) => {
      const arret = arrets.find((a) => a.id === id);
      if (!arret) throw new Error('Arrêt introuvable.');
      const cible = arret.segment === 'amont' ? 'aval' : 'amont';
      const marche = parcours?.marches.find((m) => m.segment === cible);
      if (!marche) throw new Error('La marche de destination n’existe pas encore.');
      const max = Math.max(0, ...arrets.filter((a) => a.marcheId === marche.id).map((a) => a.ordre));
      const { error } = await supabase
        .from('exploration_waypoints')
        .update({ after_marche_id: marche.id, ordre: max + 1 })
        .eq('id', id);
      if (error) throw new Error(error.message);
      await apres(marche.id);
      await majMarche(arret.marcheId, (await lireParcours()).arrets);
    },
  });

  const reordonner = useMutation({
    mutationFn: async (idsOrdonnes: string[]) => {
      const parMarche = new Map<string, number>();
      for (const id of idsOrdonnes) {
        const arret = arrets.find((a) => a.id === id);
        if (!arret) continue;
        const suivant = (parMarche.get(arret.marcheId) ?? 0) + 1;
        parMarche.set(arret.marcheId, suivant);
        const { error } = await supabase
          .from('exploration_waypoints')
          .update({ ordre: suivant })
          .eq('id', id);
        if (error) throw new Error(error.message);
      }
      const frais = await lireParcours();
      qc.setQueryData(CLE, frais);
      for (const marcheId of parMarche.keys()) await majMarche(marcheId, frais.arrets);
      await qc.invalidateQueries({ queryKey: CLE });
    },
  });

  const reinitialiser = useMutation({
    mutationFn: async () => {
      const ids = arrets.map((a) => a.id);
      if (ids.length > 0) {
        const { error } = await supabase.from('exploration_waypoints').delete().in('id', ids);
        if (error) throw new Error(error.message);
      }
      const frais = await lireParcours();
      qc.setQueryData(CLE, frais);
      lance.current = false;
      await qc.invalidateQueries({ queryKey: CLE });
    },
  });

  const enEcriture =
    deplacer.isPending ||
    renommer.isPending ||
    supprimer.isPending ||
    ajouter.isPending ||
    changerSegment.isPending ||
    reordonner.isPending ||
    reinitialiser.isPending;

  return {
    arrets,
    marches: parcours?.marches ?? [],
    chargement: requete.isLoading,
    erreurLecture: requete.error ? (requete.error as Error).message : null,
    pret: complet,
    etat,
    reessayer,
    enEcriture,
    deplacer,
    renommer,
    supprimer,
    ajouter,
    changerSegment,
    reordonner,
    reinitialiser,
  };
}

export default useParcoursSauniers;
