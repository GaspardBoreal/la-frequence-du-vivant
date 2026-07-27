import { useCallback, useEffect, useRef, useState } from 'react';
import type { PrintPrepStep } from './PrintPreparationOverlay';

const PER_IMAGE_TIMEOUT = 4000;
const GLOBAL_TIMEOUT = 15000;
const CONCURRENCY = 6;

interface PrintProgressState {
  portraitLoaded: number;
  portraitTotal: number;
  proofsLoaded: number;
  proofsTotal: number;
  phase: 'collect' | 'images' | 'layout' | 'print' | 'idle';
  skipped: number;
}

const initialState: PrintProgressState = {
  portraitLoaded: 0,
  portraitTotal: 0,
  proofsLoaded: 0,
  proofsTotal: 0,
  phase: 'idle',
  skipped: 0,
};

const waitImage = (img: HTMLImageElement) =>
  new Promise<boolean>((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve(true);
      return;
    }
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve(ok);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    const timer = window.setTimeout(() => finish(false), PER_IMAGE_TIMEOUT);
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
  });

/** Exécute des tâches avec une concurrence plafonnée. */
async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * Orchestre l'impression d'un portail body : préchargement suivi des images,
 * timeouts (jamais bloquant), window.print + cleanup.
 * bodyClass isole l'impression (masque le reste de l'app via CSS @media print).
 */
export function usePrintCombined(opts: {
  active: boolean;
  portalId: string;
  bodyClass: string;
  onDone: () => void;
  /** Tâche asynchrone préalable (ex : rafraîchir des URL signées). */
  prepare?: () => Promise<unknown>;
  /** Libellé de l'étape préalable. */
  prepareLabel?: string;
}) {
  const { active, portalId, bodyClass, onDone, prepare, prepareLabel } = opts;
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<PrintProgressState>(initialState);
  const cancelledRef = useRef(false);

  if (typeof document !== 'undefined' && !portalRef.current) {
    const existing = document.getElementById(portalId) as HTMLDivElement | null;
    portalRef.current =
      existing ?? Object.assign(document.createElement('div'), { id: portalId });
    if (!existing) document.body.appendChild(portalRef.current);
  }

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setState(initialState);
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (!active) {
      setState(initialState);
      return;
    }
    cancelledRef.current = false;
    document.body.classList.add(bodyClass);
    setState({ ...initialState, phase: 'collect' });

    const globalTimer = window.setTimeout(() => {
      /* garde-fou : ne jamais rester bloqué */
      if (!cancelledRef.current) {
        cancelledRef.current = true;
        window.print();
      }
    }, GLOBAL_TIMEOUT);

    const run = async () => {
      if (prepare) {
        try {
          await prepare();
        } catch {
          /* impression possible malgré tout */
        }
      }
      if (cancelledRef.current) return;

      // Laisse React monter le portail avant de collecter les images
      await nextFrame();
      const node = portalRef.current;
      if (!node || cancelledRef.current) return;

      const imgs = Array.from(node.querySelectorAll('img'));
      const proofs = imgs.filter((img) => !!img.closest('.combined-print-plate'));
      const portrait = imgs.filter((img) => !img.closest('.combined-print-plate'));

      setState((s) => ({
        ...s,
        phase: 'images',
        portraitTotal: portrait.length,
        proofsTotal: proofs.length,
      }));

      let skipped = 0;
      const load = (group: 'portrait' | 'proofs') => async (img: HTMLImageElement) => {
        const ok = await waitImage(img);
        if (!ok) skipped += 1;
        setState((s) => ({
          ...s,
          skipped: skipped,
          portraitLoaded: group === 'portrait' ? s.portraitLoaded + 1 : s.portraitLoaded,
          proofsLoaded: group === 'proofs' ? s.proofsLoaded + 1 : s.proofsLoaded,
        }));
      };

      await Promise.all([
        runPool(portrait, CONCURRENCY, load('portrait')),
        runPool(proofs, CONCURRENCY, load('proofs')),
      ]);
      if (cancelledRef.current) return;

      setState((s) => ({ ...s, phase: 'layout' }));
      await nextFrame();
      if (cancelledRef.current) return;

      setState((s) => ({ ...s, phase: 'print' }));
      await nextFrame();
      if (cancelledRef.current) return;
      window.clearTimeout(globalTimer);
      window.print();
    };
    run();

    const onAfter = () => onDone();
    window.addEventListener('afterprint', onAfter);
    return () => {
      cancelledRef.current = true;
      window.clearTimeout(globalTimer);
      document.body.classList.remove(bodyClass);
      window.removeEventListener('afterprint', onAfter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ----- Dérivation des étapes affichées -----
  const steps: PrintPrepStep[] = [];
  const phaseRank = { idle: 0, collect: 1, images: 2, layout: 3, print: 4 }[state.phase];

  if (prepare) {
    steps.push({
      key: 'prepare',
      label: prepareLabel ?? 'Réveil des documents',
      status: phaseRank > 1 ? 'done' : 'doing',
    });
  }
  steps.push({
    key: 'portrait',
    label: 'Rassemblement des photographies du portrait',
    status:
      phaseRank < 2
        ? 'todo'
        : state.portraitTotal > 0 && state.portraitLoaded < state.portraitTotal
          ? 'doing'
          : 'done',
    loaded: state.portraitLoaded,
    total: state.portraitTotal,
  });
  if (state.proofsTotal > 0 || phaseRank < 2) {
    steps.push({
      key: 'proofs',
      label: 'Réveil des preuves de terrain',
      status:
        phaseRank < 2
          ? 'todo'
          : state.proofsTotal > 0 && state.proofsLoaded < state.proofsTotal
            ? 'doing'
            : 'done',
      loaded: state.proofsLoaded,
      total: state.proofsTotal,
    });
  }
  steps.push({
    key: 'layout',
    label: 'Mise en page des planches A4',
    status: phaseRank > 3 ? 'done' : phaseRank === 3 ? 'doing' : 'todo',
  });
  steps.push({
    key: 'print',
    label: "Encre et papier — ouverture de l'aperçu",
    status: phaseRank === 4 ? 'doing' : 'todo',
  });

  const totalImgs = state.portraitTotal + state.proofsTotal;
  const loadedImgs = state.portraitLoaded + state.proofsLoaded;
  const imageRatio = totalImgs > 0 ? loadedImgs / totalImgs : phaseRank >= 3 ? 1 : 0;
  const progress =
    phaseRank === 0
      ? 0
      : phaseRank === 1
        ? 0.06
        : phaseRank === 2
          ? 0.1 + imageRatio * 0.75
          : phaseRank === 3
            ? 0.92
            : 1;

  return {
    portalRef,
    progress,
    steps,
    skipped: state.skipped,
    cancel,
    /** Rétro-compat : permet d'utiliser le retour comme un ref. */
    get current() {
      return portalRef.current;
    },
  };
}
