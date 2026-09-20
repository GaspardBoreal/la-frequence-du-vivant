import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Images,
  Play,
  SplitSquareHorizontal,
  X,
} from 'lucide-react';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import { PHASE_LABEL, phaseFromDate, type MediaPhase } from '@/lib/chantierIcg';
import { Button } from '@/components/ui/button';

export interface PhasedPhoto extends ObjetPhoto {
  phase: MediaPhase;
  /** Vrai quand la phase a été posée à la main (et non déduite de la date). */
  manual: boolean;
}

/** Range les médias d'un lot selon la date des travaux, surcharges comprises. */
export function phasePhotos(
  photos: ObjetPhoto[],
  workDate: string | null,
  overrides: Record<string, MediaPhase>,
): PhasedPhoto[] {
  return photos.map((p) => ({
    ...p,
    phase: overrides[p.id] ?? phaseFromDate(p.taken_at, workDate),
    manual: !!overrides[p.id],
  }));
}

const PHASES: MediaPhase[] = ['avant', 'pendant', 'apres'];
const FIRST_WAVE = 6;
const WAVE_SIZE = 6;

const isVideo = (photo: PhasedPhoto) =>
  photo.media_type === 'video' || photo.mime?.startsWith('video/');

/** Entrelace les phases pour que la première planche raconte déjà tout le chantier. */
function contactOrder(photos: PhasedPhoto[]) {
  const groups = PHASES.map((phase) => photos.filter((photo) => photo.phase === phase));
  const ordered: PhasedPhoto[] = [];
  for (let row = 0; ordered.length < photos.length; row += 1) {
    for (const group of groups) {
      const photo = group[row];
      if (photo) ordered.push(photo);
    }
  }
  return ordered;
}

