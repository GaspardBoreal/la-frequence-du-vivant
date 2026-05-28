import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bug, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useExplorationSpeciesCount } from '@/hooks/useExplorationSpeciesCount';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import { SpeciesName } from '@/components/species/SpeciesName';
import PackVivantButton from '@/components/community/PackVivantButton';

interface Props {
  explorationId: string;
  /** Short narrative under the title, e.g. event type description. */
  description?: string;
  /** Optional override of the bio-indicator scientific name (admin curation). */
  bioIndicatorOverride?: string | null;
}

const COLORS = {
  flore: '#4ade80',   // green-400
  faune: '#facc15',   // yellow-400
  autres: '#94a3b8',  // slate-400
};

/**
 * « Preuve par la data » card — restitution éditoriale des chiffres
 * d'une marche, alimentée 100 % par la RPC unifiée
 * `get_exploration_species_count` (source unique de vérité).
 */
const PreuveParLaDataCard: React.FC<Props> = ({
  explorationId,
  description,
  bioIndicatorOverride,
}) => {
  const { data, isLoading } = useExplorationSpeciesCount(explorationId, { realtime: true });
  const { data: marcheurs } = useExplorationMarcheurs(explorationId);

  const ambassadeursCount = useMemo(
    () => (marcheurs || []).filter(m => (m.observationsCount || 0) > 0).length,
    [marcheurs],
  );

  const donutData = useMemo(() => {
    if (!data) return [];
    const bk = data.by_kingdom;
    const autres = (bk.fungi || 0) + (bk.others || 0);
    return [
      { name: 'Flore (Plantae)', value: bk.plantae || 0, color: COLORS.flore },
      { name: 'Faune (Animalia)', value: bk.animalia || 0, color: COLORS.faune },
      ...(autres > 0 ? [{ name: 'Autres règnes', value: autres, color: COLORS.autres }] : []),
    ].filter(d => d.value > 0);
  }, [data]);

  // Heuristique : lichen (Fungi) en priorité, sinon premier coléoptère/Animalia connu.
  const bioIndicator = useMemo(() => {
    if (bioIndicatorOverride) return bioIndicatorOverride;
    const species = data?.species || [];
    const fungi = species.find(s => s.kingdom === 'Fungi');
    if (fungi) return fungi.sci;
    const carabus = species.find(s => /carabus/i.test(s.sci));
    if (carabus) return carabus.sci;
    return species.find(s => s.kingdom === 'Animalia')?.sci || null;
  }, [data, bioIndicatorOverride]);

  const sampleGenera = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of data?.species || []) {
      const genus = s.sci.split(' ')[0];
      if (!seen.has(genus)) {
        seen.add(genus);
        list.push(genus);
      }
      if (list.length >= 4) break;
    }
    return list;
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="rounded-3xl border border-emerald-500/15 bg-card/50 p-8 flex items-center justify-center min-h-[280px]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500/60" />
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 sm:p-8"
      aria-label="Preuve par la data"
    >
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Colonne texte */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-amber-500 dark:text-amber-400 mb-3">
              PREUVE PAR LA DATA
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-foreground leading-tight">
              La base de données citoyenne
            </h2>
          </div>

          {description && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="text-4xl font-bold text-emerald-500 dark:text-emerald-400 leading-none mb-2">
                {data.total}
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Espèces recensées
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="text-4xl font-bold text-emerald-500 dark:text-emerald-400 leading-none mb-2">
                {ambassadeursCount}
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Citoyens ambassadeurs
              </div>
            </div>
          </div>

          {bioIndicator && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Bug className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Focus Espèce Bio-indicatrice
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Identification formelle de{' '}
                    <SpeciesName
                      scientificName={bioIndicator}
                      showScientific
                      size="sm"
                      className="inline text-foreground font-medium"
                      scientificClassName="inline italic text-amber-500 dark:text-amber-400 ml-1"
                    />{' '}
                    sur l'itinéraire, signal vivant de la qualité du sol et de l'air.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne donut */}
        <div className="rounded-2xl border border-border/60 bg-background/30 p-5 relative">
          <div className="absolute -top-3 right-4 z-10">
            <PackVivantButton
              explorationId={explorationId}
              level="public"
              variant="default"
              size="sm"
              className="!bg-amber-500 hover:!bg-amber-600 !text-amber-950 rounded-full !px-3 !py-1 !h-auto !text-xs font-semibold shadow-lg"
              label="Extrait direct CSV"
            />
          </div>

          <h3 className="text-sm text-center text-muted-foreground mb-2">
            Répartition des observations (Royaumes)
          </h3>

          <div className="h-[260px] w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive
                >
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [`${value} espèces`, name]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {sampleGenera.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {sampleGenera.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-full bg-background/60 border border-border/60 text-[11px] italic text-muted-foreground"
                >
                  {g}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-full bg-background/60 border border-border/60 text-[11px] text-muted-foreground">
                …
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default PreuveParLaDataCard;
