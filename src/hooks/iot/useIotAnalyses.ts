import React from 'react';
import { useAllCapteursGeo, useMesuresWindow } from './useIotTelemetry';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { soilLiteFromState } from '@/lib/soilLiteFromState';
import { buildSiteProfile, scoreSpecies, topByUsage, AXIS_LABEL, type SiteProfile } from '@/lib/paletteEngine';
import { PALETTE_KB, type PaletteUsage } from '@/lib/plantPaletteKb';
import { buildClimateProfile, referenceTemperature } from '@/lib/iot/climateProfile';
import { capteurEtat, etatMeta, sensorProfile, type CapteurEtat } from '@/lib/iot/grandeurs';
import {
  analyseSensor,
  measuredExposure,
  measuredHumidity,
  type ClimateSummary,
  type Mesure,
  type SensorAnalysis,
} from '@/lib/iot/analyses';

export const WINDOWS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
] as const;

export interface ExcludedSensor {
  id: string;
  nom: string;
  etat: CapteurEtat;
  label: string;
  motif: string | null;
  depuis: string | null;
}

/**
 * Analyses des sondes en service du périmètre courant sur une fenêtre glissante.
 * Une seule requête de mesures, tous les calculs en mémoire. Les sondes déclarées
 * en maintenance ou retirées sont écartées — et nommées, jamais escamotées.
 */
export function useIotAnalyses(windowDays: number) {
  const { data: all = [], isLoading: loadingC } = useAllCapteursGeo();

  const capteurs = React.useMemo(() => all.filter((c) => capteurEtat(c as any) === 'service'), [all]);
  const excluded = React.useMemo<ExcludedSensor[]>(
    () =>
      all
        .filter((c) => capteurEtat(c as any) !== 'service')
        .map((c) => {
          const etat = capteurEtat(c as any);
          return {
            id: c.id,
            nom: c.nom,
            etat,
            label: etatMeta(etat).label,
            motif: (c as any).etat_motif ?? null,
            depuis: (c as any).etat_depuis ?? null,
          };
        }),
    [all],
  );

  const ids = React.useMemo(() => capteurs.map((c) => c.id), [capteurs]);
  const { data: win, isLoading: loadingM, isFetching: fetchingM, error: errorM } = useMesuresWindow(ids, windowDays);
  const mesures = win?.rows ?? [];
  const spans = win?.spans ?? {};


  const byCapteur = React.useMemo(() => {
    const map = new Map<string, SensorAnalysis>();
    capteurs.forEach((c) => {
      map.set(c.id, analyseSensor(c.id, mesures as Mesure[], windowDays, sensorProfile((c as any).type)));
    });
    return map;
  }, [capteurs, mesures, windowDays]);

  /** Climat de référence par propriété, issu des stations météo du périmètre. */
  const climateByPropriete = React.useMemo(() => {
    const map = new Map<string, { nom: string; climate: ClimateSummary }>();
    capteurs.forEach((c) => {
      const a = byCapteur.get(c.id);
      if (a?.climate && c.propriete_id) map.set(c.propriete_id, { nom: c.nom, climate: a.climate });
    });
    return map;
  }, [capteurs, byCapteur]);

  return {
    capteurs,
    excluded,
    byCapteur,
    climateByPropriete,
    spans,
    truncated: win?.truncated ?? false,
    isLoading: loadingC || loadingM,
    /** Vrai tant qu'une lecture est en cours, y compris un rafraîchissement. */
    isFetching: fetchingM,
    /** Erreur de lecture des mesures : à distinguer d'une absence de données. */
    error: (errorM as Error | null) ?? null,
    /** Vrai seulement quand la lecture est terminée et n'a rien ramené. */
    isEmpty: !loadingC && !loadingM && !fetchingM && !errorM && mesures.length === 0,
    mesureCount: mesures.length,

  };
}



export interface PaletteFitRow {
  id: string;
  fr: string;
  latin: string;
  strate: string;
  score: number;
  worstAxis: string;
  worstLabel: string;
  reason: string;
  service: string;
  vegetalLocal: boolean;
}

