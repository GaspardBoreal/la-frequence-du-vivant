import { useMemo } from 'react';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { useProprieteObjets } from '@/hooks/propriete/usePropertyObjets';
import { useProprieteZones } from '@/hooks/propriete/usePropertyZones';
import { useProprieteParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { usePropertySynthesis } from '@/hooks/propriete/usePropertySynthesis';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { usePropertyFloraMatched } from '@/hooks/propriete/usePropertyFloraMatched';
import { usePropertyIntention } from '@/hooks/propriete/usePropertyIntention';
import { placedSamples, buildOuvrageSoilDossier, mergeSamples } from '@/lib/soilLinkEngine';
import { geometryAreaM2, geometryCenter, measureFor } from '@/components/propriete/palette/studio/geoMetrics';
import { payloadBytes } from '@/lib/chatContextCost';
import type { ContextProvider } from '@/hooks/useChatPageContext';
import { useProprieteChatFocus } from '@/components/propriete/chatbot/proprieteChatFocus';
import { classifyObservations, rollupSpecies } from '@/lib/ouvrageScope';

const R = 6371000;
const distanceM = (a: [number, number], b: [number, number]) => {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const round = (v: number | null | undefined, d = 1) =>
  v == null || !Number.isFinite(v) ? null : Number(v.toFixed(d));

const provider = (p: Omit<ContextProvider, 'bytes'>): ContextProvider => ({
  ...p,
  bytes: payloadBytes(p.payload),
});

/**
 * IA de jardin frugale : construit les contextes activables de la propriété.
 * Tout est calculé depuis les données déjà en mémoire — aucun appel réseau
 * supplémentaire — et rien n'est transmis au modèle tant que l'utilisateur
 * n'a pas activé le contexte dans la Console.
 */
export function useProprieteChatProviders(proprieteId?: string): {
  providers: ContextProvider[];
  providersTitle: string;
} {
  const focus = useProprieteChatFocus();
  const { species, waypoints } = usePropertySpeciesPool(proprieteId);
  const { state: soil } = usePropertySoil(proprieteId, { readOnly: true });
  const { objets } = useProprieteObjets(proprieteId);
  const { zones } = useProprieteZones(proprieteId);
  const { data: parcelles } = useProprieteParcelles(proprieteId);
  const { state: synthesis } = usePropertySynthesis(proprieteId);
  const { state: observation } = usePropertyObservation(proprieteId);
  const flora = usePropertyFloraMatched(proprieteId);
  const { intention } = usePropertyIntention(proprieteId);

  const focusObjet = useMemo(
    () => (focus.objetId ? (objets ?? []).find((o) => o.id === focus.objetId) ?? null : null),
    [objets, focus.objetId],
  );

  const focusCenter = useMemo(
    () => (focusObjet ? geometryCenter(focusObjet.geometry) : null),
    [focusObjet],
  );

  /**
   * Périmètre réel de l'ouvrage : dedans (dans le tracé) / lisière / voisinage
   * (rayon d'écoute mesuré depuis le BORD, jamais depuis le centroïde).
   */
  const scope = useMemo(
    () =>
      focusObjet
        ? classifyObservations(focusObjet.geometry, waypoints ?? [], focus.radiusM)
        : null,
    [focusObjet, waypoints, focus.radiusM],
  );

  /** Observations retenues : propriété entière, ou périmètre de l'ouvrage cadré. */
  const scopedWaypoints = useMemo(() => {
    if (!scope) return waypoints ?? [];
    return [...scope.dedans, ...scope.lisiere, ...scope.voisinage].map((s) => s.item);
  }, [waypoints, scope]);

  return useMemo(() => {
    const list: ContextProvider[] = [];
    const scopeLabel = focusObjet
      ? `${focusObjet.nom || 'ouvrage'} · tracé + ${focus.radiusM} m`
      : 'propriété entière';

    /* ── Vivant ─────────────────────────────────────────────────────────── */
    const byKingdom = new Map<string, number>();
    for (const w of scopedWaypoints) {
      const k = w.kingdom || 'inconnu';
      byKingdom.set(k, (byKingdom.get(k) ?? 0) + 1);
    }
    /**
     * Nommage : le champ `c` transmis au modèle doit être le nom vernaculaire
     * FRANÇAIS déjà résolu par le pool (résolveur central), jamais le
     * `commonName` brut de l'observation (souvent anglais ou vide).
     */
    const frBySci = new Map<string, string>();
    for (const sp of species ?? []) {
      const sci = (sp.scientificName || '').trim();
      const fr = (sp.commonName || '').trim();
      if (sci && fr && fr.toLowerCase() !== sci.toLowerCase()) frBySci.set(sci, fr);
    }
    const withFr = <T extends { n: string; c: string | null }>(rows: T[]): T[] =>
      rows.map((r) => ({ ...r, c: frBySci.get(r.n) ?? r.c ?? null }));

    const speciesRows = withFr(rollupSpecies(scopedWaypoints as any));
    const dedansRows = scope ? withFr(rollupSpecies(scope.dedans.map((s) => s.item) as any)) : [];
    const lisiereRows = scope ? withFr(rollupSpecies(scope.lisiere.map((s) => s.item) as any)) : [];
    const voisinageRows = scope ? withFr(rollupSpecies(scope.voisinage.map((s) => s.item) as any)) : [];

    if (speciesRows.length > 0) {
      list.push(
        provider({
          id: 'vivant.resume',
          group: 'Vivant',
          emoji: '🌿',
          label: 'Résumé du vivant',
          hint: scope
            ? `${dedansRows.length} dans le tracé · ${voisinageRows.length} en voisinage`
            : `${speciesRows.length} espèces · ${scopeLabel}`,
          recommended: true,
          payload: scope
            ? {
                portee: scopeLabel,
                dansLOuvrage: {
                  especes: dedansRows.length,
                  observations: scope.dedans.length,
                  liste: dedansRows.map((s) => ({ n: s.n, c: s.c, obs: s.obs })),
                },
                lisiere: { especes: lisiereRows.length },
                voisinage: {
                  especes: voisinageRows.length,
                  observations: scope.voisinage.length,
                  top: voisinageRows.slice(0, 12).map((s) => ({ n: s.n, c: s.c, obs: s.obs })),
                },
                parRegne: Object.fromEntries(byKingdom),
              }
            : {
                portee: scopeLabel,
                especes: speciesRows.length,
                observations: scopedWaypoints.length,
                parRegne: Object.fromEntries(byKingdom),
                top: speciesRows.slice(0, 15).map((s) => ({ n: s.n, c: s.c, obs: s.obs })),
              },
        }),
      );

      list.push(
        provider({
          id: 'vivant.liste',
          group: 'Vivant',
          emoji: '📋',
          label: 'Liste complète des espèces',
          hint: `${Math.min(speciesRows.length, 200)} lignes détaillées`,
          payload: {
            portee: scopeLabel,
            tronque: speciesRows.length > 200,
            especes: speciesRows.slice(0, 200).map((s) => ({ n: s.n, c: s.c, k: s.k, obs: s.obs, vu: s.vu })),
          },
        }),
      );
    }


    /* ── Sol ────────────────────────────────────────────────────────────── */
    const placed = placedSamples(soil?.samples ?? []);
    if (placed.length > 0) {
      const merged = mergeSamples(placed);
      list.push(
        provider({
          id: 'sol.synthese',
          group: 'Sol',
          emoji: '🪨',
          label: 'Lecture du sol',
          hint: merged.sentence,
          recommended: true,
          payload: {
            phrase: merged.sentence,
            structure: merged.soilLite.structure,
            texture: merged.soilLite.texture,
            phMoyen: round(merged.soilLite.ph ?? null),
            amplitudePh: round(merged.phSpread),
            vie: merged.soilLite.life_signs,
            prelevements: placed.length,
          },
        }),
      );

      list.push(
        provider({
          id: 'sol.carottes',
          group: 'Sol',
          emoji: '🧪',
          label: 'Détail des prélèvements',
          hint: `${placed.length} carottes géolocalisées`,
          payload: {
            carottes: placed.map((s) => ({
              id: s.label,
              lieu: s.location ?? null,
              structure: s.structure_result ?? null,
              texture: s.texture_result ?? null,
              boudin: s.boudin_form ?? null,
              ph: s.ph_value ?? null,
              vie: s.life_signs ?? [],
              vers: s.worm_count ?? null,
            })),
          },
        }),
      );
    }

    /* ── Ouvrages ───────────────────────────────────────────────────────── */
    if (focusObjet) {
      const dossier = buildOuvrageSoilDossier({
        objet: focusObjet,
        samples: soil?.samples ?? [],
      });
      list.push(
        provider({
          id: 'ouvrage.focus',
          group: 'Ouvrages',
          emoji: '🏗️',
          label: `Ouvrage : ${dossier.ouvrage.nom || dossier.ouvrage.typeLabel}`,
          hint: 'Dossier complet (mesures, sol relié, contraintes)',
          recommended: true,
          payload: {
            ...dossier,
            especesRetenuesPalette: dossier.especesRetenues,
            noteEspeces:
              "« especesRetenuesPalette » = palette de plantation choisie par le propriétaire (vide = aucun choix saisi). Ne JAMAIS la confondre avec les espèces observées sur le terrain : celles-ci sont dans le contexte 🌱 « Espèces dans l'ouvrage ».",
          },
        }),
      );

      // Le cœur de la question : ce qui pousse et vit DANS le tracé.
      list.push(
        provider({
          id: 'ouvrage.especes',
          group: 'Ouvrages',
          emoji: '🌱',
          label: "Espèces dans l'ouvrage",
          hint: `${dedansRows.length} dans le tracé · ${lisiereRows.length} en lisière · ${voisinageRows.length} autour`,
          recommended: true,
          payload: {
            ouvrage: focusObjet.nom || dossier.ouvrage.typeLabel,
            surfaceM2: round(measureFor('m2', focusObjet.geometry)),
            rayonEcouteM: focus.radiusM,
            methode:
              "Appartenance géométrique au tracé (ray casting) ; le rayon d'écoute est mesuré depuis le BORD de l'ouvrage, pas depuis son centre.",
            // Liste JAMAIS tronquée : c'est la donnée que l'IA doit pouvoir énumérer.
            dedans: dedansRows.map((s) => ({ n: s.n, c: s.c, k: s.k, obs: s.obs, vu: s.vu })),
            lisiere: lisiereRows.map((s) => ({ n: s.n, c: s.c, obs: s.obs })),
            voisinage: {
              especes: voisinageRows.length,
              observations: scope?.voisinage.length ?? 0,
              top: voisinageRows.slice(0, 15).map((s) => ({ n: s.n, c: s.c, obs: s.obs })),
            },
          },
        }),
      );
    }


    /**
     * Sélection à la carte : 1, plusieurs, tous ou aucun ouvrage, avec un
     * niveau de détail commutable. Aucun ouvrage retenu → aucun contexte
     * ouvrage transmis (frugalité stricte).
     */
    const allObjets = objets ?? [];
    const selected = allObjets.filter((o) => focus.selectedObjetIds.includes(o.id));
    if (selected.length > 0) {
      const detail = focus.ouvrageDetail;
      const detailLabel =
        detail === 'resume' ? 'résumé' : detail === 'complet' ? 'dossier complet' : 'complet + espèces';

      const rows = selected.map((o) => {
        const dossier = buildOuvrageSoilDossier({ objet: o, samples: soil?.samples ?? [] });
        if (detail === 'resume') {
          return {
            nom: o.nom || dossier.ouvrage.typeLabel,
            type: dossier.ouvrage.typeLabel,
            mesure: dossier.ouvrage.mesure,
            surfaceM2: round(measureFor('m2', o.geometry)),
            intention: dossier.ouvrage.intention,
          };
        }
        const base = {
          ...dossier,
          especesRetenuesPalette: dossier.especesRetenues,
        };
        if (detail === 'complet') return base;

        const sc = classifyObservations(o.geometry, waypoints ?? [], focus.radiusM);
        return {
          ...base,
          rayonEcouteM: focus.radiusM,
          especesObservees: {
            dedans: withFr(rollupSpecies(sc.dedans.map((s) => s.item) as any)).map((s) => ({
              n: s.n,
              c: s.c,
              obs: s.obs,
            })),
            lisiere: withFr(rollupSpecies(sc.lisiere.map((s) => s.item) as any)).map((s) => ({
              n: s.n,
              c: s.c,
              obs: s.obs,
            })),
          },
        };
      });

      list.push(
        provider({
          id: 'ouvrages.selection',
          group: 'Ouvrages',
          emoji: '🧭',
          label:
            selected.length === allObjets.length
              ? `Tous les ouvrages de l’atelier (${selected.length})`
              : `${selected.length} ouvrage${selected.length > 1 ? 's' : ''} retenu${selected.length > 1 ? 's' : ''}`,
          hint: `${selected.map((o) => o.nom || o.outil_key).slice(0, 3).join(', ')}${
            selected.length > 3 ? '…' : ''
          } · ${detailLabel}`,
          payload: {
            niveauDetail: detailLabel,
            selection: `${selected.length}/${allObjets.length} ouvrages de l'atelier`,
            noteSelection:
              "Seuls les ouvrages listés ici ont été retenus par l'utilisateur : ne pas extrapoler aux autres emplacements du jardin.",
            ouvrages: rows,
          },
        }),
      );
    }


    /* ── Portrait du site ───────────────────────────────────────────────── */
    const surfaceCadastre = (parcelles ?? []).reduce(
      (sum, p: any) => sum + (geometryAreaM2(p.geometry) || 0),
      0,
    );
    const hasPortrait =
      surfaceCadastre > 0 ||
      (zones ?? []).length > 0 ||
      !!synthesis?.exposure ||
      (synthesis?.atouts?.length ?? 0) > 0;

    if (hasPortrait) {
      list.push(
        provider({
          id: 'site.portrait',
          group: 'Site',
          emoji: '🗺️',
          label: 'Portrait du site',
          hint: 'Surface, zones, exposition, atouts et contraintes',
          recommended: true,
          payload: {
            surfaceCadastraleM2: Math.round(surfaceCadastre),
            zones: (zones ?? []).map((z: any) => ({ nom: z.nom, type: z.type ?? null })),
            exposition: synthesis?.exposure ?? null,
            vent: synthesis?.wind_level ?? null,
            humidite: synthesis?.humidity ?? null,
            atouts: (synthesis?.atouts ?? []).map((i) => i.text),
            contraintes: (synthesis?.contraintes ?? []).map((i) => i.text),
            vigilances: (synthesis?.vigilances ?? []).map((i) => i.text),
          },
        }),
      );
    }

    /* ── J'observe ──────────────────────────────────────────────────────── */
    const answers = observation?.answers ?? {};
    if (Object.keys(answers).length > 0 || (observation?.notes ?? '').trim()) {
      list.push(
        provider({
          id: 'observe.carnet',
          group: 'Site',
          emoji: '👁️',
          label: 'Carnet « J’observe »',
          hint: 'Réponses du diagnostic étape 1',
          payload: {
            reponses: answers,
            sensoriel: observation?.sensorial ?? {},
            notes: observation?.notes ?? null,
          },
        }),
      );
    }

    /* ── J'identifie ────────────────────────────────────────────────────── */
    const revealed = (flora?.matches ?? []).filter((m: any) => m.confidence !== 'none');
    if (revealed.length > 0) {
      list.push(
        provider({
          id: 'identifie.cortege',
          group: 'Flore',
          emoji: '🌾',
          label: 'Cortège bio-indicateur',
          hint: `${revealed.length} plantes indicatrices révélées`,
          payload: {
            plantes: revealed.slice(0, 60).map((m: any) => ({
              n: m.plant?.latin ?? m.plant?.nom,
              c: m.plant?.nom ?? null,
              obs: m.observations,
              fiabilite: m.confidence,
            })),
            stats: flora?.stats ?? null,
          },
        }),
      );
    }

    // Intention du jardinier : priorités déclarées et, le cas échéant, le
    // problème décrit en toutes lettres (texte libre repris mot pour mot).
    if (intention?.hasOnboarding) {
      const a = intention.answers ?? {};
      const probleme = typeof a.priorite_probleme === 'string' ? a.priorite_probleme.trim() : '';
      list.push(
        provider({
          id: 'site.intention',
          label: probleme ? 'Intention · problème à résoudre' : 'Intention du jardinier',
          hint: probleme
            ? 'Priorité déclarée et problème décrit par le jardinier'
            : 'Réponses du parcours d’accueil (priorités, objectif, portrait)',
          payload: {
            persona: intention.personaLabel ?? intention.persona ?? null,
            portrait: intention.portrait ?? null,
            priorite: a.priorite ?? null,
            probleme_declare: probleme || null,
            objectif_6_mois: a.objectif_6_mois ?? null,
            temps_disponible: a.temps ?? null,
            gestes: (intention.gestures ?? []).map((g) => g.title),
          },
        }),
      );
    }

    return {
      providers: list,
      providersTitle: focusObjet
        ? `Contextes · ${focusObjet.nom || 'ouvrage'} (${focus.radiusM} m)`
        : 'Contextes de la propriété',
    };
  }, [
    scope,
    scopedWaypoints,
    species,
    waypoints,
    soil,
    objets,
    zones,
    parcelles,
    synthesis,
    observation,
    flora,
    focusObjet,
    focus.radiusM,
    focus.selectedObjetIds,
    focus.ouvrageDetail,
    intention,
  ]);
}