const ProgressiveTile: React.FC<{
  photo: PhasedPhoto;
  priority?: boolean;
  readOnly?: boolean;
  onPhase: (phase: MediaPhase) => void;
  onOpen: () => void;
}> = ({ photo, priority, readOnly, onPhase, onOpen }) => {
  const [loaded, setLoaded] = React.useState(false);
  const [fallback, setFallback] = React.useState(false);
  const video = isVideo(photo);
  const previewUrl = fallback ? photo.url : photo.thumb_url ?? photo.url;

  return (
    <figure className="group relative min-w-0 overflow-hidden rounded-lg border border-current/15 bg-white/[0.035]">
      <Button
        type="button"
        variant="ghost"
        onClick={onOpen}
        className="relative block h-auto w-full rounded-none p-0 hover:bg-transparent"
        aria-label={`Ouvrir ${video ? 'la vidéo' : 'la photographie'} en grand`}
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden">
          <span
            aria-hidden="true"
            className={`absolute inset-0 bg-white/[0.055] transition-opacity duration-300 motion-reduce:transition-none ${loaded ? 'opacity-0' : 'animate-pulse opacity-100'}`}
          />
          {video ? (
            <span className="absolute inset-0 grid place-items-center bg-white/[0.035]">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-[hsl(var(--ds-gold))]/55 bg-[hsl(var(--ds-forest-deep))]/80 text-[hsl(var(--ds-gold))]">
                <Play className="h-4 w-4 fill-current" />
              </span>
            </span>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={photo.caption || 'Photographie du chantier'}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => {
                if (!fallback && photo.url && previewUrl !== photo.url) {
                  setFallback(true);
                  return;
                }
                setLoaded(true);
              }}
              className={`h-full w-full object-cover transition duration-300 motion-reduce:transition-none ${loaded ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0'}`}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[11px] opacity-40">
              image indisponible
            </span>
          )}
          {video && (
            <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-[0.14em] opacity-60">
              Vidéo · lecture au clic
            </span>
          )}
        </span>
      </Button>

      <figcaption className="flex min-h-8 items-center gap-1 px-1.5 py-1">
        <span className="min-w-0 flex-1 truncate text-[10.5px] opacity-60">
          {photo.taken_at ? new Date(photo.taken_at).toLocaleDateString('fr-FR') : 'date inconnue'}
          {photo.manual ? ' · étiquetée' : ''}
        </span>
        {!readOnly && (
          <span className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {PHASES.map((phase) => (
              <Button
                key={phase}
                type="button"
                variant="ghost"
                title={PHASE_LABEL[phase]}
                onClick={() => onPhase(phase)}
                className={`h-6 min-w-6 rounded px-1 text-[9px] uppercase hover:bg-white/10 ${
                  photo.phase === phase
                    ? 'bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))]'
                    : 'opacity-45'
                }`}
              >
                {phase === 'avant' ? 'AV' : phase === 'pendant' ? 'PD' : 'AP'}
              </Button>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  );
};

const MediaLightbox: React.FC<{
  photos: PhasedPhoto[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}> = ({ photos, index, onIndex, onClose }) => {
  const photo = photos[index];
  const [fullLoaded, setFullLoaded] = React.useState(false);

  React.useEffect(() => setFullLoaded(false), [photo?.id]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length);
      if (event.key === 'ArrowRight') onIndex((index + 1) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onIndex]);

  React.useEffect(() => {
    [photos[index - 1], photos[index + 1]].forEach((candidate) => {
      if (candidate?.url && !isVideo(candidate)) {
        const image = new Image();
        image.src = candidate.url;
      }
    });
  }, [index, photos]);

  if (!photo?.url) return null;

  return (
    <div
      className="fixed inset-0 z-[3600] flex items-center justify-center bg-[hsl(var(--ds-forest-deep))]/95 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Média du chantier en plein écran"
    >
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 text-white/75 hover:bg-white/10 hover:text-white">
        <X />
      </Button>
      {photos.length > 1 && (
        <>
          <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); onIndex((index - 1 + photos.length) % photos.length); }} aria-label="Média précédent" className="absolute left-2 z-10 text-white/75 hover:bg-white/10 hover:text-white sm:left-5">
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); onIndex((index + 1) % photos.length); }} aria-label="Média suivant" className="absolute right-2 z-10 text-white/75 hover:bg-white/10 hover:text-white sm:right-5">
            <ChevronRight />
          </Button>
        </>
      )}

      <div className="relative flex h-full w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
        {isVideo(photo) ? (
          <video key={photo.id} src={photo.url} controls autoPlay preload="metadata" className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <>
            {(photo.thumb_url ?? photo.url) && (
              <img src={photo.thumb_url ?? photo.url} alt="" aria-hidden="true" className={`absolute max-h-full max-w-full rounded-lg object-contain blur-sm transition-opacity ${fullLoaded ? 'opacity-0' : 'opacity-80'}`} />
            )}
            <img src={photo.url} alt={photo.caption || 'Photographie du chantier'} onLoad={() => setFullLoaded(true)} className={`max-h-full max-w-full rounded-lg object-contain transition-opacity duration-300 ${fullLoaded ? 'opacity-100' : 'opacity-0'}`} />
          </>
        )}
      </div>
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-[hsl(var(--ds-forest-deep))]/75 px-3 py-1 text-[11px] tabular-nums text-white/70">
        {index + 1} / {photos.length} · {PHASE_LABEL[photo.phase]}
      </span>
    </div>
  );
};

