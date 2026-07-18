import QRCode from 'qrcode';
import type { PickedPhoto, EventSnapshot } from './photoPicker';

export type Theme = 'frequence' | 'marches';

export interface RenderOptions {
  width: number;
  height: number;
  theme: Theme;
  photos: PickedPhoto[];
  event?: EventSnapshot | null;
  category: string;
  ambiance: string;
  qrTarget: string;
  seed: number;
}

const PALETTES: Record<string, { gradient: string[]; ink: string; accent: string; paper: string }> = {
  dawn: { gradient: ['#3a4d3a', '#87a878', '#e8c07a', '#faf8f3'], ink: '#1a3c2a', accent: '#e8c07a', paper: '#faf8f3' },
  day: { gradient: ['#1a3c2a', '#5a8a5c', '#a0c49d', '#faf8f3'], ink: '#0d2818', accent: '#c9a84c', paper: '#faf8f3' },
  dusk: { gradient: ['#2b1a3a', '#87466e', '#e8a87c', '#f5e6c8'], ink: '#1a1030', accent: '#e88aab', paper: '#f5e6c8' },
  night: { gradient: ['#050a1a', '#0d1b2a', '#1b4332', '#2dd4a8'], ink: '#e8f0f8', accent: '#73ffb8', paper: '#0d1b2a' },
  any: { gradient: ['#1a3c2a', '#87a878', '#e8c07a', '#faf8f3'], ink: '#0d2818', accent: '#c9a84c', paper: '#faf8f3' },
};

// Mulberry32 PRNG
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawGradient(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[]) {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // radial soft halo
  const r = ctx.createRadialGradient(w * 0.7, h * 0.35, 0, w * 0.7, h * 0.35, Math.max(w, h) * 0.7);
  r.addColorStop(0, 'rgba(255,255,255,0.15)');
  r.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, w, h);
}