export interface UsageRow extends PaletteFitRow {
  /** Note ajustée (fenêtre thermique prise en compte pour le potager). */
  fit: number;
  /** Justification affichée sous le nom. */
  why: string;
}

export interface PaletteFit {
  profile: SiteProfile;
  rows: PaletteFitRow[];
  /** Triptyque : nourriciers ligneux, légumes, ornementaux. */
  groups: Record<PaletteUsage, UsageRow[]>;
  /** Ce qui vient de la sonde, ce qui vient du registre de sol. */
  basis: string[];
  missing: string[];
  /** Vrai quand le profil vient d'une station météo (lecture indirecte). */
  fromClimate: boolean;
  /** Température de référence utilisée pour la fenêtre potagère. */
  referenceTempC: number | null;
}

const toRow = (s: ReturnType<typeof scoreSpecies>): PaletteFitRow => ({
  id: s.species.id,
  fr: s.species.fr,
  latin: s.species.latin,
  strate: s.species.strate,
  score: s.score,
  worstAxis: s.worstAxis,
  worstLabel: AXIS_LABEL[s.worstAxis],
  reason: s.species.reason,
  service: s.species.service,
  vegetalLocal: s.species.vegetalLocal,
});

/**
 * Concordance entre le micro-climat mesuré autour d'une sonde et la palette
 * végétale : profil de site reconstruit depuis les mesures + le registre de sol
 * de la propriété (lecture seule), puis scoring du référentiel existant.
 *
 * Les stations météo, qui ne voient pas le sol, passent par un profil climat
 * explicitement annoncé comme indirect — elles proposent quand même leur
 * triptyque, à confirmer par une sonde de sol.
 */
export function usePaletteFit(
  proprieteId: string | undefined,
  analysis: SensorAnalysis | null,
): PaletteFit | null {
  const { state: soilState } = usePropertySoil(proprieteId, { readOnly: true });

  return React.useMemo(() => {
    if (!analysis) return null;
    const soil = soilLiteFromState(soilState);
    const isWeather = !!analysis.profile.isWeather;

    let profile: SiteProfile;
    const basis: string[] = [];
    const missing: string[] = [];

    if (isWeather) {
      const c = buildClimateProfile(analysis.climate, soil, analysis);
      profile = c.profile;
      basis.push(...c.basis);
      missing.push(...c.missing);
    } else {
      const humidity = measuredHumidity(analysis);
      const exposure = measuredExposure(analysis);
      if (humidity) basis.push(`humidité du sol mesurée (${humidity})`);
      else missing.push('humidité du sol non transmise par cette sonde');
      if (exposure) basis.push(`exposition déduite de la luminosité mesurée (${exposure.replace('_', '-')})`);
      else missing.push('luminosité non transmise : exposition inconnue');
      if (soil.texture) basis.push('texture du registre de sol');
      else missing.push('texture du sol non renseignée dans le registre');
      if (soil.ph != null) basis.push(`pH ${Number(soil.ph).toFixed(1)} du registre de sol`);
      else missing.push('pH non renseigné dans le registre');

      profile = buildSiteProfile({
        soil,
        exposure: exposure === 'soleil' ? 'soleil' : exposure === 'ombre' ? 'ombre' : exposure ? 'mi_ombre' : null,
        humidity,
      });
    }

    const rows = PALETTE_KB.filter((sp) => !sp.caution)
      .map((sp) => scoreSpecies(profile, sp))
      .sort((a, b) => b.score - a.score)
      .map(toRow);

    const refTemp = referenceTemperature(analysis);
    const pick = (usage: PaletteUsage): UsageRow[] =>
      topByUsage(profile, usage, 5, { soilTempC: refTemp }).map((s) => ({
        ...toRow(s),
        fit: s.fit,
        why: s.why,
      }));

    return {
      profile,
      rows,
      groups: {
        nourricier: pick('nourricier'),
        potager: pick('potager'),
        ornemental: pick('ornemental'),
      },
      basis,
      missing,
      fromClimate: isWeather,
      referenceTempC: refTemp,
    };
  }, [analysis, soilState]);
}

