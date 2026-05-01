/**
 * Robust HEIC/HEIF detection & conversion.
 *
 * Strategy:
 *   1. Detect HEIC by MIME, extension, OR magic bytes (most reliable).
 *   2. Try `heic-to` (modern, fast, WASM, well maintained).
 *   3. On Safari iOS, fallback to native canvas decode (Safari reads HEIC natively).
 *   4. Fallback to legacy `heic2any`.
 *   5. If all fail, throw `HEIC_CONVERSION_FAILED` — never upload an unreadable file.
 */

const HEIC_BRANDS = /^(heic|heix|hevc|hevx|mif1|msf1|heim|heis|hevm|hevs|avif|avis)/;

// ─── Detection ───

export function hasHeicExtension(file: File): boolean {
  const n = file.name.toLowerCase();
  return n.endsWith('.heic') || n.endsWith('.heif');
}

export function hasHeicMime(file: File): boolean {
  const m = (file.type || '').toLowerCase();
  return m.includes('heic') || m.includes('heif');
}

/**
 * Read first 12 bytes and check ISO-BMFF `ftyp` brand.
 * This is the only reliable way when iOS shares as octet-stream
 * (e.g. via WhatsApp, Drive, Files app).
 */
export async function isHeicByMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 12);
    const buf = new Uint8Array(await slice.arrayBuffer());
    if (buf.length < 12) return false;
    const ftyp = String.fromCharCode(buf[4], buf[5], buf[6], buf[7]);
    if (ftyp !== 'ftyp') return false;
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]).toLowerCase();
    return HEIC_BRANDS.test(brand);
  } catch {
    return false;
  }
}

export async function isHeic(file: File): Promise<boolean> {
  if (hasHeicMime(file)) return true;
  if (hasHeicExtension(file)) return true;
  // Last resort: sniff magic bytes (catches octet-stream from WhatsApp/Drive)
  return await isHeicByMagicBytes(file);
}

// ─── Environment helpers ───

function isSafariIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS && isSafari;
}

function buildOutFile(originalName: string, blob: Blob): File {
  const base = originalName.replace(/\.(heic|heif)$/i, '');
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

function adaptiveTimeoutMs(file: File): number {
  // 15s/Mo, plancher 15s, plafond 60s
  const mb = file.size / (1024 * 1024);
  return Math.min(60000, Math.max(15000, Math.round(mb * 15000)));
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timeout (${ms}ms)`)), ms)),
  ]);
}

// ─── Conversion strategies ───

async function convertWithHeicTo(file: File, quality = 0.9): Promise<File> {
  const { heicTo } = await import('heic-to');
  const blob = await heicTo({ blob: file, type: 'image/jpeg', quality });
  return buildOutFile(file.name, blob);
}

async function convertWithHeic2Any(file: File, quality = 0.9): Promise<File> {
  const mod = await import('heic2any');
  const heic2any = (mod as any).default || mod;
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality });
  const blob = Array.isArray(out) ? out[0] : out;
  return buildOutFile(file.name, blob as Blob);
}

/**
 * Safari iOS reads HEIC natively. We can decode via <img> + canvas.
 * Much faster than WASM on Apple devices.
 */
async function convertViaCanvas(file: File, quality = 0.9): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Native HEIC decode failed'));
      im.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, 'image/jpeg', quality),
    );
    if (!blob) throw new Error('Canvas toBlob returned null');
    return buildOutFile(file.name, blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─── Public API ───

export class HeicConversionError extends Error {
  code = 'HEIC_CONVERSION_FAILED' as const;
  attempts: { strategy: string; error: string }[];
  constructor(attempts: { strategy: string; error: string }[]) {
    super('Conversion HEIC impossible — toutes les stratégies ont échoué');
    this.name = 'HeicConversionError';
    this.attempts = attempts;
  }
}

/**
 * Convert HEIC/HEIF to JPEG using a cascade of strategies.
 * Returns the original file unchanged if it's not HEIC.
 * Throws `HeicConversionError` if conversion is needed but impossible.
 */
export async function convertHeicToJpeg(
  file: File,
  opts: { quality?: number } = {},
): Promise<File> {
  if (!(await isHeic(file))) return file;

  const quality = opts.quality ?? 0.9;
  const timeoutMs = adaptiveTimeoutMs(file);
  const attempts: { strategy: string; error: string }[] = [];

  console.log(`🔄 [HEIC] Conversion ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} Mo)`);

  // Stratégie 1 : heic-to (moderne)
  try {
    const out = await withTimeout(convertWithHeicTo(file, quality), timeoutMs, 'heic-to');
    console.log(`✅ [HEIC] heic-to OK (${file.name})`);
    return out;
  } catch (e: any) {
    attempts.push({ strategy: 'heic-to', error: e?.message || String(e) });
    console.warn(`⚠️ [HEIC] heic-to KO: ${e?.message}`);
  }

  // Stratégie 2 : Safari iOS → canvas natif
  if (isSafariIOS()) {
    try {
      const out = await withTimeout(convertViaCanvas(file, quality), timeoutMs, 'canvas-native');
      console.log(`✅ [HEIC] canvas natif OK (${file.name})`);
      return out;
    } catch (e: any) {
      attempts.push({ strategy: 'canvas-native', error: e?.message || String(e) });
      console.warn(`⚠️ [HEIC] canvas natif KO: ${e?.message}`);
    }
  }

  // Stratégie 3 : heic2any (fallback historique)
  try {
    const out = await withTimeout(convertWithHeic2Any(file, quality), timeoutMs, 'heic2any');
    console.log(`✅ [HEIC] heic2any OK (${file.name})`);
    return out;
  } catch (e: any) {
    attempts.push({ strategy: 'heic2any', error: e?.message || String(e) });
    console.warn(`⚠️ [HEIC] heic2any KO: ${e?.message}`);
  }

  console.error('❌ [HEIC] Toutes les stratégies ont échoué', attempts);
  throw new HeicConversionError(attempts);
}

/**
 * Fast preview-only conversion: low quality, single strategy, short timeout.
 * Used to display a thumbnail in upload UIs without blocking the user for 30s.
 * Returns null on failure (caller falls back to a placeholder).
 */
export async function convertHeicForPreview(file: File): Promise<File | null> {
  if (!(await isHeic(file))) return file;
  const PREVIEW_TIMEOUT = 12000;

  // Safari iOS: native canvas decode is by far the fastest path
  if (isSafariIOS()) {
    try {
      return await withTimeout(convertViaCanvas(file, 0.7), PREVIEW_TIMEOUT, 'preview-canvas');
    } catch (e) {
      console.warn('[HEIC preview] canvas natif KO', e);
    }
  }

  // Otherwise heic-to (WASM) at low quality
  try {
    return await withTimeout(convertWithHeicTo(file, 0.6), PREVIEW_TIMEOUT, 'preview-heic-to');
  } catch (e) {
    console.warn('[HEIC preview] heic-to KO', e);
    return null;
  }
}

/** Friendly message shown to walkers when conversion fails. */
export const HEIC_USER_MESSAGE =
  "Cette photo iPhone (HEIC) n'a pas pu être convertie. " +
  'Astuce : sur votre iPhone, allez dans Réglages → Appareil photo → Formats, et choisissez "Le plus compatible" pour prendre des photos en JPEG.';

