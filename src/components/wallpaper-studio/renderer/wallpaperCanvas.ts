import QRCode from 'qrcode';
import type { PickedPhoto, EventSnapshot } from './photoPicker';

export type Theme = 'frequence' | 'marches';
export type Variant = 'organic' | 'editorial' | 'diptyque' | 'constellation';
export type TitleScale = 'small' | 'medium' | 'large';

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
  variant?: Variant;
  titleScale?: TitleScale;
  ctaEnabled?: boolean;
  kingdomLabel?: string;
}

interface Palette {
  gradient: string[];
  ink: string;
  accent: string;
  paper: string;
  deep: string;
  gold: string;
}

const PALETTES: Record<string, Palette> = {
  dawn:  { gradient: ['#1a1810', '#3a2d1a', '#87694a', '#e8c07a'], ink: '#1a3c2a', accent: '#e8c07a', paper: '#faf8f3', deep: '#0d0a06', gold: '#e8c07a' },
  day:   { gradient: ['#0a1a10', '#1a3c2a', '#3a5a3a', '#c9a84c'], ink: '#0d2818', accent: '#c9a84c', paper: '#faf8f3', deep: '#050d08', gold: '#d4b060' },
  dusk:  { gradient: ['#160820', '#2b1a3a', '#5a2a4a', '#e88aab'], ink: '#1a1030', accent: '#e88aab', paper: '#f5e6c8', deep: '#08040f', gold: '#e8a87c' },
  night: { gradient: ['#020408', '#050a1a', '#0d1b2a', '#1b4332'], ink: '#e8f0f8', accent: '#73ffb8', paper: '#f5e6c8', deep: '#010204', gold: '#c9a84c' },
  any:   { gradient: ['#0a1a10', '#1a3c2a', '#3a5a3a', '#c9a84c'], ink: '#0d2818', accent: '#c9a84c', paper: '#faf8f3', deep: '#050d08', gold: '#d4b060' },
};

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

