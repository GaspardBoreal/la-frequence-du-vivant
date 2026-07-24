import { useMemo, useState } from 'react';
import { TreePine, Sparkles } from 'lucide-react';
import { useProprieteHeroPhotos } from '@/hooks/propriete/useProprieteHeroPhotos';
import type { ProprieteAccess } from '@/hooks/useUserAppsAccess';

interface Props {
  propriete: ProprieteAccess;
  size?: number;
}

/**
 * Vignette signature pour une propriété.
 * Cascade robuste : photo hero → 1re photo dérivée (events liés) → monogramme illustré.
 * onError sur chaque source pour ne jamais laisser un carré cassé.
 */
export function ProprieteTile({ propriete: p, size = 64 }: Props) {
  const [heroFailed, setHeroFailed] = useState(false);
  const { data: photos } = useProprieteHeroPhotos(p.id, null);

  const derivedPhoto = useMemo(
    () => (photos ?? []).find((ph) => ph.url && ph.url !== p.photo_hero_url)?.url ?? null,
    [photos, p.photo_hero_url],
  );

  const activePhoto = !heroFailed && p.photo_hero_url ? p.photo_hero_url : derivedPhoto;
  const [derivedFailed, setDerivedFailed] = useState(false);
  const showPhoto = activePhoto && !(activePhoto === derivedPhoto && derivedFailed);

  const initials = useMemo(() => {
    const parts = p.nom.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '·';
    const a = parts[0][0] ?? '';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] ?? '';
    return (a + b).toUpperCase();
  }, [p.nom]);

  // Dégradé signature stable dérivé du nom (hash → hue)
  const gradient = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < p.nom.length; i++) hash = (hash * 31 + p.nom.charCodeAt(i)) | 0;
    const palettes = [
      // Émeraude profonde
      ['#0f3d33', '#1a5c4a', '#c9a24a'],
      // Forêt / mousse
      ['#1a3c2a', '#2d5a3d', '#e8c07a'],
      // Bois / ambre
      ['#3d2a12', '#6b3a2a', '#d4a24a'],
      // Terre / sauge
      ['#2d3a2a', '#4a6741', '#e8d5a8'],
      // Vignoble / bordeaux doux
      ['#3d1e26', '#6b2a3a', '#e8b84a'],
    ];
    const pal = palettes[Math.abs(hash) % palettes.length];
    return `radial-gradient(circle at 30% 20%, ${pal[2]}33 0%, transparent 55%), linear-gradient(140deg, ${pal[0]} 0%, ${pal[1]} 70%, ${pal[0]} 100%)`;
  }, [p.nom]);

  const style: React.CSSProperties = { width: size, height: size };

  if (showPhoto) {
    return (
      <div
        className="relative shrink-0 rounded-2xl overflow-hidden ring-1 ring-amber-300/20 shadow-lg shadow-black/40"
        style={style}
      >
        <img
          src={activePhoto!}
          alt=""
          aria-hidden
          onError={() => {
            if (activePhoto === p.photo_hero_url) setHeroFailed(true);
            else setDerivedFailed(true);
          }}
          className="w-full h-full object-cover animate-[kenburns_9s_ease-in-out_infinite_alternate]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/10">
          <TreePine className="w-3 h-3" style={{ color: '#c9a24a' }} />
        </div>
        <style>{`@keyframes kenburns{0%{transform:scale(1) translate3d(0,0,0)}100%{transform:scale(1.08) translate3d(-2%,-2%,0)}}`}</style>
      </div>
    );
  }

  // Fallback élégant : monogramme serif doré sur dégradé signature
  return (
    <div
      className="relative shrink-0 rounded-2xl overflow-hidden ring-1 ring-amber-300/30 shadow-lg shadow-black/40"
      style={{ ...style, background: gradient }}
    >
      {/* Arc décoratif type feuille / colline */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 64 64"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={`arc-${p.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9a24a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c9a24a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -4 52 Q 20 22 32 40 T 70 30 L 70 68 L -4 68 Z"
          fill={`url(#arc-${p.id})`}
        />
        <path
          d="M -4 58 Q 24 30 36 46 T 70 40"
          fill="none"
          stroke="#c9a24a"
          strokeOpacity="0.25"
          strokeWidth="0.5"
        />
      </svg>

      {/* Étincelle décorative */}
      <Sparkles
        className="absolute top-1.5 left-1.5 w-2.5 h-2.5"
        style={{ color: '#f4ecd4', opacity: 0.55 }}
      />

      {/* Monogramme */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-serif italic"
          style={{
            fontSize: size * 0.44,
            color: '#f4ecd4',
            textShadow: '0 1px 8px rgba(0,0,0,0.55), 0 0 24px rgba(201,162,74,0.35)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </span>
      </div>

      {/* Picto famille */}
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ring-1 ring-amber-300/25">
        <TreePine className="w-3 h-3" style={{ color: '#c9a24a' }} />
      </div>
    </div>
  );
}
