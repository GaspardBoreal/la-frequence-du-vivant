import { useCallback, useEffect, useRef, useState } from 'react';
import type { PrintPrepStep } from './PrintPreparationOverlay';
import { originalUrl } from './printImageUrl';

/** Timeout d'UNE tentative de chargement (ms). */
const ATTEMPT_TIMEOUT = 8000;
/** Nombre total de tentatives par image. */
const MAX_ATTEMPTS = 3;
const BACKOFF = [600, 1500, 3000];
const CONCURRENCY = 6;
/** Nombre de re-scans DOM (des images peuvent être montées après coup). */
const MAX_RESCANS = 3;

type Phase = 'idle' | 'collect' | 'images' | 'retry' | 'incomplete' | 'layout' | 'print';

interface PrintProgressState {
  portraitLoaded: number;
  portraitTotal: number;
  proofsLoaded: number;
  proofsTotal: number;
  phase: Phase;
  /** Images définitivement en échec après tous les essais. */
  missing: number;
  /** Images en cours de reprise. */
  retrying: number;
  attempt: number;
}

const initialState: PrintProgressState = {
  portraitLoaded: 0,
  portraitTotal: 0,
  proofsLoaded: 0,
  proofsTotal: 0,
  phase: 'idle',
  missing: 0,
  retrying: 0,
  attempt: 1,
};

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const isReady = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;

/** Attend le chargement puis le décodage effectif d'une image (une tentative). */
function loadOnce(img: HTMLImageElement): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      if (!ok) {
        resolve(false);
        return;
      }
      // « load » ne garantit pas la rasterisation : on force le décodage.
      const decode = (img as HTMLImageElement).decode?.();
      if (decode) decode.then(() => resolve(true)).catch(() => resolve(isReady(img)));
      else resolve(true);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    const timer = window.setTimeout(() => finish(false), ATTEMPT_TIMEOUT);

    if (isReady(img)) {
      finish(true);
      return;
    }
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
  });
}

/** Force le rechargement d'une image (cache-buster, ou repli sur l'original). */
function reloadWith(img: HTMLImageElement, url: string) {
  const current = img.getAttribute('src') ?? '';
  if (current === url) {
    // même URL : on force un vrai re-fetch
    img.setAttribute('src', '');
  }
  img.setAttribute('src', url);
}

