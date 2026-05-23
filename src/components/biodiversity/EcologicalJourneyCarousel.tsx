import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useEcologicalFunctions, type SpeciesWithFunctions } from '@/hooks/useEcologicalFunctions';
import { ECO_FUNCTIONS, ECO_FAMILIES, getEcoFunction, type EcoFunction } from '@/lib/ecologicalFunctions';
import { STRATE_META, type PlantStrate } from '@/lib/plantStrate';
import { SpeciesName } from '@/components/species/SpeciesName';

interface Props {
  explorationId: string | null | undefined;
}

/**
 * Carrousel "Partons à la découverte des arbres / mellifères / fixateurs d'azote…"
 *
 * - Liste UNIQUEMENT les tags qui ont au moins 1 espèce observée sur l'expé
 * - Compteurs vivants, animés
 * - Clic → drawer plein écran avec la liste des espèces du tag
 *   (pour `mellifere` : 3 sections empilées Arbres / Arbustes / Herbacées)
 * - Recalculé à chaque invalidation du pool (nouvelles obs)
 */
const SpeciesGridCard: React.FC<{ sp: SpeciesWithFunctions; emoji: string; idx: number }> = ({
  sp,
  emoji,
  idx,
}) => (
  <motion.li
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: Math.min(idx * 0.015, 0.4) }}
    className="rounded-xl overflow-hidden border border-border bg-card"
  >
    <div className="aspect-square bg-muted">
      {sp.imageUrl ? (
        <img
          src={sp.imageUrl}
          alt={sp.displayName}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl opacity-40">
          {emoji}
        </div>
      )}
    </div>
    <div className="p-2">
      <div className="text-xs font-medium text-foreground line-clamp-1">
        <SpeciesName
          scientificName={sp.scientificName}
          commonName={sp.commonNameFr || sp.commonName}
          size="sm"
        />
      </div>
      <div className="text-[10px] text-muted-foreground italic line-clamp-1">
        {sp.scientificName}
      </div>
      {sp.count > 1 && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          {sp.count} observations
        </div>
      )}
    </div>
  </motion.li>
);

const EcologicalJourneyCarousel: React.FC<Props> = ({ explorationId }) => {
  const { buckets, counts, mellifereByStrate, isLoading } = useEcologicalFunctions(explorationId);
  const [openTag, setOpenTag] = useState<EcoFunction | null>(null);

  const activeFunctions = useMemo(
    () => ECO_FUNCTIONS.filter(f => counts[f.value] > 0),
    [counts],
  );

  if (isLoading || activeFunctions.length === 0) return null;

  const openSpecies = openTag ? buckets[openTag] : [];
  const openMeta = openTag ? getEcoFunction(openTag) : null;

  // Label dynamique : "arbres et plantes mellifères" si au moins 1 ligneux
  const mellifereLigneuxCount =
    mellifereByStrate.arbre.length + mellifereByStrate.arbuste.length;
  const mellifereLabel =
    mellifereLigneuxCount > 0 ? 'arbres et plantes mellifères' : 'plantes mellifères';

  const labelFor = (f: typeof ECO_FUNCTIONS[number]) =>
    f.value === 'mellifere' ? mellifereLabel : f.journeyLabel;

  const orderedStrates: PlantStrate[] = ['arbre', 'arbuste', 'herbacee'];

  return (
    <>
      <section className="mb-4" data-chat-section="ecological-journeys">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            Partons à la découverte du vivant
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {activeFunctions.length} parcours actifs
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {activeFunctions.map((f, i) => (
            <motion.button
              key={f.value}
              type="button"
              onClick={() => setOpenTag(f.value)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              whileHover={{ y: -2 }}
              className={`shrink-0 snap-start w-[180px] rounded-2xl border border-border bg-gradient-to-br ${f.gradient} p-3.5 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40`}
              aria-label={`Partons à la découverte des ${labelFor(f)}`}
            >
              <div className="text-2xl leading-none mb-1.5" aria-hidden="true">
                {f.emoji}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">
                Partons à la découverte
              </div>
              <div className="text-sm font-semibold text-foreground leading-tight">
                des {counts[f.value]} {labelFor(f)}
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">
                {f.service}
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <Sheet open={!!openTag} onOpenChange={o => !o && setOpenTag(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          {openMeta && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl" aria-hidden="true">{openMeta.emoji}</span>
                  <div>
                    <SheetTitle className="text-lg">
                      {counts[openMeta.value]} {labelFor(openMeta)}
                    </SheetTitle>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {ECO_FAMILIES[openMeta.family].label}
                    </div>
                  </div>
                </div>
                <SheetDescription className="text-sm leading-relaxed">
                  {openMeta.service}
                </SheetDescription>
              </SheetHeader>

              {/* Drawer mellifère : 3 sections empilées par strate */}
              {openMeta.value === 'mellifere' ? (
                <div className="mt-5 space-y-6">
                  {orderedStrates.map((strate, si) => {
                    const list = mellifereByStrate[strate];
                    if (list.length === 0) return null;
                    const meta = STRATE_META[strate];
                    return (
                      <motion.section
                        key={strate}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: si * 0.08, duration: 0.3 }}
                        className={`rounded-2xl border border-border bg-gradient-to-br ${meta.gradient} p-4`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl" aria-hidden="true">{meta.emoji}</span>
                          <h4 className="text-base font-semibold text-foreground">
                            {list.length} {meta.pluralLabel}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {meta.narrative}
                        </p>
                        <AnimatePresence>
                          <motion.ul
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                          >
                            {list.map((sp, idx) => (
                              <SpeciesGridCard
                                key={sp.key}
                                sp={sp}
                                emoji={meta.emoji}
                                idx={idx}
                              />
                            ))}
                          </motion.ul>
                        </AnimatePresence>
                      </motion.section>
                    );
                  })}
                </div>
              ) : (
                <AnimatePresence>
                  <motion.ul
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {openSpecies.map((sp: SpeciesWithFunctions, idx) => (
                      <SpeciesGridCard
                        key={sp.key}
                        sp={sp}
                        emoji={openMeta.emoji}
                        idx={idx}
                      />
                    ))}
                  </motion.ul>
                </AnimatePresence>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EcologicalJourneyCarousel;
