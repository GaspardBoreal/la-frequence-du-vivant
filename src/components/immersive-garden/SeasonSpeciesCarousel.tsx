import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Leaf, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationFieldPhotos, normalizeSpeciesKey } from '@/hooks/useExplorationFieldPhotos';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';
import { useExplorationSpeciesCount } from '@/hooks/useExplorationSpeciesCount';
import { SpeciesName } from '@/components/species/SpeciesName';
import type { Season } from './SeasonOverlay';

interface Props {
  explorationId: string | null | undefined;
  season: Season;
  tint: string;
}

const SEASON_MONTHS: Record<Season, Set<number>> = {
  printemps: new Set([3, 4, 5]),
  ete: new Set([6, 7, 8]),
  automne: new Set([9, 10, 11]),
  hiver: new Set([12, 1, 2]),
};

const SEASON_LABEL: Record<Season, string> = {
  printemps: 'printemps',
  ete: 'été',
  automne: 'automne',
  hiver: 'hiver',
};

const PAGE_SIZE = 8;

interface RpcSpecies {
  key: string;
  scientific_name: string | null;
  common_name: string | null;
  observations: number;
  photos: any;
  attributions: any;
  marcheur_attrs: any;
}

interface SpeciesItem {
  key: string;
  scientificName: string;
  commonName: string;
  count: number;
  inatPhoto: string | null;
}

const toMediumInat = (url: string): string =>
  url ? url.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg') : url;

const toLargeInat = (url: string): string =>
  url ? url.replace('/square.', '/large.').replace('/medium.', '/large.').replace('/square.jpg', '/large.jpg') : url;

const monthOf = (d: string | null | undefined): number | null => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.getMonth() + 1;
};

