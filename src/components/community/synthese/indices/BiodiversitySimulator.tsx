import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RotateCcw, Zap, TreePine, Wheat, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { computeIndices, type SpeciesAbundance } from '@/utils/biodiversityIndices';
import { SpeciesName } from '@/components/species/SpeciesName';

interface Props {
  /** Real abundance from the territory, used as the initial dataset. */
  initialAbundance: SpeciesAbundance[];
}

interface SimSpecies {
  id: string;
  scientificName: string;
  commonName: string;
  n: number;
}

const SLIDER_MAX = 200;

const SCENARIOS: Record<string, (base: SimSpecies[]) => SimSpecies[]> = {
  reset: (base) => base.map((sp) => ({ ...sp })),
  monoculture: (base) => base.map((sp, i) => ({ ...sp, n: i === 0 ? 180 : 1 })),
  equilibre: (base) => base.map((sp) => ({ ...sp, n: 30 })),
  foretMature: (base) => base.map((sp, i) => ({ ...sp, n: Math.max(5, 60 - i * 8) })),
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

export const BiodiversitySimulator: React.FC<Props> = ({ initialAbundance }) => {
  const seed = useMemo<SimSpecies[]>(() => {
    const top = initialAbundance.slice(0, 5);
    if (!top.length) {
      return ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({
        id: `demo-${l}`,
        scientificName: `Species ${l}`,
        commonName: `Espèce ${l}`,
        n: i === 0 ? 90 : 3,
      }));
    }
    return top.map((sp, i) => ({
      id: `${sp.scientificName}-${i}`,
      scientificName: sp.scientificName,
      commonName: sp.commonName,
      n: sp.n,
    }));
  }, [initialAbundance]);

  const [species, setSpecies] = useState<SimSpecies[]>(seed);

  useEffect(() => {
    setSpecies(seed);
  }, [seed]);

  const indices = useMemo(
    () =>
      computeIndices(
        species.map((sp) => ({
          scientificName: sp.scientificName,
          commonName: sp.commonName,
          kingdom: 'Other',
          n: sp.n,
        })),
      ),
    [species],
  );

  const updateN = (id: string, n: number) => {
    setSpecies((prev) => prev.map((sp) => (sp.id === id ? { ...sp, n: Math.max(0, Math.min(SLIDER_MAX, n)) } : sp)));
  };

  const applyScenario = (key: keyof typeof SCENARIOS) => {
    setSpecies(SCENARIOS[key](seed));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Simulateur de biodiversité</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">Pré-rempli avec votre territoire</span>
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
            onClick={() => setSpecies((prev) => prev.map((sp, i) => ({ ...sp, n: i === 0 ? 180 : 1 })))}
          >
            <Zap className="w-3.5 h-3.5 mr-1" /> Écraser sous une dominante
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        {species.map((sp) => (
          <div key={sp.id} className="grid grid-cols-[1fr_auto_64px] gap-3 items-center">
            <div className="min-w-0">
              <SpeciesName scientificName={sp.scientificName} commonName={sp.commonName} size="sm" truncate />
            </div>
            <Slider
              value={[sp.n]}
              max={SLIDER_MAX}
              step={1}
              onValueChange={(v) => updateN(sp.id, v[0])}
              className="w-40 sm:w-64"
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
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
        Tirez les curseurs pour observer l'effet d'une espèce ultra-dominante sur les trois
        indicateurs. Plus la distribution est régulière, plus Shannon et Piélou grimpent ; plus une
        espèce écrase les autres, plus Simpson (D) s'envole.
      </p>
    </div>
  );
};

export default BiodiversitySimulator;
