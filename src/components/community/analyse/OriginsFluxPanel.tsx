import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Globe2, Loader2, Sparkles } from 'lucide-react';
import { useExplorationBiogeography } from '@/hooks/useExplorationBiogeography';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import WorldOriginsGlobe from './origins/WorldOriginsGlobe';
import OriginsMobileStory from './origins/OriginsMobileStory';
import OriginsRankings from './origins/OriginsRankings';
import CountryOriginDrawer from './origins/CountryOriginDrawer';
import DescriberDrawer from './origins/DescriberDrawer';
import DescribersGallery from './origins/DescribersGallery';

interface Props {
  explorationId?: string;
  species: BiodiversitySpecies[];
  eventCentroid?: { lat: number; lng: number };
}

const OriginsFluxPanel: React.FC<Props> = ({ explorationId, species, eventCentroid }) => {
  const { data, isLoading, eventPoint } = useExplorationBiogeography(explorationId, species, eventCentroid);
  const [fullscreen, setFullscreen] = useState(false);
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  const [openDescriber, setOpenDescriber] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // ESC closes fullscreen
  React.useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const stats = useMemo(() => ({
    countries: data?.origins.length ?? 0,
    describers: data?.describers.length ?? 0,
    enriched: data?.enrichedSpecies ?? 0,
    total: data?.totalSpecies ?? species.length,
  }), [data, species.length]);

  const selectedCountryAgg = openCountry ? data?.origins.find((o) => o.country.code === openCountry) : null;
  const selectedDescriberAgg = openDescriber ? data?.describers.find((d) => d.name === openDescriber) : null;

  if (isLoading || !data) {
    return (
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/8 via-rose-500/5 to-transparent px-6 py-12 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Cartographie des origines du vivant…</p>
      </div>
    );
  }

  // ============== MOBILE STORY ==============
  if (isMobile && !fullscreen) {
    return (
      <>
        <OriginsMobileStory
          data={data}
          stats={stats}
          eventPoint={eventPoint}
          onOpenCountry={setOpenCountry}
          onOpenDescriber={setOpenDescriber}
          onOpenFullscreen={() => setFullscreen(true)}
        />
        <CountryOriginDrawer
          open={!!selectedCountryAgg}
          aggregate={selectedCountryAgg ?? null}
          onClose={() => setOpenCountry(null)}
          biogeography={data}
        />
        <DescriberDrawer
          open={!!selectedDescriberAgg}
          aggregate={selectedDescriberAgg ?? null}
          onClose={() => setOpenDescriber(null)}
        />
      </>
    );
  }

  // ============== DESKTOP / TABLET ==============
  const headerBar = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 ring-1 ring-amber-500/30 flex items-center justify-center">
          <Globe2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight">Voyage vers les origines du vivant</h3>
          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="text-foreground font-semibold">{stats.total}</span> espèces ·{' '}
            <span className="text-foreground font-semibold">{stats.countries}</span> pays d'origine ·{' '}
            <span className="text-foreground font-semibold">{stats.describers}</span> descripteurs
            {data.coverage < 0.9 && (
              <> · <Sparkles className="inline w-3 h-3 text-amber-500 -mt-0.5" /> enrichissement en cours…</>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={() => setFullscreen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background/80 hover:bg-muted text-xs font-medium transition-colors"
      >
        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        {fullscreen ? 'Réduire' : 'Plein écran'}
      </button>
    </div>
  );

  const content = (
    <>
      <div className={`relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent ${fullscreen ? 'h-[calc(100vh-200px)]' : 'h-[480px]'}`}>
        <WorldOriginsGlobe
          origins={data.origins}
          describers={data.describers}
          eventPoint={eventPoint}
          onCountryClick={setOpenCountry}
          onDescriberClick={setOpenDescriber}
          height={fullscreen ? typeof window !== 'undefined' ? window.innerHeight - 200 : 600 : 480}
        />
      </div>
      <OriginsRankings
        origins={data.origins}
        describers={data.describers}
        onOpenCountry={setOpenCountry}
        onOpenDescriber={setOpenDescriber}
      />
      <DescribersGallery
        describers={data.describers}
        onOpenDescriber={setOpenDescriber}
      />
    </>
  );

  if (fullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
        >
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-3">
            {headerBar}
          </div>
          <div className="p-6 space-y-6">
            {content}
          </div>
          <CountryOriginDrawer
            open={!!selectedCountryAgg}
            aggregate={selectedCountryAgg ?? null}
            onClose={() => setOpenCountry(null)}
            biogeography={data}
          />
          <DescriberDrawer
            open={!!selectedDescriberAgg}
            aggregate={selectedDescriberAgg ?? null}
            onClose={() => setOpenDescriber(null)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="space-y-4">
      {headerBar}
      {content}
      <CountryOriginDrawer
        open={!!selectedCountryAgg}
        aggregate={selectedCountryAgg ?? null}
        onClose={() => setOpenCountry(null)}
        biogeography={data}
      />
      <DescriberDrawer
        open={!!selectedDescriberAgg}
        aggregate={selectedDescriberAgg ?? null}
        onClose={() => setOpenDescriber(null)}
      />
    </div>
  );
};

export default OriginsFluxPanel;
