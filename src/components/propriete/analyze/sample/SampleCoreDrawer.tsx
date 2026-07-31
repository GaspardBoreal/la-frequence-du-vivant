import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Film,
  MapPin,
  Sparkles,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import {
  usePropertyTestMedias,
  type TestMedia,
} from '@/hooks/propriete/usePropertyTestMedias';
import {
  SOIL_BLOCKS,
  soilTestLabel,
  type SoilBlockId,
} from '@/components/propriete/analyze/media/soilTestCatalog';
import {
  RESULT_LABELS,
  RESULT_SHORT,
  READING,
  TEST_LABELS,
  type StructureResultId,
} from '@/components/propriete/analyze/structureTests';
import {
  TEXTURE_LABELS,
  TEXTURE_SHORT,
  TEXTURE_READING,
  TEXTURE_TEST_LABELS,
  BOUDIN_FORM_MAP,
  type TextureResultId,
} from '@/components/propriete/analyze/textureTests';
import {
  classifyPh,
  phPercent,
  PH_GRADIENT,
  PH_TEST_LABELS,
} from '@/components/propriete/analyze/phTests';
import {
  scoreLife,
  LIFE_CLASS_MAP,
  LIFE_SIGN_MAP,
  LIFE_TEST_LABELS,
  type LifeSignId,
} from '@/components/propriete/analyze/lifeTests';
import { useImageZoomPan } from '@/hooks/useImageZoomPan';
import SampleCoreSvg, { type CoreStratum } from './SampleCoreSvg';
import { useSampleDrawer, closeSampleCore, focusSampleCore } from './sampleDrawerStore';

const TEXTURE_COLOR: Record<TextureResultId, string> = {
  sable: '#d8b26a',
  limon: '#a98c52',
  argile: '#a4644a',
};
const STRUCTURE_COLOR: Record<StructureResultId, string> = {
  compacte: '#b4603f',
  grumeleuse: '#2f7d4f',
  particulaire: '#c9a227',
};

const MICRO = 'text-[9px] font-bold uppercase tracking-[0.22em]';

/* ------------------------------------------------------------------ */
/* Lightbox photo avec loupe de terrain                                */
/* ------------------------------------------------------------------ */

const MediaLightbox: React.FC<{
  medias: TestMedia[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}> = ({ medias, index, onIndex, onClose }) => {
  const m = medias[index];
  const zoom = useImageZoomPan(m?.id ?? null);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % medias.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + medias.length) % medias.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [index, medias.length, onIndex, onClose]);

  if (!m) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex flex-col bg-black/92" onClick={onClose}>
      <div
        className="flex items-center gap-2 px-4 py-3 text-white/85"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`${MICRO} text-[hsl(var(--ds-gold))]`}>
          {soilTestLabel(m.test_id)} · {m.sample_label ?? m.sample_id}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <button
            onClick={() => zoom.zoomBy(1 / 1.4)}
            className="rounded-full border border-white/25 p-1.5 hover:bg-white/10"
            aria-label="Dézoomer"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => zoom.zoomBy(1.4)}
            className="rounded-full border border-white/25 p-1.5 hover:bg-white/10"
            aria-label="Zoomer"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="ml-2 rounded-full border border-white/25 p-1.5 hover:bg-white/10"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        ref={zoom.containerRef}
        {...zoom.handlers}
      >
        {m.media_type === 'video' ? (
          <video src={m.url} controls className="h-full w-full object-contain" />
        ) : (
          <img
            src={m.url}
            alt={m.caption ?? 'Preuve de terrain'}
            className="h-full w-full select-none object-contain"
            style={{ transform: zoom.transform, transformOrigin: 'center center' }}
            draggable={false}
          />
        )}
      </div>


      <div
        className="flex items-center justify-center gap-2 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onIndex((index - 1 + medias.length) % medias.length)}
          className="rounded-full border border-white/25 p-1.5 text-white/85 hover:bg-white/10"
          aria-label="Précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[11px] text-white/70">
          {index + 1} / {medias.length}
          {m.taken_at ? ` · ${new Date(m.taken_at).toLocaleDateString('fr-FR')}` : ''}
        </span>
        <button
          onClick={() => onIndex((index + 1) % medias.length)}
          className="rounded-full border border-white/25 p-1.5 text-white/85 hover:bg-white/10"
          aria-label="Suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
};

/* ------------------------------------------------------------------ */
/* Bande de preuves                                                     */
/* ------------------------------------------------------------------ */

