import React, { useEffect, useState } from 'react';
import { highResDetailSrc, isLikelyLowRes } from './zoomImageSrc';

interface Props {
  /** URL de base (vignette listing). */
  url: string;
  /** Coordonnées % du centre du crop. */
  cx: number;
  cy: number;
  /** Facteur de zoom équivalent CSS scale (ex. 2.4 → 3.6). */
  zoom: number;
  alt?: string;
  className?: string;
}

/**
 * Crop « détail » net pour le jeu Chasse aux détails.
 *
 * Stratégie :
 * 1. Précharge une source haute-résolution (highResDetailSrc).
 * 2. Pendant le chargement → vignette floutée artistique (pas de pixels nus).
 * 3. Une fois la HR prête → div en `background-image` + `background-size`
 *    + `background-position` (équivalent strict du transform: scale/origin),
 *    rendu net car le navigateur affiche une portion d'image plus grande.
 * 4. Si la HR échoue ET la vignette est basse-résolution → fallback
 *    `<img>` scale avec léger filtre + bandeau « basse résolution ».
 */
const DetailCropImage: React.FC<Props> = ({ url, cx, cy, zoom, alt = 'détail', className = '' }) => {
  const hrUrl = highResDetailSrc(url) || url;
  const [hrLoaded, setHrLoaded] = useState(false);
  const [hrFailed, setHrFailed] = useState(false);

  useEffect(() => {
    setHrLoaded(false);
    setHrFailed(false);
    if (!hrUrl) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => setHrLoaded(true);
    img.onerror = () => setHrFailed(true);
    img.src = hrUrl;
    return () => { img.onload = null; img.onerror = null; };
  }, [hrUrl]);

  // Phase 1 — HR en cours de chargement : vignette floutée
  if (!hrLoaded && !hrFailed) {
    return (
      <div className={`relative ${className}`} aria-label={alt} role="img">
        <img
          src={url}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${cx}% ${cy}%`,
            filter: 'blur(8px) saturate(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/15" />
      </div>
    );
  }

  // Phase 3 — fallback dégradé si HR introuvable
  if (hrFailed) {
    const lowRes = isLikelyLowRes(url);
    return (
      <div className={`relative ${className}`} aria-label={alt} role="img">
        <img
          src={url}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: `${cx}% ${cy}%`,
            filter: lowRes ? 'blur(0.6px) contrast(1.05) saturate(1.08)' : 'contrast(1.03) saturate(1.05)',
            transition: 'transform 0.6s cubic-bezier(.2,.7,.2,1)',
          }}
        />
        {lowRes && (
          <div
            className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/85 text-[#3B2A1A]/80 text-xs backdrop-blur-sm shadow-sm"
            style={{ fontFamily: '"Caveat", cursive', fontSize: 16 }}
          >
            détail recadré
          </div>
        )}
        {/* vignette lentille */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.18)' }}
        />
      </div>
    );
  }

  // Phase 2 — HR prête : crop CSS net via background-image
  return (
    <div
      className={`relative ${className}`}
      role="img"
      aria-label={alt}
      style={{
        backgroundImage: `url("${hrUrl}")`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${zoom * 100}%`,
        backgroundPosition: `${cx}% ${cy}%`,
        imageRendering: 'auto',
        transition: 'background-position 600ms cubic-bezier(.2,.7,.2,1), background-size 600ms cubic-bezier(.2,.7,.2,1)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.18)' }}
      />
    </div>
  );
};

export default DetailCropImage;
