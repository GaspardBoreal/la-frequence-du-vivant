import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RotateCcw, Zap, TreePine, Wheat, Sparkles, MapPin } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { computeIndices, type SpeciesAbundance, type RawSpecies } from '@/utils/biodiversityIndices';
import { SpeciesName } from '@/components/species/SpeciesName';
import { getLatLng, type AttributionLike } from '@/utils/speciesIndividualCount';
import SpeciesGpsDrawer from './SpeciesGpsDrawer';

interface Props {
  initialAbundance: SpeciesAbundance[];
  species?: RawSpecies[];
}

interface SimSpecies {
  id: string;
  scientificName: string;
  commonName: string;
  n: number;
  attributions: AttributionLike[];
  photos: string[];
}

const SLIDER_MAX = 200;
const TOP_N = 10;

const SCENARIOS: Record<string, (base: SimSpecies[]) => SimSpecies[]> = {
  reset: (base) => base.map((sp) => ({ ...sp })),
  monoculture: (base) => base.map((sp, i) => ({ ...sp, n: i === 0 ? 180 : 1 })),
  equilibre: (base) => base.map((sp) => ({ ...sp, n: 30 })),
  foretMature: (base) => base.map((sp, i) => ({ ...sp, n: Math.max(3, 80 - i * 7) })),
};

const KpiCard: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`text-lg font-bold tabular-nums ${tone || 'text-foreground'}`}>{value}</p>
  </div>
);

const HBar: React.FC<{ label: string; value: number; max?: number; tone: string }> = ({ label, value, max = 1, tone }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${tone}`}
        />
      </div>
    </div>
  );
};

export const BiodiversitySimulator: React.FC<Props> = ({ initialAbundance, species = [] }) => {
  const seed = useMemo<SimSpecies[]>(() => {
    const top = initialAbundance.slice(0, TOP_N);
    const byName = new Map<string, RawSpecies>();
    species.forEach((sp) => {
      if (sp.scientificName) byName.set(sp.scientificName, sp);
    });
    if (!top.length) {
      return Array.from({ length: TOP_N }).map((_, i) => ({
        id: `demo-${i}`,
        scientificName: `Species ${i + 1}`,
        commonName: `Espèce ${i + 1}`,
        n: i === 0 ? 90 : 3,
        attributions: [],
        photos: [],
      }));
    }
    return top.map((sp, i) => {
      const raw = byName.get(sp.scientificName);
      return {
        id: `${sp.scientificName}-${i}`,
        scientificName: sp.scientificName,
        commonName: sp.commonName,
        n: sp.n,
        attributions: (raw?.attributions || []) as AttributionLike[],
        photos: (raw?.photos || []).filter(Boolean),
      };
    });
  }, [initialAbundance, species]);

  const [simSpecies, setSimSpecies] = useState<SimSpecies[]>(seed);
  const [drawerSp, setDrawerSp] = useState<SimSpecies | null>(null);

  useEffect(() => {
    setSimSpecies(seed);
  }, [seed]);

  const indices = useMemo(
    () =>
      computeIndices(
        simSpecies.map((sp) => ({
          scientificName: sp.scientificName,
          commonName: sp.commonName,
          kingdom: 'Other',
          n: sp.n,
        })),
      ),
    [simSpecies],
  );

  const updateN = (id: string, n: number) => {
    setSimSpecies((prev) => prev.map((sp) => (sp.id === id ? { ...sp, n: Math.max(0, Math.min(SLIDER_MAX, n)) } : sp)));
  };

  const applyScenario = (key: keyof typeof SCENARIOS) => {
    setSimSpecies(SCENARIOS[key](seed));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Simulateur de biodiversité</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">Top 10 — pré-rempli avec votre territoire</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <KpiCard label="Total individus" value={String(indices.N)} />
          <KpiCard label="Shannon (H')" value={indices.H.toFixed(2)} tone="text-emerald-500" />
          <KpiCard label="Simpson (1−D)" value={indices.simpsonDiversity.toFixed(2)} tone="text-amber-500" />
          <KpiCard label="Piélou (J')" value={indices.J.toFixed(2)} tone="text-violet-500" />
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-4 space-y-2.5">
          <HBar label="Shannon (H')" value={indices.H} max={Math.max(indices.Hmax, 3)} tone="bg-emerald-500" />
          <HBar label="Simpson (1−D)" value={indices.simpsonDiversity} tone="bg-amber-500" />
          <HBar label="Piélou (J')" value={indices.J} tone="bg-violet-500" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => applyScenario('reset')}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Données réelles
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyScenario('monoculture')}>
            <Wheat className="w-3.5 h-3.5 mr-1" /> Monoculture
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyScenario('equilibre')}>
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Équilibré
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyScenario('foretMature')}>
            <TreePine className="w-3.5 h-3.5 mr-1" /> Forêt mature
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-amber-500"
            onClick={() => setSimSpecies((prev) => prev.map((sp, i) => ({ ...sp, n: i === 0 ? 180 : 1 })))}
          >
            <Zap className="w-3.5 h-3.5 mr-1" /> Écraser sous une dominante
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 space-y-2 max-h-[640px] overflow-y-auto">
        {simSpecies.map((sp) => {
          const hasGps = sp.attributions.some((a) => getLatLng(a) !== null);
          return (
            <div
              key={sp.id}
              className="grid grid-cols-[1fr_auto_64px] gap-3 items-center rounded-xl px-2 py-1.5 hover:bg-muted/40 transition"
            >
              <button
                type="button"
                onClick={() => setDrawerSp(sp)}
                className="min-w-0 text-left flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md py-0.5"
                title="Voir la carte GPS et les photos"
              >
                <span className="min-w-0 flex-1 truncate">
                  <SpeciesName scientificName={sp.scientificName} commonName={sp.commonName} size="sm" truncate />
                </span>
                <MapPin
                  className={`w-3.5 h-3.5 shrink-0 transition ${hasGps ? 'text-emerald-500 group-hover:scale-110' : 'text-muted-foreground/50'}`}
                />
              </button>
              <Slider
                value={[sp.n]}
                max={SLIDER_MAX}
                step={1}
                onValueChange={(v) => updateN(sp.id, v[0])}
                className="w-32 sm:w-56"
              />
              <Input
                type="number"
                min={0}
                max={SLIDER_MAX}
                value={sp.n}
                onChange={(e) => updateN(sp.id, Number(e.target.value) || 0)}
                className="h-8 text-center font-mono tabular-nums"
              />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
        Cliquez sur une espèce pour explorer sa <strong className="text-emerald-500">carte GPS iNaturalist</strong>,
        ses photos et la chronologie de ses observations. Tirez les curseurs pour observer l'effet d'une espèce
        ultra-dominante sur les trois indicateurs.
      </p>

      {drawerSp && (
        <SpeciesGpsDrawer
          open={!!drawerSp}
          onOpenChange={(o) => !o && setDrawerSp(null)}
          scientificName={drawerSp.scientificName}
          commonName={drawerSp.commonName}
          attributions={drawerSp.attributions}
          photos={drawerSp.photos}
        />
      )}
    </div>
  );
};

export default BiodiversitySimulator;
