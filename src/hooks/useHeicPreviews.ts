import { useEffect, useRef, useState } from 'react';
import { isHeic, isSafariIOS, convertHeicForPreview } from '@/utils/heicConverter';

export type PreviewStatus = 'pending' | 'converting' | 'ready' | 'error';

export interface PreviewEntry {
  url: string | null;
  status: PreviewStatus;
  isHeic: boolean;
}

interface InternalEntry extends PreviewEntry {
  cancelled?: boolean;
}

/**
 * Generates browser-displayable thumbnail URLs for a list of files,
 * including HEIC/HEIF files which require WASM conversion on most browsers.
 *
 * - Non-HEIC files: instant `URL.createObjectURL`.
 * - HEIC + Safari iOS: instant (Safari reads HEIC natively).
 * - HEIC + other browsers: queued (1 at a time) and converted via heic-to.
 *
 * Cleans up object URLs automatically when files are removed or component unmounts.
 */
export function useHeicPreviews(files: File[]) {
  const [, force] = useState(0);
  const cacheRef = useRef<Map<File, InternalEntry>>(new Map());
  const queueRef = useRef<Array<() => Promise<void>>>([]);
  const runningRef = useRef(false);

  // Sequential drain: at most one HEIC conversion at a time
  const drain = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    while (queueRef.current.length > 0) {
      const job = queueRef.current.shift();
      if (job) {
        try {
          await job();
        } catch (e) {
          console.warn('[useHeicPreviews] job error', e);
        }
      }
    }
    runningRef.current = false;
  };

  useEffect(() => {
    const cache = cacheRef.current;
    const currentSet = new Set(files);

    // 1) Cleanup entries for files that are no longer in the list
    for (const [file, entry] of cache.entries()) {
      if (!currentSet.has(file)) {
        entry.cancelled = true;
        if (entry.url) {
          try { URL.revokeObjectURL(entry.url); } catch { }
        }
        cache.delete(file);
      }
    }

    // 2) Process new files
    let mutated = false;
    for (const file of files) {
      if (cache.has(file)) continue;

      // Initial status
      const entry: InternalEntry = {
        url: null,
        status: 'pending',
        isHeic: false,
      };
      cache.set(file, entry);
      mutated = true;

      // Decide strategy
      void (async () => {
        const heic = await isHeic(file);
        entry.isHeic = heic;

        // Fast path: non-HEIC OR Safari iOS (native HEIC support)
        if (!heic || isSafariIOS()) {
          if (entry.cancelled) return;
          try {
            entry.url = URL.createObjectURL(file);
            entry.status = 'ready';
          } catch {
            entry.status = 'error';
          }
          force((n) => n + 1);
          return;
        }

        // HEIC on non-iOS Safari: queue conversion
        entry.status = 'pending';
        force((n) => n + 1);

        queueRef.current.push(async () => {
          if (entry.cancelled) return;
          entry.status = 'converting';
          force((n) => n + 1);
          const converted = await convertHeicForPreview(file);
          if (entry.cancelled) {
            // If file was removed during conversion, drop the result
            return;
          }
          if (converted) {
            entry.url = URL.createObjectURL(converted);
            entry.status = 'ready';
          } else {
            entry.status = 'error';
          }
          force((n) => n + 1);
        });

        void drain();
      })();
    }

    if (mutated) force((n) => n + 1);
    // We deliberately depend on the array reference; callers should keep
    // the same File[] reference until they mutate the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const entry of cacheRef.current.values()) {
        entry.cancelled = true;
        if (entry.url) {
          try { URL.revokeObjectURL(entry.url); } catch { }
        }
      }
      cacheRef.current.clear();
    };
  }, []);

  const getPreview = (file: File): PreviewEntry => {
    const e = cacheRef.current.get(file);
    if (!e) return { url: null, status: 'pending', isHeic: false };
    return { url: e.url, status: e.status, isHeic: e.isHeic };
  };

  return { getPreview };
}