/** Planche progressive par phase, complétée par le rideau avant / après. */
export const MediaCurtain: React.FC<{
  photos: PhasedPhoto[];
  readOnly?: boolean;
  onPhase: (photoId: string, phase: MediaPhase) => void;
}> = ({ photos, readOnly, onPhase }) => {
  const [mode, setMode] = React.useState<'planche' | 'rideau'>('planche');
  const [cursor, setCursor] = React.useState(50);
  const [visibleCount, setVisibleCount] = React.useState(FIRST_WAVE);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const [aIdx, setAIdx] = React.useState(0);
  const [bIdx, setBIdx] = React.useState(0);

  const ordered = React.useMemo(() => contactOrder(photos), [photos]);
  const visibleIds = React.useMemo(
    () => new Set(ordered.slice(0, visibleCount).map((photo) => photo.id)),
    [ordered, visibleCount],
  );
  const stills = React.useMemo(() => photos.filter((photo) => !isVideo(photo)), [photos]);
  const avant = React.useMemo(() => stills.filter((photo) => photo.phase === 'avant'), [stills]);
  const apres = React.useMemo(() => stills.filter((photo) => photo.phase === 'apres'), [stills]);
  const left = avant[Math.min(aIdx, avant.length - 1)];
  const right = apres[Math.min(bIdx, apres.length - 1)];
  const canCurtain = !!left?.thumb_url && !!right?.thumb_url;

  React.useEffect(() => {
    setVisibleCount(FIRST_WAVE);
  }, [photos.length]);

  React.useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleCount >= ordered.length || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisibleCount((count) => Math.min(count + WAVE_SIZE, ordered.length));
      },
      { rootMargin: '180px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [ordered.length, visibleCount]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-55">Carnet visuel · {photos.length}</p>
          <p className="mt-0.5 text-[11px] italic opacity-45">La planche s’ouvre légère, les originaux restent au repos.</p>
        </div>
        <div className="ml-auto flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setMode('planche')} aria-pressed={mode === 'planche'} className={`h-8 rounded-full border px-2.5 text-[11px] ${mode === 'planche' ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15' : 'border-current/20 opacity-70'}`}>
            <Images /> Planche
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMode('rideau')} disabled={!canCurtain} aria-pressed={mode === 'rideau'} className={`h-8 rounded-full border px-2.5 text-[11px] ${mode === 'rideau' ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15' : 'border-current/20 opacity-70'}`}>
            <SplitSquareHorizontal /> Rideau
          </Button>
        </div>
      </div>

      {photos.length === 0 && (
        <p className="rounded-lg border border-dashed border-current/20 px-3 py-6 text-center text-[12px] italic opacity-55">
          Aucun média au carnet des ouvrages de ce chantier.
        </p>
      )}

      {mode === 'planche' && PHASES.map((phase) => {
        const all = photos.filter((photo) => photo.phase === phase);
        const visible = all.filter((photo) => visibleIds.has(photo.id));
        if (!all.length) return null;
        return (
          <section key={phase} className="mb-4 border-t border-white/10 pt-2.5 first:border-t-0 first:pt-0">
            <header className="mb-2 flex items-baseline gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ds-gold))]">{PHASE_LABEL[phase]}</h3>
              <span className="text-[10px] tabular-nums opacity-45">{all.length}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-[hsl(var(--ds-gold))]/30 to-transparent" />
            </header>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((photo) => (
                <ProgressiveTile
                  key={photo.id}
                  photo={photo}
                  priority={ordered[0]?.id === photo.id}
                  readOnly={readOnly}
                  onPhase={(next) => onPhase(photo.id, next)}
                  onOpen={() => setOpenIndex(photos.findIndex((item) => item.id === photo.id))}
                />
              ))}
            </div>
          </section>
        );
      })}

      {mode === 'planche' && visibleCount < ordered.length && (
        <div ref={loadMoreRef} className="flex justify-center py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setVisibleCount((count) => Math.min(count + WAVE_SIZE, ordered.length))} className="rounded-full border border-current/20 px-4 text-[11px] opacity-70 hover:opacity-100">
            Voir la suite · {ordered.length - visibleCount}
          </Button>
        </div>
      )}

      {mode === 'rideau' && canCurtain && left && right && (
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-current/15 bg-white/[0.035]">
            <img src={left.thumb_url} alt="Avant travaux" decoding="async" className="h-full w-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${cursor}%` }}>
              <img src={right.thumb_url} alt="Après travaux" decoding="async" className="h-full max-w-none object-cover" style={{ width: `${10000 / Math.max(cursor, 1)}%` }} />
            </div>
            <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-[hsl(var(--ds-gold))]" style={{ left: `${cursor}%` }} />
            <span className="absolute left-2 top-2 rounded-full bg-[hsl(var(--ds-forest-deep))]/75 px-2 py-0.5 text-[10px]">Après</span>
            <span className="absolute right-2 top-2 rounded-full bg-[hsl(var(--ds-forest-deep))]/75 px-2 py-0.5 text-[10px]">Avant</span>
          </div>
          <input type="range" min={0} max={100} value={cursor} onChange={(event) => setCursor(Number(event.target.value))} className="mt-2 w-full accent-[hsl(var(--ds-gold))]" aria-label="Curseur avant / après" />
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAIdx((index) => (index + 1) % Math.max(avant.length, 1))} className="h-7 rounded-full border border-current/20 px-2">Avant suivant ({avant.length})</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setBIdx((index) => (index + 1) % Math.max(apres.length, 1))} className="h-7 rounded-full border border-current/20 px-2">Après suivant ({apres.length})</Button>
          </div>
        </div>
      )}

      {openIndex !== null && (
        <MediaLightbox photos={photos} index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  );
};

export default MediaCurtain;