const EvidenceStrip: React.FC<{
  medias: TestMedia[];
  onOpen: (i: number) => void;
}> = ({ medias, onOpen }) => {
  if (!medias.length)
    return (
      <p className="mt-2 text-[10.5px] italic opacity-50">
        Aucune preuve de terrain pour ce test.
      </p>
    );
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {medias.map((m, i) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onOpen(i)}
          className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/5"
        >
          {m.media_type === 'photo' && m.url ? (
            <img
              src={m.url}
              alt={m.caption ?? ''}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Film className="h-5 w-5 opacity-60" />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[8.5px] text-white">
            {m.taken_at || m.created_at
              ? new Date(m.taken_at ?? m.created_at).toLocaleDateString('fr-FR')
              : '—'}
          </span>
        </button>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Section d'une dimension                                              */
/* ------------------------------------------------------------------ */

const Section: React.FC<{
  id: SoilBlockId;
  title: string;
  test: string | null;
  value: string | null;
  color: string;
  reading?: string | null;
  children?: React.ReactNode;
  medias: TestMedia[];
  onOpenMedia: (list: TestMedia[], i: number) => void;
  refCb: (el: HTMLDivElement | null) => void;
}> = ({ id, title, test, value, color, reading, children, medias, onOpenMedia, refCb }) => (
  <div
    ref={refCb}
    data-section={id}
    className="scroll-mt-4 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4"
  >
    <div className="flex items-baseline gap-2">
      <span className={MICRO} style={{ color }}>
        {title}
      </span>
      <span className="ml-auto text-[9.5px] uppercase tracking-wider opacity-55">
        {test ?? 'test non précisé'}
      </span>
    </div>

    <p
      className="mt-1 font-serif text-2xl font-bold leading-tight"
      style={{ color: value ? color : undefined, opacity: value ? 1 : 0.35 }}
    >
      {value ?? 'à relever'}
    </p>

    {children}

    {reading && (
      <p className="mt-2 border-t border-[hsl(var(--ds-line))]/70 pt-2 text-[11.5px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/85">
        {reading}
      </p>
    )}

    <div className="mt-2 flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider opacity-55">
      <Camera className="h-3 w-3" />
      {medias.length} preuve{medias.length > 1 ? 's' : ''}
    </div>
    <EvidenceStrip medias={medias} onOpen={(i) => onOpenMedia(medias, i)} />
  </div>
);

/* ------------------------------------------------------------------ */
/* Drawer principal                                                     */
/* ------------------------------------------------------------------ */

const DrawerInner: React.FC<{
  samples: SoilSample[];
  sampleId: string;
  proprieteId?: string;
}> = ({ samples, sampleId, proprieteId }) => {
  const { data: allMedias = [] } = usePropertyTestMedias(proprieteId);
  const [active, setActive] = React.useState<SoilBlockId | null>('structure');
  const [lightbox, setLightbox] = React.useState<{ list: TestMedia[]; i: number } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const sectionRefs = React.useRef<Partial<Record<SoilBlockId, HTMLDivElement | null>>>({});

  const idx = Math.max(0, samples.findIndex((s) => s.id === sampleId));
  const s = samples[idx];

  const mediasFor = React.useCallback(
    (block: SoilBlockId) =>
      allMedias.filter((m) => m.sample_id === s?.id && m.block === block && !!m.url),
    [allMedias, s?.id],
  );

  const life = React.useMemo(() => scoreLife(s?.life_signs, s?.worm_count), [s]);
  const hasLife = (s?.life_signs?.length ?? 0) > 0 || typeof s?.worm_count === 'number';
  const lifeClass = hasLife ? LIFE_CLASS_MAP[life.klass] : null;
  const ph = typeof s?.ph_value === 'number' ? classifyPh(s.ph_value as number) : null;

  const strata: CoreStratum[] = [
    {
      id: 'structure',
      label: 'Structure',
      value: s?.structure_result ? RESULT_SHORT[s.structure_result as StructureResultId] : null,
      color: s?.structure_result ? STRUCTURE_COLOR[s.structure_result as StructureResultId] : null,
    },
    {
      id: 'texture',
      label: 'Texture',
      value: s?.texture_result ? TEXTURE_SHORT[s.texture_result as TextureResultId] : null,
      color: s?.texture_result ? TEXTURE_COLOR[s.texture_result as TextureResultId] : null,
    },
    {
      id: 'ph',
      label: 'Acidité',
      value: ph ? `pH ${(s!.ph_value as number).toFixed(1)}` : null,
      color: ph?.color ?? null,
    },
    {
      id: 'life',
      label: 'Vie du sol',
      value: lifeClass ? lifeClass.label : null,
      color: lifeClass?.color ?? null,
    },
  ];

  const missing = strata.filter((x) => !x.value).map((x) => x.label);
  const evidenceTotal = allMedias.filter((m) => m.sample_id === s?.id).length;

  const goto = (id: SoilBlockId) => {
    setActive(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // strate illuminée au scroll
  const onScroll = () => {
    const box = scrollRef.current;
    if (!box) return;
    const top = box.getBoundingClientRect().top;
    let best: SoilBlockId | null = null;
    let bestD = Infinity;
    (Object.keys(sectionRefs.current) as SoilBlockId[]).forEach((k) => {
      const el = sectionRefs.current[k];
      if (!el) return;
      const d = Math.abs(el.getBoundingClientRect().top - top - 24);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    if (best && best !== active) setActive(best);
  };

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightbox) closeSampleCore();
      if (e.key === 'ArrowRight' && !lightbox) focusSampleCore(samples[(idx + 1) % samples.length].id);
      if (e.key === 'ArrowLeft' && !lightbox)
        focusSampleCore(samples[(idx - 1 + samples.length) % samples.length].id);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [idx, samples, lightbox]);

  if (!s) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10040] flex items-stretch justify-center bg-[#1a1712]/80 backdrop-blur-sm"
      onClick={closeSampleCore}
    >
      <motion.div
        initial={{ y: 32, opacity: 0, scale: 0.985 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="m-0 flex h-full w-full flex-col overflow-hidden bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] sm:m-4 sm:h-[calc(100%-2rem)] sm:max-w-5xl sm:rounded-3xl sm:border sm:border-[hsl(var(--ds-gold))]/40 sm:shadow-2xl"
      >
        {/* En-tête */}
        <header className="flex items-center gap-3 border-b border-[hsl(var(--ds-line))] px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--ds-forest))] font-serif text-lg font-bold text-[hsl(var(--ds-cream))]">
            {s.label}
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-lg font-bold leading-tight">
              Prélèvement {s.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] opacity-65">
              <MapPin className="h-3 w-3" />
              {s.location || 'emplacement non nommé'}
            </span>
          </span>

          <span className="ml-auto flex items-center gap-1">
            <button
              onClick={() => focusSampleCore(samples[(idx - 1 + samples.length) % samples.length].id)}
              className="rounded-full border border-[hsl(var(--ds-line))] p-1.5 hover:bg-[hsl(var(--ds-forest))]/8"
              aria-label="Prélèvement précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="hidden items-center gap-1 sm:flex">
              {samples.map((o) => (
                <button
                  key={o.id}
                  onClick={() => focusSampleCore(o.id)}
                  className={`h-7 w-7 rounded-full font-serif text-[11px] font-bold transition ${
                    o.id === s.id
                      ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                      : 'bg-[hsl(var(--ds-forest))]/10 hover:bg-[hsl(var(--ds-forest))]/20'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </span>
            <button
              onClick={() => focusSampleCore(samples[(idx + 1) % samples.length].id)}
              className="rounded-full border border-[hsl(var(--ds-line))] p-1.5 hover:bg-[hsl(var(--ds-forest))]/8"
              aria-label="Prélèvement suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={closeSampleCore}
              className="ml-1 rounded-full border border-[hsl(var(--ds-line))] p-1.5 hover:bg-[hsl(var(--ds-forest))]/8"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        </header>

        {/* Corps */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Carotte */}
          <aside className="hidden shrink-0 items-center justify-center border-r border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/[0.04] px-4 py-6 md:flex md:w-[280px]">
            <SampleCoreSvg strata={strata} active={active} onSelect={goto} height={460} />
          </aside>

          {/* Sections */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
          >
            {/* mini-carotte mobile */}
            <div className="flex gap-2 overflow-x-auto md:hidden">
              {strata.map((st) => (
                <button
                  key={st.id}
                  onClick={() => goto(st.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[10.5px] font-semibold transition ${
                    active === st.id
                      ? 'border-transparent text-[hsl(var(--ds-cream))]'
                      : 'border-[hsl(var(--ds-line))]'
                  }`}
                  style={
                    active === st.id
                      ? { background: st.color || `hsl(${SOIL_BLOCKS[st.id].accent})` }
                      : undefined
                  }
                >
                  {st.label} · {st.value ?? '—'}
                </button>
              ))}
            </div>

            <Section
              id="structure"
              title="Structure"
              color={
                s.structure_result
                  ? STRUCTURE_COLOR[s.structure_result as StructureResultId]
                  : `hsl(${SOIL_BLOCKS.structure.accent})`
              }
              test={s.structure_test ? TEST_LABELS[s.structure_test] : null}
              value={s.structure_result ? RESULT_LABELS[s.structure_result as StructureResultId] : null}
              reading={s.structure_result ? READING[s.structure_result as StructureResultId] : null}
              medias={mediasFor('structure')}
              onOpenMedia={(list, i) => setLightbox({ list, i })}
              refCb={(el) => (sectionRefs.current.structure = el)}
            />

            <Section
              id="texture"
              title="Texture"
              color={
                s.texture_result
                  ? TEXTURE_COLOR[s.texture_result as TextureResultId]
                  : `hsl(${SOIL_BLOCKS.texture.accent})`
              }
              test={s.texture_test ? TEXTURE_TEST_LABELS[s.texture_test] : null}
              value={s.texture_result ? TEXTURE_LABELS[s.texture_result as TextureResultId] : null}
              reading={s.texture_result ? TEXTURE_READING[s.texture_result as TextureResultId] : null}
              medias={mediasFor('texture')}
              onOpenMedia={(list, i) => setLightbox({ list, i })}
              refCb={(el) => (sectionRefs.current.texture = el)}
            >
              {s.boudin_form && (
                <p className="mt-1 text-[11px] opacity-70">
                  Boudin : <strong>{BOUDIN_FORM_MAP[s.boudin_form].label}</strong> ·{' '}
                  {BOUDIN_FORM_MAP[s.boudin_form].clay}
                </p>
              )}
            </Section>

            <Section
              id="ph"
              title="Acidité"
              color={ph?.color ?? `hsl(${SOIL_BLOCKS.ph.accent})`}
              test={s.ph_test ? PH_TEST_LABELS[s.ph_test] : null}
              value={ph ? `pH ${(s.ph_value as number).toFixed(1)} · ${ph.short}` : null}
              reading={ph ? ph.advice : null}
              medias={mediasFor('ph')}
              onOpenMedia={(list, i) => setLightbox({ list, i })}
              refCb={(el) => (sectionRefs.current.ph = el)}
            >
              {ph && (
                <div className="mt-2">
                  <div
                    className="relative h-2.5 rounded-full"
                    style={{ background: PH_GRADIENT }}
                  >
                    <span
                      className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                      style={{
                        left: `${phPercent(s.ph_value as number)}%`,
                        background: ph.color,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] opacity-75">{ph.nutrients}</p>
                  <p className="text-[11px] opacity-60">{ph.plants}</p>
                </div>
              )}
            </Section>

            <Section
              id="life"
              title="Vie du sol"
              color={lifeClass?.color ?? `hsl(${SOIL_BLOCKS.life.accent})`}
              test={s.life_test ? LIFE_TEST_LABELS[s.life_test] : null}
              value={lifeClass ? lifeClass.label : null}
              reading={lifeClass ? lifeClass.reading : null}
              medias={mediasFor('life')}
              onOpenMedia={(list, i) => setLightbox({ list, i })}
              refCb={(el) => (sectionRefs.current.life = el)}
            >
              {typeof s.worm_count === 'number' && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {Array.from({ length: Math.min(20, s.worm_count) }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block h-1.5 w-4 rounded-full"
                      style={{ background: lifeClass?.color ?? '#8aa63b', opacity: 0.85 }}
                    />
                  ))}
                  <span className="ml-1 text-[11px] font-semibold">
                    {s.worm_count} vers · bêchée 20 × 20 × 20 cm
                  </span>
                </div>
              )}
              {(s.life_signs?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(s.life_signs as LifeSignId[]).map((sg) => (
                    <span
                      key={sg}
                      className="rounded-full border border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/8 px-2 py-0.5 text-[10px]"
                    >
                      {LIFE_SIGN_MAP[sg]?.label ?? sg}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>

        {/* Pied */}
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[hsl(var(--ds-line))] px-4 py-2.5 text-[11px]">
          <span className="inline-flex items-center gap-1 opacity-70">
            <Camera className="h-3 w-3" /> {evidenceTotal} preuve{evidenceTotal > 1 ? 's' : ''} de terrain
          </span>
          {missing.length === 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-[hsl(var(--ds-forest))]">
              <Sparkles className="h-3 w-3" /> Carotte complète
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <AlertTriangle className="h-3 w-3" /> À compléter : {missing.join(', ')}
            </span>
          )}
          <span className="ml-auto font-serif text-[11.5px] italic opacity-70">
            Étape 2 · J’analyse le sol
          </span>
        </footer>
      </motion.div>

      {lightbox && (
        <MediaLightbox
          medias={lightbox.list}
          index={lightbox.i}
          onIndex={(i) => setLightbox({ ...lightbox, i })}
          onClose={() => setLightbox(null)}
        />
      )}
    </motion.div>
  );
};

/** Hôte unique : à monter une fois dans l'espace propriété. */
export const SampleCoreDrawerHost: React.FC = () => {
  const { open, samples, sampleId, proprieteId } = useSampleDrawer();

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && sampleId && (
        <DrawerInner
          key="sample-core"
          samples={samples}
          sampleId={sampleId}
          proprieteId={proprieteId}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default SampleCoreDrawerHost;