/** Jardin-inspired backdrop: deep base + golden vertical waves + particles + warm halo. */
function drawJardinBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pal: Palette,
  rng: () => number,
) {
  // Deep vertical gradient base
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, pal.deep);
  base.addColorStop(0.55, pal.gradient[1]);
  base.addColorStop(1, pal.deep);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Warm off-center halo
  const halo = ctx.createRadialGradient(w * 0.78, h * 0.35, 0, w * 0.78, h * 0.35, Math.max(w, h) * 0.7);
  halo.addColorStop(0, `${pal.gold}55`);
  halo.addColorStop(0.4, `${pal.gold}18`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  // Vertical golden Bézier waves
  const waveCount = 5 + Math.floor(rng() * 3);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < waveCount; i++) {
    const x = (i + rng() * 0.4) * (w / waveCount);
    const amp = w * (0.04 + rng() * 0.08);
    const thickness = Math.max(1, h * (0.001 + rng() * 0.004));
    const opacity = 0.08 + rng() * 0.14;
    ctx.strokeStyle = `${pal.gold}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x, -20);
    const steps = 8;
    for (let s = 1; s <= steps; s++) {
      const y1 = (h / steps) * (s - 0.5);
      const y2 = (h / steps) * s;
      const cx = x + (rng() - 0.5) * amp * 2;
      const ex = x + (rng() - 0.5) * amp;
      ctx.quadraticCurveTo(cx, y1, ex, y2);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Particle dust (dots + short strokes)
  const dust = Math.floor((w * h) / 9000);
  for (let i = 0; i < dust; i++) {
    const px = rng() * w;
    const py = rng() * h;
    const r = rng() * (w * 0.0015) + 0.4;
    const a = 0.15 + rng() * 0.45;
    ctx.fillStyle = `rgba(232, 192, 122, ${a})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint diagonal streaks
  const streaks = 24;
  ctx.save();
  for (let i = 0; i < streaks; i++) {
    const sx = rng() * w;
    const sy = rng() * h;
    const len = w * (0.02 + rng() * 0.05);
    const ang = -0.9 + rng() * 0.4;
    ctx.strokeStyle = `rgba(232, 192, 122, ${0.08 + rng() * 0.12})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity = 12) {
  try {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * intensity;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
  } catch {}
}

function drawImageEllipse(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number, cy: number,
  rx: number, ry: number,
  rotation: number,
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = rx * 0.2;
  ctx.shadowOffsetY = ry * 0.06;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
  ctx.clip();
  const boxW = rx * 2, boxH = ry * 2;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(boxW / iw, boxH / ih);
  const dw = iw * scale, dh = ih * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageRoundedRect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number, r: number,
  rotation = 0,
) {
  ctx.save();
  if (rotation) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotation);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = w * 0.08;
  ctx.shadowOffsetY = h * 0.03;
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (rotation) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotation);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale, dh = ih * scale;
  ctx.drawImage(img, x + w / 2 - dw / 2, y + h / 2 - dh / 2, dw, dh);
  ctx.restore();
}

// ============= VARIANTS =============

function variantOrganic(ctx: CanvasRenderingContext2D, w: number, h: number, imgs: HTMLImageElement[], rng: () => number) {
  const isPortrait = h > w;
  const cx = w * (isPortrait ? 0.5 : 0.42);
  const cy = h * (isPortrait ? 0.36 : 0.44);
  const heroR = Math.min(w, h) * (isPortrait ? 0.34 : 0.31);
  if (imgs[0]) drawImageEllipse(ctx, imgs[0], cx, cy, heroR, heroR, 0);

  const sats: [number, number, number, number][] = isPortrait
    ? [[w * 0.78, h * 0.22, heroR * 0.45, heroR * 0.45],
       [w * 0.18, h * 0.60, heroR * 0.55, heroR * 0.45],
       [w * 0.82, h * 0.56, heroR * 0.4, heroR * 0.4],
       [w * 0.35, h * 0.78, heroR * 0.42, heroR * 0.38]]
    : [[w * 0.78, h * 0.24, heroR * 0.50, heroR * 0.42],
       [w * 0.82, h * 0.68, heroR * 0.45, heroR * 0.40],
       [w * 0.22, h * 0.76, heroR * 0.50, heroR * 0.42],
       [w * 0.60, h * 0.82, heroR * 0.36, heroR * 0.30]];
  for (let i = 1; i < imgs.length && i - 1 < sats.length; i++) {
    const [sx, sy, rx, ry] = sats[i - 1];
    drawImageEllipse(ctx, imgs[i], sx + (rng() - 0.5) * w * 0.02, sy + (rng() - 0.5) * h * 0.02, rx, ry, (rng() - 0.5) * 0.35);
  }
}

function variantEditorial(ctx: CanvasRenderingContext2D, w: number, h: number, imgs: HTMLImageElement[], pal: Palette) {
  // Big hero on right (60% width, full height minus signature)
  const heroW = w * 0.58;
  const heroH = h * 0.78;
  const heroX = w - heroW - w * 0.04;
  const heroY = h * 0.06;
  if (imgs[0]) drawImageRoundedRect(ctx, imgs[0], heroX, heroY, heroW, heroH, Math.min(heroW, heroH) * 0.04);

  // Vertical gold rule left of hero
  ctx.fillStyle = pal.gold;
  ctx.fillRect(heroX - w * 0.018, heroY + heroH * 0.15, Math.max(2, w * 0.0025), heroH * 0.7);

  // Two small thumbs stacked bottom-left
  const thumbW = w * 0.24;
  const thumbH = h * 0.22;
  const thumbX = w * 0.05;
  if (imgs[1]) drawImageRoundedRect(ctx, imgs[1], thumbX, h * 0.42, thumbW, thumbH, thumbW * 0.06);
  if (imgs[2]) drawImageRoundedRect(ctx, imgs[2], thumbX, h * 0.42 + thumbH + h * 0.03, thumbW, thumbH, thumbW * 0.06);
}

function variantDiptyque(ctx: CanvasRenderingContext2D, w: number, h: number, imgs: HTMLImageElement[]) {
  // Left hero rectangle 55%
  const leftW = w * 0.52;
  const leftH = h * 0.82;
  const leftX = w * 0.04;
  const leftY = h * 0.05;
  if (imgs[0]) drawImageRoundedRect(ctx, imgs[0], leftX, leftY, leftW, leftH, Math.min(leftW, leftH) * 0.08);

  // Right: 3 overlapping tilted cards
  const rightCx = w * 0.75;
  const rightCy = h * 0.42;
  const cardW = w * 0.28;
  const cardH = h * 0.34;
  const tilts = [-0.09, 0.03, 0.11];
  const offsets: [number, number][] = [[-w * 0.04, -h * 0.08], [0, 0], [w * 0.04, h * 0.10]];
  for (let i = 1; i < Math.min(4, imgs.length); i++) {
    const [ox, oy] = offsets[i - 1];
    drawImageRoundedRect(ctx, imgs[i], rightCx - cardW / 2 + ox, rightCy - cardH / 2 + oy, cardW, cardH, cardW * 0.06, tilts[i - 1]);
  }
}

function variantConstellation(ctx: CanvasRenderingContext2D, w: number, h: number, imgs: HTMLImageElement[], pal: Palette, rng: () => number) {
  const cx = w * 0.5;
  const cy = h * 0.44;
  const heroR = Math.min(w, h) * 0.16;

  // Draw connecting curves first (behind)
  const nodes: [number, number, number][] = [[cx, cy, heroR]];
  const sats: [number, number, number][] = [
    [w * 0.18, h * 0.22, heroR * 0.55],
    [w * 0.82, h * 0.20, heroR * 0.5],
    [w * 0.15, h * 0.70, heroR * 0.7],
    [w * 0.85, h * 0.68, heroR * 0.6],
    [w * 0.42, h * 0.80, heroR * 0.45],
    [w * 0.68, h * 0.82, heroR * 0.4],
  ];
  const shuffled = sats.slice(0, Math.min(6, imgs.length - 1));

  ctx.save();
  ctx.strokeStyle = `${pal.gold}66`;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  for (const s of shuffled) {
    ctx.beginPath();
    const midX = (cx + s[0]) / 2 + (rng() - 0.5) * w * 0.05;
    const midY = (cy + s[1]) / 2 + (rng() - 0.5) * h * 0.05;
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(midX, midY, s[0], s[1]);
    ctx.stroke();
  }
  ctx.restore();

  // Small bright dots at endpoints
  for (const s of shuffled) {
    ctx.fillStyle = pal.gold;
    ctx.beginPath();
    ctx.arc(s[0], s[1], 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hero
  if (imgs[0]) drawImageEllipse(ctx, imgs[0], cx, cy, heroR, heroR, 0);

  // Satellites (varied sizes)
  for (let i = 1; i < imgs.length && i - 1 < shuffled.length; i++) {
    const [sx, sy, sr] = shuffled[i - 1];
    drawImageEllipse(ctx, imgs[i], sx, sy, sr, sr, 0);
    nodes.push([sx, sy, sr]);
  }
}

// ============= SIGNATURE =============

function formatDateFR(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return ''; }
}

function formatGps(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return '';
  return `${lat.toFixed(4)}°N · ${lng.toFixed(4)}°E`;
}

function wordmark(theme: Theme): string {
  return theme === 'frequence' ? 'La Fréquence du Vivant' : 'Les Marches du Vivant';
}

function drawSignature(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  theme: Theme,
  event: EventSnapshot | null | undefined,
  category: string,
  pal: Palette,
  titleScale: TitleScale,
  variant: Variant,
) {
  const panelH = Math.round(h * 0.13);
  const panelY = h - panelH;
  const grad = ctx.createLinearGradient(0, panelY, 0, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, panelY, w, panelH);

  const textColor = '#f5e6c8';
  ctx.textBaseline = 'top';

  const padX = Math.round(w * 0.045);
  const scaleFactor = titleScale === 'large' ? 0.058 : titleScale === 'medium' ? 0.038 : 0.026;
  const markSize = Math.round(h * scaleFactor);
  const baseY = panelY + panelH * 0.28;

  ctx.fillStyle = textColor;
  ctx.font = `italic 500 ${markSize}px "Crimson Text", Georgia, serif`;

  // Editorial: title big, top-left of the composition instead of bottom
  if (variant === 'editorial' && titleScale === 'large') {
    const topY = h * 0.10;
    const topX = w * 0.05;
    ctx.font = `italic 500 ${Math.round(h * 0.075)}px "Crimson Text", Georgia, serif`;
    // Wrap on two lines
    const words = wordmark(theme).split(' ');
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');
    ctx.fillText(line1, topX, topY);
    ctx.fillText(line2, topX, topY + Math.round(h * 0.075) * 1.05);
    ctx.fillStyle = pal.gold;
    ctx.fillRect(topX, topY + Math.round(h * 0.075) * 2.2, w * 0.12, Math.max(2, h * 0.003));
  } else {
    ctx.fillText(wordmark(theme), padX, baseY);
    ctx.fillStyle = pal.gold;
    const m = ctx.measureText(wordmark(theme));
    ctx.fillRect(padX, baseY + markSize * 1.15, m.width, Math.max(2, h * 0.002));
  }

  // Right meta
  ctx.fillStyle = textColor;
  const smallSize = Math.round(h * 0.017);
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
  const rightX = w - padX;
  lines.forEach((l, i) => {
    const m = ctx.measureText(l);
    ctx.fillText(l, rightX - m.width, baseY + i * smallSize * 1.5);
  });
}

// ============= MAIN =============

export async function renderWallpaper(opts: RenderOptions): Promise<HTMLCanvasElement> {
  const { width, height, theme, photos, event, category, ambiance, qrTarget, seed } = opts;
  const variant: Variant = opts.variant ?? 'organic';
  const titleScale: TitleScale =
    opts.titleScale ??
    (variant === 'editorial' ? 'large' : variant === 'diptyque' ? 'medium' : 'small');

  const rng = makeRng(seed);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const pal = PALETTES[ambiance] || PALETTES.any;

  // Rich Jardin-inspired backdrop
  drawJardinBackdrop(ctx, width, height, pal, rng);

  const imgs = (await Promise.all(photos.slice(0, 6).map((p) => loadImage(p.url))))
    .filter((x): x is HTMLImageElement => !!x);

  if (imgs.length > 0) {
    if (variant === 'organic') variantOrganic(ctx, width, height, imgs, rng);
    else if (variant === 'editorial') variantEditorial(ctx, width, height, imgs, pal);
    else if (variant === 'diptyque') variantDiptyque(ctx, width, height, imgs);
    else if (variant === 'constellation') variantConstellation(ctx, width, height, imgs, pal, rng);
  }

  // Editorial: subtle gold hairline frame
  if (variant === 'editorial') {
    ctx.strokeStyle = `${pal.gold}55`;
    ctx.lineWidth = Math.max(1, height * 0.001);
    ctx.strokeRect(width * 0.02, height * 0.02, width * 0.96, height * 0.96);
  }

  drawSignature(ctx, width, height, theme, event ?? null, category, pal, titleScale, variant);

  // QR
  const qrSize = Math.round(Math.min(width, height) * 0.06);
  const padX = Math.round(width * 0.045);
  const qx = width - qrSize - padX * 0.4;
  const qy = height - qrSize - padX * 0.4;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrTarget, {
      margin: 1,
      color: { dark: pal.ink, light: pal.paper },
      width: qrSize * 2,
    });
    const qrImg = await loadImage(qrDataUrl);
    if (qrImg) {
      const pad = qrSize * 0.08;
      ctx.fillStyle = pal.paper;
      ctx.fillRect(qx - pad, qy - pad, qrSize + pad * 2, qrSize + pad * 2);
      ctx.drawImage(qrImg, qx, qy, qrSize, qrSize);
    }
  } catch {}

  // Discreet community CTA (optional)
  if (opts.ctaEnabled) {
    drawCommunityCta(ctx, width, height, pal, variant, qx, qy);
  }

  drawGrain(ctx, width, height, 10);
  return canvas;
}

function drawCommunityCta(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  pal: Palette,
  variant: Variant,
  qx: number, qy: number,
) {
  const isPortrait = h > w;
  const ctaSize = Math.max(14, Math.round(h * (isPortrait ? 0.018 : 0.022)));
  const subSize = Math.max(11, Math.round(h * (isPortrait ? 0.012 : 0.014)));
  const text = 'Rejoignez la communauté des Marcheurs du Vivant';
  const sub = 'la-frequence-du-vivant.com';

  ctx.save();
  ctx.textBaseline = 'alphabetic';

  ctx.font = `italic 600 ${ctaSize}px "Crimson Text", Georgia, serif`;
  const tm = ctx.measureText(text);
  ctx.font = `400 ${subSize}px "Inter", "Libre Baskerville", sans-serif`;
  const sm = ctx.measureText(sub);

  const padX = Math.round(ctaSize * 1.1);
  const padY = Math.round(ctaSize * 0.65);
  const dotR = Math.round(ctaSize * 0.28);
  const gap = Math.round(ctaSize * 0.55);
  const contentW = dotR * 2 + gap + Math.max(tm.width, sm.width);
  const contentH = ctaSize + subSize * 1.6;
  const plaqueW = contentW + padX * 2;
  const plaqueH = contentH + padY * 2;

  const panelH = Math.round(h * 0.13);
  const marginBottom = panelH + Math.round(h * 0.015);
  let plaqueX: number;
  let plaqueY = h - marginBottom - plaqueH;

  if (isPortrait) {
    plaqueX = (w - plaqueW) / 2;
  } else if (variant === 'editorial') {
    plaqueX = Math.round(w * 0.05);
  } else if (variant === 'diptyque') {
    plaqueX = w - plaqueW - Math.round(w * 0.04);
  } else {
    plaqueX = (w - plaqueW) / 2;
  }

  // Anti-collision QR
  const qrLeft = qx - Math.round(w * 0.015);
  if (plaqueX + plaqueW > qrLeft && plaqueY + plaqueH > qy - h * 0.01) {
    plaqueY = qy - plaqueH - Math.round(h * 0.015);
    if (plaqueX + plaqueW > qrLeft) {
      plaqueX = Math.max(w * 0.03, qrLeft - plaqueW);
    }
  }

  // Ombre + plaque sombre arrondie
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = ctaSize * 1.4;
  ctx.shadowOffsetY = ctaSize * 0.15;
  roundedRectPath(ctx, plaqueX, plaqueY, plaqueW, plaqueH, plaqueH * 0.35);
  ctx.fillStyle = 'rgba(10, 8, 4, 0.64)';
  ctx.fill();
  ctx.restore();

  // Liseré doré
  roundedRectPath(ctx, plaqueX + 0.5, plaqueY + 0.5, plaqueW - 1, plaqueH - 1, plaqueH * 0.35);
  ctx.strokeStyle = 'rgba(232, 192, 122, 0.45)';
  ctx.lineWidth = Math.max(1, h * 0.0008);
  ctx.stroke();

  // Pastille dorée
  const dotCx = plaqueX + padX + dotR;
  const dotCy = plaqueY + plaqueH / 2;
  const halo = ctx.createRadialGradient(dotCx, dotCy, 0, dotCx, dotCy, dotR * 2.6);
  halo.addColorStop(0, `${pal.gold}cc`);
  halo.addColorStop(1, 'rgba(232, 192, 122, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(dotCx, dotCy, dotR * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.gold;
  ctx.beginPath();
  ctx.arc(dotCx, dotCy, dotR, 0, Math.PI * 2);
  ctx.fill();

  // Texte principal (crème lumineuse)
  const textX = dotCx + dotR + gap;
  const textY = plaqueY + padY + ctaSize;
  ctx.font = `italic 600 ${ctaSize}px "Crimson Text", Georgia, serif`;
  ctx.fillStyle = '#faf3e0';
  ctx.fillText(text, textX, textY);

  // URL en doré
  ctx.font = `400 ${subSize}px "Inter", "Libre Baskerville", sans-serif`;
  ctx.fillStyle = 'rgba(232, 192, 122, 0.92)';
  ctx.fillText(sub, textX, textY + subSize * 1.4);

  ctx.restore();
}


export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality);
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