const SeasonSpeciesCarousel: React.FC<Props> = ({ explorationId, season, tint }) => {
  const [page, setPage] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const poolQ = useQuery({
    queryKey: ['garden-season-pool', explorationId],
    enabled: !!explorationId,
    staleTime: 60_000,
    queryFn: async (): Promise<RpcSpecies[]> => {
      if (!explorationId) return [];
      const { data, error } = await supabase.rpc('get_exploration_species_pool', {
        p_exploration_id: explorationId,
      });
      if (error) throw error;
      const r = (data as any) || {};
      return (r.species as RpcSpecies[]) || [];
    },
  });

  const eligible = useMemo<SpeciesItem[]>(() => {
    const months = SEASON_MONTHS[season];
    const raw = poolQ.data || [];
    const out: SpeciesItem[] = [];

    for (const sp of raw) {
      let count = 0;
      let inatPhoto: string | null = null;

      const mAttrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      for (const a of mAttrs) {
        const m = monthOf(a?.observation_date);
        if (m && months.has(m)) count++;
      }

      const attrGroups: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
      const photoGroups: any[] = Array.isArray(sp.photos) ? sp.photos : [];
      attrGroups.forEach((attrs, gi) => {
        if (!Array.isArray(attrs)) return;
        const photos = Array.isArray(photoGroups[gi]) ? photoGroups[gi] : [];
        attrs.forEach((att: any, i: number) => {
          const m = monthOf(att?.date);
          if (m && months.has(m)) {
            count++;
            const url = photos[i];
            if (!inatPhoto && url) inatPhoto = toMediumInat(url);
          }
        });
      });

      if (count > 0) {
        const sci = sp.scientific_name || sp.common_name || sp.key;
        out.push({
          key: sp.key || sci,
          scientificName: sci,
          commonName: sp.common_name || sci,
          count,
          inatPhoto,
        });
      }
    }

    out.sort((a, b) => b.count - a.count);
    return out;
  }, [poolQ.data, season]);

  const field = useExplorationFieldPhotos(explorationId || undefined);
  const names = useMemo(
    () => Array.from(new Set(eligible.map((s) => s.scientificName).filter(Boolean))),
    [eligible],
  );
  const thumbs = useSpeciesThumbs(names);

  useEffect(() => {
    setPage(0);
    setLightboxIdx(null);
  }, [season]);

  // Total canonique de l'exploration — même source que l'app Marcheurs
  // (Carnet, Carte, Synthèse) via la RPC unifiée get_exploration_species_count.
  const speciesCountQ = useExplorationSpeciesCount(explorationId ?? null);
  const totalExploration = speciesCountQ.data?.total;

  const totalPages = Math.max(1, Math.ceil(eligible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const slice = eligible.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const resolvePhoto = useCallback(
    (sp: SpeciesItem): string | null => {
      const fmap = field.data?.byScientificName;
      if (fmap) {
        const nk = normalizeSpeciesKey(sp.scientificName);
        const lk = sp.scientificName.toLowerCase();
        const hit = fmap.get(nk) || fmap.get(lk);
        const first = hit?.[0]?.url;
        if (first) return first;
      }
      const cache = thumbs.data as Map<string, { photo_url: string | null }> | undefined;
      const cached = cache?.get(sp.scientificName.toLowerCase());
      if (cached?.photo_url) return cached.photo_url;
      if (sp.inatPhoto) return sp.inatPhoto;
      return null;
    },
    [field.data, thumbs.data],
  );

  const resolveLargePhoto = useCallback(
    (sp: SpeciesItem): string | null => {
      const url = resolvePhoto(sp);
      if (!url) return null;
      // Only upsize iNat URLs
      if (url.includes('inaturalist') || url.includes('static.inaturalist')) return toLargeInat(url);
      return url;
    },
    [resolvePhoto],
  );

  if (!explorationId) return null;
  const isLoading = poolQ.isLoading;

  return (
    <div className="mt-10 w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${season}-${currentPage}`}
          initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-white/5 animate-pulse border border-white/10"
                />
              ))}
            </div>
          ) : eligible.length === 0 ? (
            <p className="font-serif italic text-[#f4ecd4]/60 text-sm md:text-base py-8 text-center">
              Aucune trace observée en {SEASON_LABEL[season]} — le jardin garde son secret.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {slice.map((sp, idx) => {
                  const photo = resolvePhoto(sp);
                  const globalIdx = currentPage * PAGE_SIZE + idx;
                  return (
                    <motion.button
                      key={sp.key}
                      type="button"
                      onClick={() => setLightboxIdx(globalIdx)}
                      aria-label={`Voir ${sp.commonName || sp.scientificName} en grand`}
                      initial={{ opacity: 0, y: 18, scale: 0.92, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      transition={{
                        duration: 0.55,
                        delay: idx * 0.045,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ scale: 1.04, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      className="group relative text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl"
                    >
                      <div
                        className="relative aspect-square overflow-hidden rounded-2xl border border-white/10"
                        style={{
                          boxShadow: `0 10px 30px -12px ${tint}55, inset 0 0 0 1px rgba(255,255,255,0.06)`,
                        }}
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt={sp.commonName}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-950 to-black">
                            <Leaf className="w-8 h-8 text-[#f4ecd4]/30" />
                          </div>
                        )}

                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${tint}33, transparent 70%)`,
                            mixBlendMode: 'screen',
                          }}
                        />

                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                        <div
                          className="absolute top-2 right-2 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full backdrop-blur-md"
                          style={{
                            background: `${tint}30`,
                            color: '#f4ecd4',
                            border: `1px solid ${tint}66`,
                          }}
                        >
                          {sp.count} obs
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
                          <SpeciesName
                            scientificName={sp.scientificName}
                            commonName={sp.commonName}
                            showScientific
                            size="sm"
                            truncate
                            className="[&>span:first-child]:!text-[#f4ecd4] [&>span:last-child]:!text-[#f4ecd4]/60"
                            scientificClassName="font-serif"
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    aria-label="Espèces précédentes"
                    className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-[#f4ecd4] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-[11px] tracking-[0.25em] uppercase text-[#f4ecd4]/60">
                    {currentPage + 1} / {totalPages}
                    <span className="mx-2 text-[#f4ecd4]/25">·</span>
                    {eligible.length} espèces
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    aria-label="Espèces suivantes"
                    className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-[#f4ecd4] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {lightboxIdx !== null && eligible[lightboxIdx] && (
          <Lightbox
            species={eligible}
            index={lightboxIdx}
            onIndexChange={setLightboxIdx}
            onClose={() => setLightboxIdx(null)}
            resolvePhoto={resolveLargePhoto}
            tint={tint}
            season={season}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface LightboxProps {
  species: SpeciesItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  resolvePhoto: (sp: SpeciesItem) => string | null;
  tint: string;
  season: Season;
}

const Lightbox: React.FC<LightboxProps> = ({
  species,
  index,
  onIndexChange,
  onClose,
  resolvePhoto,
  tint,
  season,
}) => {
  const total = species.length;
  const current = species[index];
  const photo = current ? resolvePhoto(current) : null;

  const go = useCallback(
    (dir: -1 | 1) => {
      const next = (index + dir + total) % total;
      onIndexChange(next);
    },
    [index, total, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  // preload neighbours
  useEffect(() => {
    [-1, 1].forEach((d) => {
      const n = species[(index + d + total) % total];
      if (!n) return;
      const u = resolvePhoto(n);
      if (u) {
        const img = new Image();
        img.src = u;
      }
    });
  }, [index, species, total, resolvePhoto]);

  if (!current) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-label="Espèce en grand"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/92 backdrop-blur-md"
        onClick={onClose}
      />
      {/* seasonal halo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${tint}22, transparent 60%)`,
        }}
      />

      {/* close */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[#f4ecd4] flex items-center justify-center transition"
      >
        <X className="w-5 h-5" />
      </button>

      {/* prev */}
      {total > 1 && (
        <button
          onClick={() => go(-1)}
          aria-label="Précédent"
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[#f4ecd4] flex items-center justify-center transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {total > 1 && (
        <button
          onClick={() => go(1)}
          aria-label="Suivant"
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[#f4ecd4] flex items-center justify-center transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* content */}
      <div className="relative z-[5] flex flex-col items-center gap-5 px-4 pb-16 pt-16 max-w-6xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key + '-' + index}
            className="flex flex-col items-center gap-5 w-full"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={current.commonName}
                className="max-h-[72vh] max-w-[92vw] object-contain rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
                draggable={false}
              />
            ) : (
              <div className="w-72 h-72 rounded-2xl bg-gradient-to-br from-emerald-950 to-black flex items-center justify-center">
                <Leaf className="w-12 h-12 text-[#f4ecd4]/40" />
              </div>
            )}

            <div className="flex flex-col items-center gap-2 text-center max-w-xl">
              <div
                className="text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full backdrop-blur-md"
                style={{
                  background: `${tint}30`,
                  color: '#f4ecd4',
                  border: `1px solid ${tint}66`,
                }}
              >
                {current.count} obs · {SEASON_LABEL[season]}
              </div>
              <div className="[&_span:first-child]:!text-[#f4ecd4] [&_span:last-child]:!text-[#f4ecd4]/70">
                <SpeciesName
                  scientificName={current.scientificName}
                  commonName={current.commonName}
                  showScientific
                  size="lg"
                  scientificClassName="font-serif italic"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* counter */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.25em] uppercase text-[#f4ecd4]/60 z-10">
          {index + 1} / {total}
          <span className="mx-2 text-[#f4ecd4]/25">·</span>
          {SEASON_LABEL[season]}
        </div>
      )}
    </motion.div>
  );
};

export default SeasonSpeciesCarousel;