function bustedUrl(url: string, attempt: number): string {
  if (!url || /^(data|blob):/i.test(url)) return url;
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set('_r', String(attempt));
    return u.toString();
  } catch {
    return url + (url.includes('?') ? '&' : '?') + '_r=' + attempt;
  }
}

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
 * Orchestre l'impression d'un portail body : préchargement GARANTI des images
 * (retries + repli sur l'original + décodage), puis window.print.
 * Aucune impression automatique tant qu'une photographie manque : l'utilisateur
 * choisit explicitement de réessayer ou d'imprimer quand même.
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
  /** Images qui n'ont pas abouti, conservées pour la reprise manuelle. */
  const failedRef = useRef<HTMLImageElement[]>([]);
  const originalSrcRef = useRef(new WeakMap<HTMLImageElement, string>());
  const runIdRef = useRef(0);

  if (typeof document !== 'undefined' && !portalRef.current) {
    const existing = document.getElementById(portalId) as HTMLDivElement | null;
    portalRef.current =
      existing ?? Object.assign(document.createElement('div'), { id: portalId });
    if (!existing) document.body.appendChild(portalRef.current);
  }

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    runIdRef.current += 1;
    failedRef.current = [];
    setState(initialState);
    onDone();
  }, [onDone]);

  const doPrint = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'layout' }));
    await nextFrame();
    if (cancelledRef.current) return;
    setState((s) => ({ ...s, phase: 'print' }));
    await nextFrame();
    if (cancelledRef.current) return;
    window.print();
  }, []);

  /** Charge un lot d'images avec reprises ; renvoie la liste des échecs. */
  const loadBatch = useCallback(
    async (
      imgs: HTMLImageElement[],
      onOne: (img: HTMLImageElement, ok: boolean) => void,
      runId: number,
    ): Promise<HTMLImageElement[]> => {
      const failed: HTMLImageElement[] = [];
      await runPool(imgs, CONCURRENCY, async (img) => {
        if (!originalSrcRef.current.has(img)) {
          originalSrcRef.current.set(img, img.getAttribute('src') ?? '');
        }
        const src = originalSrcRef.current.get(img) ?? '';
        // Impression : jamais de lazy-loading, décodage synchrone.
        img.loading = 'eager';
        try {
          img.decoding = 'sync';
        } catch {
          /* noop */
        }

        let ok = false;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS && !ok; attempt++) {
          if (cancelledRef.current || runId !== runIdRef.current) return;
          if (attempt > 1) {
            setState((s) => ({ ...s, phase: 'retry', attempt }));
            await sleep(BACKOFF[Math.min(attempt - 2, BACKOFF.length - 1)]);
            if (cancelledRef.current || runId !== runIdRef.current) return;
            // Tentative 2 : cache-buster ; tentative 3 : repli sur l'original non transformé.
            const url = attempt === 2 ? bustedUrl(src, attempt) : bustedUrl(originalUrl(src), attempt);
            reloadWith(img, url);
          }
          ok = await loadOnce(img);
        }
        if (!ok) failed.push(img);
        onOne(img, ok);
      });
      return failed;
    },
    [],
  );

  const runLoading = useCallback(
    async (runId: number, only?: HTMLImageElement[]) => {
      const node = portalRef.current;
      if (!node) return;

      let pool: HTMLImageElement[] =
        only ?? Array.from(node.querySelectorAll('img'));
      const seen = new Set<HTMLImageElement>(pool);
      const allFailed: HTMLImageElement[] = [];

      const countOf = (imgs: HTMLImageElement[]) => {
        const proofs = imgs.filter((i) => !!i.closest('.combined-print-plate'));
        return { proofs: proofs.length, portrait: imgs.length - proofs.length };
      };

      const first = countOf(pool);
      setState((s) => ({
        ...s,
        phase: 'images',
        portraitTotal: only ? s.portraitTotal : first.portrait,
        proofsTotal: only ? s.proofsTotal : first.proofs,
        portraitLoaded: only ? s.portraitLoaded : 0,
        proofsLoaded: only ? s.proofsLoaded : 0,
        missing: 0,
      }));

      for (let round = 0; round <= MAX_RESCANS; round++) {
        if (pool.length === 0) break;
        const failed = await loadBatch(
          pool,
          (img, ok) => {
            const isProof = !!img.closest('.combined-print-plate');
            setState((s) => ({
              ...s,
              portraitLoaded: !isProof && ok ? s.portraitLoaded + 1 : s.portraitLoaded,
              proofsLoaded: isProof && ok ? s.proofsLoaded + 1 : s.proofsLoaded,
            }));
          },
          runId,
        );
        if (cancelledRef.current || runId !== runIdRef.current) return;
        allFailed.push(...failed);

        if (only) break;
        // Re-scan : des images ont pu être montées entre-temps (layout progressif).
        await nextFrame();
        const fresh = Array.from(node.querySelectorAll('img')).filter((i) => !seen.has(i));
        fresh.forEach((i) => seen.add(i));
        if (fresh.length === 0) break;
        const extra = countOf(fresh);
        setState((s) => ({
          ...s,
          portraitTotal: s.portraitTotal + extra.portrait,
          proofsTotal: s.proofsTotal + extra.proofs,
        }));
        pool = fresh;
      }

      if (cancelledRef.current || runId !== runIdRef.current) return;

      failedRef.current = allFailed;
      if (allFailed.length > 0) {
        setState((s) => ({ ...s, phase: 'incomplete', missing: allFailed.length }));
        return;
      }
      setState((s) => ({ ...s, missing: 0 }));
      await doPrint();
    },
    [doPrint, loadBatch],
  );

  const retryMissing = useCallback(() => {
    const imgs = failedRef.current;
    if (imgs.length === 0) return;
    const runId = ++runIdRef.current;
    // On repart des URL d'origine, sans transformation, pour maximiser les chances.
    imgs.forEach((img) => {
      const src = originalSrcRef.current.get(img) ?? img.getAttribute('src') ?? '';
      originalSrcRef.current.set(img, originalUrl(src));
    });
    setState((s) => ({ ...s, phase: 'retry', missing: 0, retrying: imgs.length, attempt: 1 }));
    void runLoading(runId, imgs).then(() => setState((s) => ({ ...s, retrying: 0 })));
  }, [runLoading]);

  const printAnyway = useCallback(() => {
    void doPrint();
  }, [doPrint]);

  useEffect(() => {
    if (!active) {
      setState(initialState);
      failedRef.current = [];
      return;
    }
    cancelledRef.current = false;
    const runId = ++runIdRef.current;
    document.body.classList.add(bodyClass);
    setState({ ...initialState, phase: 'collect' });

    const run = async () => {
      if (prepare) {
        try {
          await prepare();
        } catch {
          /* impression possible malgré tout */
        }
      }
      if (cancelledRef.current || runId !== runIdRef.current) return;

      // Laisse React monter le portail avant de collecter les images
      await nextFrame();
      await nextFrame();
      if (cancelledRef.current || runId !== runIdRef.current) return;
      await runLoading(runId);
    };
    void run();

    const onAfter = () => onDone();
    window.addEventListener('afterprint', onAfter);
    return () => {
      cancelledRef.current = true;
      runIdRef.current += 1;
      failedRef.current = [];
      document.body.classList.remove(bodyClass);
      window.removeEventListener('afterprint', onAfter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ----- Dérivation des étapes affichées -----
  const steps: PrintPrepStep[] = [];
  const phaseRank = {
    idle: 0,
    collect: 1,
    images: 2,
    retry: 2,
    incomplete: 2,
    layout: 3,
    print: 4,
  }[state.phase];

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
  if (state.phase === 'retry') {
    steps.push({
      key: 'retry',
      label: `Reprise des photographies récalcitrantes (essai ${state.attempt})`,
      status: 'doing',
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
    /** Rétro-compat : nombre de photos absentes. */
    skipped: state.missing,
    missing: state.missing,
    incomplete: state.phase === 'incomplete',
    loaded: loadedImgs,
    total: totalImgs,
    cancel,
    retryMissing,
    printAnyway,
    /** Rétro-compat : permet d'utiliser le retour comme un ref. */
    get current() {
      return portalRef.current;
    },
  };
}
