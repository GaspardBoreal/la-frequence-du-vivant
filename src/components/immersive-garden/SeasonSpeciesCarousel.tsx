import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationFieldPhotos, normalizeSpeciesKey } from '@/hooks/useExplorationFieldPhotos';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';
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

const monthOf = (d: string | null | undefined): number | null => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.getMonth() + 1;
};

const SeasonSpeciesCarousel: React.FC<Props> = ({ explorationId, season, tint }) => {
  const [page, setPage] = useState(0);

  // Raw pool with attribution dates
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

  // Filter species by season using attribution dates
  const eligible = useMemo<SpeciesItem[]>(() => {
    const months = SEASON_MONTHS[season];
    const raw = poolQ.data || [];
    const out: SpeciesItem[] = [];

    for (const sp of raw) {
      let count = 0;
      let inatPhoto: string | null = null;

      // marcheur direct attrs
      const mAttrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      for (const a of mAttrs) {
        const m = monthOf(a?.observation_date);
        if (m && months.has(m)) count++;
      }

      // iNat attributions (grouped)
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

  // Field photos (marcheurs) & iNat cache fallback
  const field = useExplorationFieldPhotos(explorationId || undefined);
  const names = useMemo(
    () => Array.from(new Set(eligible.map((s) => s.scientificName).filter(Boolean))),
    [eligible],
  );
  const thumbs = useSpeciesThumbs(names);

  // Reset page when season changes
  useEffect(() => {
    setPage(0);
  }, [season]);

  const totalPages = Math.max(1, Math.ceil(eligible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const slice = eligible.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const resolvePhoto = (sp: SpeciesItem): string | null => {
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
  };

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
            <p className="font-serif italic text-[#f4ecd4]/60 text-sm md:text-base py-8">
              Aucune trace observée en {SEASON_LABEL[season]} — le jardin garde son secret.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {slice.map((sp, idx) => {
                  const photo = resolvePhoto(sp);
                  return (
                    <motion.div
                      key={sp.key}
                      initial={{ opacity: 0, y: 18, scale: 0.92, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      transition={{
                        duration: 0.55,
                        delay: idx * 0.045,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ scale: 1.04, y: -3 }}
                      className="group relative"
                    >
                      <div
                        className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]"
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

                        {/* halo saisonnier au hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${tint}33, transparent 70%)`,
                            mixBlendMode: 'screen',
                          }}
                        />

                        {/* dégradé lisibilité */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                        {/* badge nombre d'obs */}
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

                        {/* noms */}
                        <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
                          <div className="text-[#f4ecd4] text-xs md:text-sm font-medium leading-tight line-clamp-2">
                            {sp.commonName}
                          </div>
                          {sp.scientificName && sp.scientificName !== sp.commonName && (
                            <div className="font-serif italic text-[10px] md:text-[11px] text-[#f4ecd4]/60 leading-tight line-clamp-1 mt-0.5">
                              {sp.scientificName}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
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
    </div>
  );
};

export default SeasonSpeciesCarousel;
