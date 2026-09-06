import React, { createContext, useContext, useMemo } from 'react';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { usePropertySoil, type SoilSample } from '@/hooks/propriete/usePropertySoil';
import { useProprieteZones, type ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import { useProprieteObjets, type ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { useIotCapteurs, type IotCapteur } from '@/hooks/iot/useIot';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { normRef, type TourRef } from './types';

export interface TourRefIndex {
  proprieteId?: string;
  species: BiodiversitySpecies[];
  samples: SoilSample[];
  zones: ProprieteZone[];
  objets: ProprieteObjet[];
  capteurs: IotCapteur[];
  /** Libellés reconnus (déjà normalisés) → référence. Le plus long d'abord. */
  terms: { term: string; ref: TourRef }[];
  speciesByLatin: Map<string, BiodiversitySpecies>;
  sampleByLabel: Map<string, SoilSample>;
}

const EMPTY_INDEX: TourRefIndex = {
  species: [],
  samples: [],
  zones: [],
  objets: [],
  capteurs: [],
  terms: [],
  speciesByLatin: new Map(),
  sampleByLabel: new Map(),
};

const Ctx = createContext<TourRefIndex>(EMPTY_INDEX);

/** Agrège en une fois les ressources réelles du lieu citables dans un tour. */
export function useBuildTourRefIndex(proprieteId?: string): TourRefIndex {
  const { species } = usePropertySpeciesPool(proprieteId);
  const { state: soil } = usePropertySoil(proprieteId, { readOnly: true });
  const { zones } = useProprieteZones(proprieteId);
  const { objets } = useProprieteObjets(proprieteId);
  const { data: capteurs } = useIotCapteurs(proprieteId);

  const samples = soil?.samples ?? [];
  const zoneList = zones ?? [];
  const objetList = objets ?? [];
  const capteurList = capteurs ?? [];

  return useMemo<TourRefIndex>(() => {
    const speciesByLatin = new Map<string, BiodiversitySpecies>();
    const sampleByLabel = new Map<string, SoilSample>();
    const terms: { term: string; ref: TourRef }[] = [];
    const push = (label: string | null | undefined, ref: TourRef) => {
      const t = normRef(label || '');
      if (t.length < 4) return;
      terms.push({ term: t, ref });
    };

    for (const sp of species || []) {
      if (sp.scientificName) speciesByLatin.set(normRef(sp.scientificName), sp);
      const ref: TourRef = { kind: 'species', latin: sp.scientificName, label: sp.commonName || sp.scientificName };
      push(sp.scientificName, ref);
      if (sp.commonName && normRef(sp.commonName) !== normRef(sp.scientificName)) push(sp.commonName, ref);
    }
    for (const s of samples) {
      if (s.label) sampleByLabel.set(normRef(s.label), s);
    }
    for (const z of zoneList) push(z.nom, { kind: 'zone', id: z.id, label: z.nom });
    for (const o of objetList) if (o.nom) push(o.nom, { kind: 'objet', id: o.id, label: o.nom });
    for (const c of capteurList) push(c.nom, { kind: 'capteur', id: c.id, label: c.nom });

    terms.sort((a, b) => b.term.length - a.term.length);

    return {
      proprieteId,
      species: species || [],
      samples,
      zones: zoneList,
      objets: objetList,
      capteurs: capteurList,
      terms,
      speciesByLatin,
      sampleByLabel,
    };
  }, [proprieteId, species, samples, zoneList, objetList, capteurList]);
}

export const TourRefProvider: React.FC<{ value: TourRefIndex; children: React.ReactNode }> = ({
  value,
  children,
}) => React.createElement(Ctx.Provider, { value }, children);

export const useTourRefIndex = (): TourRefIndex => useContext(Ctx);
