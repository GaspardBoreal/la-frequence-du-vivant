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
  type Segment,
} from '@/content/sauniers/parcoursPropose';

export interface ArretParcours {
  /** Identifiant de l'ancrage cartographique (waypoint) : clé des idées d'animation. */
  id: string;
  /** Marche propre à ce point. */
  marcheId: string;
  segment: Segment;
  nom: string;
  sous: string;
  texte: string;
  lat: number;
  lng: number;
  /** Numéro du point dans l'expérience (1…n). */
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

/** Le segment (village / marais) est mémorisé dans les sous-thèmes de la marche. */
const TAG_SEGMENT: Record<Segment, string> = {
  amont: 'segment:amont',
  aval: 'segment:aval',
};

const metaDe = (label: string) => PARCOURS_PROPOSE.find((p) => p.nom === label);

const segmentDe = (nom: string, sousThemes: string[] | null): Segment => {
  if (sousThemes?.includes(TAG_SEGMENT.amont)) return 'amont';
  if (sousThemes?.includes(TAG_SEGMENT.aval)) return 'aval';
  return metaDe(nom)?.segment ?? 'aval';
};

const descriptifDe = (nom: string) => {
  const meta = metaDe(nom);
  return meta ? `${meta.sous} — ${meta.texte}` : 'Arrêt du parcours Les Secrets de Sauniers.';
};

async function lireParcours(): Promise<Parcours> {
  const { data: liens, error } = await supabase
    .from('exploration_marches')
    .select('ordre, marche_id, marches!inner(id, nom_marche, latitude, longitude, sous_themes, descriptif_court)')
    .eq('exploration_id', SAUNIERS_EXPLORATION_ID)
    .order('ordre', { ascending: true });
  if (error) throw new Error(`Lecture des marches : ${error.message}`);

  const lignes = (liens ?? []) as any[];
  if (lignes.length === 0) return { marches: [], arrets: [] };

  const ids = lignes.map((l) => l.marche_id as string);

  const { data: wp, error: wErr } = await supabase
    .from('exploration_waypoints')
    .select('id, after_marche_id, latitude, longitude, label')
    .eq('marche_event_id', SAUNIERS_EVENT_ID)
    .in('after_marche_id', ids);
  if (wErr) throw new Error(`Lecture des arrêts : ${wErr.message}`);

  const parMarche = new Map<string, any>();
  for (const w of wp ?? []) parMarche.set(w.after_marche_id as string, w);

  const marches: MarcheSegment[] = [];
  const arrets: ArretParcours[] = [];

  lignes.forEach((l, index) => {
    const m = l.marches;
    const nom = (m.nom_marche as string) ?? 'Arrêt';
    const segment = segmentDe(nom, m.sous_themes as string[] | null);
    marches.push({ id: m.id, nom, segment });

    const w = parMarche.get(m.id as string);
    if (!w) return;
    const meta = metaDe(nom);
    arrets.push({
      id: w.id,
      marcheId: m.id,
      segment,
      nom,
      sous: meta?.sous ?? 'Arrêt du parcours',
      texte: meta?.texte ?? (m.descriptif_court as string) ?? '',
      lat: Number(w.latitude),
      lng: Number(w.longitude),
      ordre: (l.ordre as number) ?? index + 1,
    });
  });

  arrets.sort((a, b) => a.ordre - b.ordre);
  return { marches, arrets };
}

export function distanceKmDe(points: { lat: number; lng: number }[]): number {
  let m = 0;
  for (let i = 0; i < points.length - 1; i++) {
    m += haversineM(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
  }
  return Math.round((m / 1000) * 100) / 100;
}

/* ------------------------------- amorçage -------------------------------- */

export interface EtatAmorcage {
  actif: boolean;
  libelle: string;
  progression: number;
  erreur: string | null;
}

interface CreationPoint {
  nom: string;
  segment: Segment;
  lat: number;
  lng: number;
  ordre: number;
  userId: string | null;
}

/** Crée une marche pour un point, la rattache à l'expérience et pose son ancrage. */
async function creerPoint({ nom, segment, lat, lng, ordre, userId }: CreationPoint) {
  const { data: marche, error } = await supabase
    .from('marches')
    .insert({
      nom_marche: nom,
      ville: SAUNIERS_VILLE,
      departement: 'Charente-Maritime',
      region: 'Nouvelle-Aquitaine',
      latitude: lat,
      longitude: lng,
      date: SAUNIERS_DATE,
      radius_m: 500,
      theme_principal: 'Marais salants',
      sous_themes: [TAG_SEGMENT[segment]],
      descriptif_court: descriptifDe(nom),
    })
    .select('id')
    .single();
  if (error) throw new Error(`Création de la marche « ${nom} » : ${error.message}`);

  const { error: lErr } = await supabase.from('exploration_marches').insert({
    exploration_id: SAUNIERS_EXPLORATION_ID,
    marche_id: marche.id,
    ordre,
    publication_status: 'published_public',
  });
  if (lErr) throw new Error(`Rattachement à l’expérience : ${lErr.message}`);

  const { data: wpt, error: wErr } = await supabase
    .from('exploration_waypoints')
    .insert({
      marche_event_id: SAUNIERS_EVENT_ID,
      after_marche_id: marche.id,
      ordre: 1,
      latitude: lat,
      longitude: lng,
      label: nom,
      include_in_biodiversity: true,
      created_by: userId,
    })
    .select('id')
    .single();
  if (wErr) throw new Error(`Enregistrement de l’arrêt : ${wErr.message}`);

  return { marcheId: marche.id as string, waypointId: wpt.id as string };
}

/**
 * Crée, si elles manquent, une marche par point de référence.
 * Idempotent : un point déjà présent (par son nom) n'est jamais recréé.
 */
async function amorcer(
  parcours: Parcours,
  userId: string,
  avance: (libelle: string, progression: number) => void,
): Promise<void> {
  avance('Lecture du parcours…', 8);

  const dejaLa = new Set(parcours.marches.map((m) => m.nom));
  const aCreer = PARCOURS_PROPOSE.filter((p) => !dejaLa.has(p.nom));
  let ordre = Math.max(0, ...parcours.arrets.map((a) => a.ordre));

  for (let i = 0; i < aCreer.length; i++) {
    const p = aCreer[i];
    avance(
      `Création de la marche « ${p.nom} » (${i + 1}/${aCreer.length})…`,
      8 + Math.round(((i + 1) / aCreer.length) * 90),
    );
    ordre += 1;
    await creerPoint({
      nom: p.nom,
      segment: p.segment,
      lat: p.lat,
      lng: p.lng,
      ordre,
      userId,
    });
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
  const complet = !!parcours && parcours.arrets.length >= PARCOURS_PROPOSE.length;

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

  const reessayer = React.useCallback(() => {
    lance.current = false;
    setEtat((e) => ({ ...e, erreur: null }));
    void demarrer();
  }, [demarrer]);

  const arrets = parcours?.arrets ?? [];

  const rafraichir = async () => {
    const frais = await lireParcours();
    qc.setQueryData(CLE, frais);
    await qc.invalidateQueries({ queryKey: CLE });
    return frais;
  };

  /** Réécrit les numéros 1…n dans l'expérience selon l'ordre fourni. */
  const renumeroter = async (marcheIds: string[]) => {
    for (let i = 0; i < marcheIds.length; i++) {
      const { error } = await supabase
        .from('exploration_marches')
        .update({ ordre: i + 1 })
        .eq('exploration_id', SAUNIERS_EXPLORATION_ID)
        .eq('marche_id', marcheIds[i]);
      if (error) throw new Error(error.message);
    }
  };

  const deplacer = useMutation({
    mutationFn: async ({ id, lat, lng }: { id: string; lat: number; lng: number }) => {
      const arret = arrets.find((a) => a.id === id);
      const { error } = await supabase
        .from('exploration_waypoints')
        .update({ latitude: lat, longitude: lng })
        .eq('id', id);
      if (error) throw new Error(error.message);
      if (arret) {
        const { error: mErr } = await supabase
          .from('marches')
          .update({ latitude: lat, longitude: lng })
          .eq('id', arret.marcheId);
        if (mErr) throw new Error(mErr.message);
      }
      await rafraichir();
    },
  });

  const renommer = useMutation({
    mutationFn: async ({ id, nom }: { id: string; nom: string }) => {
      const arret = arrets.find((a) => a.id === id);
      const { error } = await supabase
        .from('exploration_waypoints')
        .update({ label: nom })
        .eq('id', id);
      if (error) throw new Error(error.message);
      if (arret) {
        const { error: mErr } = await supabase
          .from('marches')
          .update({ nom_marche: nom })
          .eq('id', arret.marcheId);
        if (mErr) throw new Error(mErr.message);
      }
      await rafraichir();
    },
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const arret = arrets.find((a) => a.id === id);
      if (!arret) throw new Error('Arrêt introuvable.');
      const { error: wErr } = await supabase.from('exploration_waypoints').delete().eq('id', id);
      if (wErr) throw new Error(wErr.message);
      const { error: lErr } = await supabase
        .from('exploration_marches')
        .delete()
        .eq('exploration_id', SAUNIERS_EXPLORATION_ID)
        .eq('marche_id', arret.marcheId);
      if (lErr) throw new Error(lErr.message);
      const { error: mErr } = await supabase.from('marches').delete().eq('id', arret.marcheId);
      if (mErr) throw new Error(mErr.message);
      await renumeroter(arrets.filter((a) => a.id !== id).map((a) => a.marcheId));
      await rafraichir();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const ordre = Math.max(0, ...arrets.map((a) => a.ordre)) + 1;
      const { waypointId } = await creerPoint({
        nom,
        segment,
        lat,
        lng,
        ordre,
        userId: user?.id ?? null,
      });
      await rafraichir();
      return waypointId;
    },
  });

  const changerSegment = useMutation({
    mutationFn: async (id: string) => {
      const arret = arrets.find((a) => a.id === id);
      if (!arret) throw new Error('Arrêt introuvable.');
      const cible: Segment = arret.segment === 'amont' ? 'aval' : 'amont';
      const { error } = await supabase
        .from('marches')
        .update({ sous_themes: [TAG_SEGMENT[cible]] })
        .eq('id', arret.marcheId);
      if (error) throw new Error(error.message);
      await rafraichir();
    },
  });

  const reordonner = useMutation({
    mutationFn: async (idsOrdonnes: string[]) => {
      const marcheIds = idsOrdonnes
        .map((id) => arrets.find((a) => a.id === id)?.marcheId)
        .filter((v): v is string => !!v);
      await renumeroter(marcheIds);
      await rafraichir();
    },
  });

  const reinitialiser = useMutation({
    mutationFn: async () => {
      const wpIds = arrets.map((a) => a.id);
      const marcheIds = arrets.map((a) => a.marcheId);
      if (wpIds.length > 0) {
        const { error } = await supabase.from('exploration_waypoints').delete().in('id', wpIds);
        if (error) throw new Error(error.message);
      }
      if (marcheIds.length > 0) {
        const { error: lErr } = await supabase
          .from('exploration_marches')
          .delete()
          .eq('exploration_id', SAUNIERS_EXPLORATION_ID)
          .in('marche_id', marcheIds);
        if (lErr) throw new Error(lErr.message);
        const { error: mErr } = await supabase.from('marches').delete().in('id', marcheIds);
        if (mErr) throw new Error(mErr.message);
      }
      lance.current = false;
      await rafraichir();
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
    demarrer,

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