function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity = 18) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * intensity;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function drawImageInBlob(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
) {
  ctx.save();
  // soft shadow
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = radiusX * 0.15;
  ctx.shadowOffsetY = radiusY * 0.05;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radiusX, radiusY, rotation, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, radiusX, radiusY, rotation, 0, Math.PI * 2);
  ctx.clip();
  // cover-fit
  const boxW = radiusX * 2;
  const boxH = radiusY * 2;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(boxW / iw, boxH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

function formatDateFR(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatGps(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return '';
  return `${lat.toFixed(4)}°N · ${lng.toFixed(4)}°E`;
}

function wordmark(theme: Theme): string {
  return theme === 'frequence' ? 'La Fréquence du Vivant' : 'Les Marches du Vivant';
}

export async function renderWallpaper(opts: RenderOptions): Promise<HTMLCanvasElement> {
  const { width, height, theme, photos, event, category, ambiance, qrTarget, seed } = opts;
  const rng = makeRng(seed);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const pal = PALETTES[ambiance] || PALETTES.any;

  // Background
  drawGradient(ctx, width, height, pal.gradient);

  // Preload images
  const imgs = (await Promise.all(photos.slice(0, 5).map((p) => loadImage(p.url)))).filter(
    (x): x is HTMLImageElement => !!x,
  );
  if (imgs.length === 0) {
    // fallback: text-only card
  }

  const isPortrait = height > width;
  const cx = width * (isPortrait ? 0.5 : 0.42);
  const cy = height * (isPortrait ? 0.38 : 0.45);
  const heroR = Math.min(width, height) * (isPortrait ? 0.35 : 0.32);

  // Hero
  ctx.fillStyle = pal.paper;
  if (imgs[0]) drawImageInBlob(ctx, imgs[0], cx, cy, heroR, heroR, 0);

  // Satellites
  const satPositions: [number, number, number, number][] = isPortrait
    ? [
        [width * 0.78, height * 0.22, heroR * 0.45, heroR * 0.45],
        [width * 0.18, height * 0.62, heroR * 0.55, heroR * 0.45],
        [width * 0.82, height * 0.58, heroR * 0.4, heroR * 0.4],
        [width * 0.35, height * 0.82, heroR * 0.42, heroR * 0.38],
      ]
    : [
        [width * 0.78, height * 0.25, heroR * 0.5, heroR * 0.42],
        [width * 0.82, height * 0.72, heroR * 0.45, heroR * 0.4],
        [width * 0.2, height * 0.78, heroR * 0.5, heroR * 0.42],
        [width * 0.62, height * 0.85, heroR * 0.38, heroR * 0.32],
      ];

  for (let i = 1; i < imgs.length && i - 1 < satPositions.length; i++) {
    const [sx, sy, rx, ry] = satPositions[i - 1];
    const jx = sx + (rng() - 0.5) * width * 0.02;
    const jy = sy + (rng() - 0.5) * height * 0.02;
    const rot = (rng() - 0.5) * 0.4;
    drawImageInBlob(ctx, imgs[i], jx, jy, rx, ry, rot);
  }

  // Signature panel (bottom)
  const panelH = Math.round(height * 0.14);
  const panelY = height - panelH;
  const grad2 = ctx.createLinearGradient(0, panelY, 0, height);
  grad2.addColorStop(0, 'rgba(0,0,0,0)');
  grad2.addColorStop(1, ambiance === 'night' ? 'rgba(0,0,0,0.75)' : 'rgba(13,40,24,0.55)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, panelY, width, panelH);

  const textColor = ambiance === 'night' || ambiance === 'dusk' ? '#f5e6c8' : '#faf8f3';
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';

  const padX = Math.round(width * 0.045);
  const baseY = panelY + panelH * 0.28;

  // Wordmark
  const markSize = Math.round(height * 0.032);
  ctx.font = `italic 500 ${markSize}px "Crimson Text", Georgia, serif`;
  ctx.fillText(wordmark(theme), padX, baseY);

  // Accent bar under wordmark
  ctx.fillStyle = pal.accent;
  const markMetrics = ctx.measureText(wordmark(theme));
  ctx.fillRect(padX, baseY + markSize * 1.15, markMetrics.width, Math.max(2, height * 0.002));

  // Event details right side
  ctx.fillStyle = textColor;
  const smallSize = Math.round(height * 0.018);
  ctx.font = `400 ${smallSize}px "Libre Baskerville", Georgia, serif`;
  const lines: string[] = [];
  if (event?.title) lines.push(event.title);
  const meta: string[] = [];
  if (event?.date) meta.push(formatDateFR(event.date));
  if (event?.commune) meta.push(event.commune);
  if (meta.length) lines.push(meta.join(' · '));
  const gps = formatGps(event?.lat ?? null, event?.lng ?? null);
  if (gps) lines.push(gps);
  if (!event) {
    lines.push(category === 'species' ? 'Constellation vivante' : 'Territoires en éveil');
    lines.push('France · une mosaïque de marches');
  }

  const rightX = width - padX;
  lines.forEach((l, i) => {
    const m = ctx.measureText(l);
    ctx.fillText(l, rightX - m.width, baseY + i * smallSize * 1.5);
  });

  // QR code bottom-right
  try {
    const qrSize = Math.round(Math.min(width, height) * 0.06);
    const qrDataUrl = await QRCode.toDataURL(qrTarget, {
      margin: 1,
      color: { dark: pal.ink, light: pal.paper },
      width: qrSize * 2,
    });
    const qrImg = await loadImage(qrDataUrl);
    if (qrImg) {
      const qx = width - qrSize - padX * 0.4;
      const qy = height - qrSize - padX * 0.4;
      // white rounded backdrop
      ctx.fillStyle = pal.paper;
      const pad = qrSize * 0.08;
      ctx.fillRect(qx - pad, qy - pad, qrSize + pad * 2, qrSize + pad * 2);
      ctx.drawImage(qrImg, qx, qy, qrSize, qrSize);
    }
  } catch {}

  // Paper grain
  try {
    drawGrain(ctx, width, height, 12);
  } catch {}

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      type,
      quality,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
