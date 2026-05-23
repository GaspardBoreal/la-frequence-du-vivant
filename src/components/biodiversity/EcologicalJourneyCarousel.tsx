import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, AlertCircle, ListChecks, Sparkles, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useEcologicalFunctions, type SpeciesWithFunctions } from '@/hooks/useEcologicalFunctions';
import { useIsCurator } from '@/hooks/useExplorationCurations';
import { useClassifySpeciesAI } from '@/hooks/useSpeciesEcoTagsKb';
import { ECO_FUNCTIONS, ECO_FAMILIES, getEcoFunction, type EcoFunction } from '@/lib/ecologicalFunctions';
import { STRATE_META, type PlantStrate } from '@/lib/plantStrate';
import { SpeciesName } from '@/components/species/SpeciesName';
import SpeciesEcoTagsEditor from './SpeciesEcoTagsEditor';


interface Props {
  explorationId: string | null | undefined;
}

const SpeciesGridCard: React.FC<{
  sp: SpeciesWithFunctions;
  emoji: string;
  idx: number;
  canCurate: boolean;
  onEdit: (sp: SpeciesWithFunctions) => void;
}> = ({ sp, emoji, idx, canCurate, onEdit }) => (
  <motion.li
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: Math.min(idx * 0.015, 0.4) }}
    className="relative rounded-xl overflow-hidden border border-border bg-card group"
  >
    {/* Dot "à valider" */}
    {canCurate && sp.needsReview && (
      <span
        className="absolute top-1.5 left-1.5 z-10 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-background animate-pulse"
        title="À valider"
        aria-label="Espèce à valider"
      />
    )}
    {/* Badge "curé" */}
    {canCurate && sp.isCurated && (
      <span
        className="absolute top-1.5 left-1.5 z-10 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
        title="Tags curés manuellement"
        aria-label="Tags curés"
      />
    )}
    {/* Bouton crayon curateur */}
    {canCurate && (
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onEdit(sp);
        }}
        className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-background/90 backdrop-blur border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity hover:scale-110"
        aria-label="Ajuster les tags écologiques"
      >
        <Pencil className="w-3.5 h-3.5 text-foreground" />
      </button>
    )}

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
  const { buckets, counts, mellifereByStrate, allSpecies, needsReviewCount, isLoading } =
    useEcologicalFunctions(explorationId);
  const { data: canCurate } = useIsCurator(explorationId);
  const [openTag, setOpenTag] = useState<EcoFunction | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<SpeciesWithFunctions | null>(null);

  const activeFunctions = useMemo(
    () => ECO_FUNCTIONS.filter(f => counts[f.value] > 0),
    [counts],
  );

  const speciesToReview = useMemo(
    () => allSpecies.filter(s => s.needsReview).sort((a, b) => b.count - a.count),
    [allSpecies],
  );

  if (isLoading || (activeFunctions.length === 0 && !canCurate)) return null;

  const openSpecies = openTag ? buckets[openTag] : [];
  const openMeta = openTag ? getEcoFunction(openTag) : null;

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
        <div className="flex items-end justify-between mb-4 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mb-1">
              Storytelling vivant · recalculé en temps réel
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground leading-tight">
              Partons à la découverte du vivant
            </h3>
          </div>
          <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
            {activeFunctions.length} parcours
          </span>
        </div>

        {/* Bandeau curateur : espèces à valider */}
        {canCurate && needsReviewCount > 0 && (
          <motion.button
            type="button"
            onClick={() => setReviewOpen(true)}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left hover:bg-amber-500/15 transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {needsReviewCount} espèce{needsReviewCount > 1 ? 's' : ''} à valider
              </div>
              <div className="text-[11px] text-muted-foreground">
                Aide la communauté en ajustant leurs tags écologiques · 2 clics par espèce
              </div>
            </div>
            <ListChecks className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeFunctions.map((f, i) => (
            <motion.button
              key={f.value}
              type="button"
              onClick={() => setOpenTag(f.value)}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card text-left focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm hover:shadow-2xl transition-shadow"
              aria-label={`Partons à la découverte des ${counts[f.value]} ${labelFor(f)}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-90`} aria-hidden="true" />
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/20 dark:bg-white/10 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" aria-hidden="true" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden="true" />

              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <motion.div
                    className="text-5xl leading-none drop-shadow-sm"
                    aria-hidden="true"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.6 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {f.emoji}
                  </motion.div>
                  <div className="text-right">
                    <motion.div
                      key={counts[f.value]}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                      className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums leading-none"
                    >
                      {counts[f.value]}
                    </motion.div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                      observée{counts[f.value] > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/90 mb-1">
                  Partons à la découverte
                </div>
                <div className="text-base sm:text-lg font-semibold text-foreground leading-snug mb-2">
                  des {counts[f.value]} {labelFor(f)}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {f.service}
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  <span>Explorer ce parcours</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Drawer parcours d'un tag */}
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
                                canCurate={!!canCurate}
                                onEdit={setEditingSpecies}
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
                        canCurate={!!canCurate}
                        onEdit={setEditingSpecies}
                      />
                    ))}
                  </motion.ul>
                </AnimatePresence>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Drawer "Espèces à valider" — accessible curateurs */}
      <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <span className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </span>
              <div>
                <SheetTitle className="text-lg">
                  {speciesToReview.length} espèce{speciesToReview.length > 1 ? 's' : ''} à valider
                </SheetTitle>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Curation des tags écologiques
                </div>
              </div>
            </div>
            <SheetDescription className="text-sm">
              Ces espèces n'ont pas été automatiquement classées. Clique sur le crayon pour
              leur attribuer les bons tags — ta contribution améliore les parcours pour tous.
            </SheetDescription>
          </SheetHeader>

          <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {speciesToReview.map((sp, idx) => (
              <SpeciesGridCard
                key={sp.key}
                sp={sp}
                emoji="🌿"
                idx={idx}
                canCurate
                onEdit={setEditingSpecies}
              />
            ))}
          </ul>
          {speciesToReview.length === 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground py-8">
              ✨ Toutes les espèces sont classées. Merci !
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Éditeur de tags */}
      {explorationId && (
        <SpeciesEcoTagsEditor
          open={!!editingSpecies}
          onOpenChange={o => !o && setEditingSpecies(null)}
          explorationId={explorationId}
          species={editingSpecies}
        />
      )}
    </>
  );
};

export default EcologicalJourneyCarousel;
