import { useMemo } from 'react';
import { TreePine } from 'lucide-react';
import { useProprieteHeroPhotos } from '@/hooks/propriete/useProprieteHeroPhotos';
import type { ProprieteAccess } from '@/hooks/useUserAppsAccess';

interface Props {
  propriete: ProprieteAccess;
  size?: number;
}

/**
 * Vignette signature pour une propriété.
 * Cascade : photo_hero_url → 1re photo dérivée (events liés) → monogramme illustré.
 */
export function ProprieteTile({ propriete: p, size = 64 }: Props) {
  const { data: photos, isLoading } = useProprieteHeroPhotos(
    p.photo_hero_url ? undefined : p.id, // n'active la requête que si pas de hero direct
    null,
  );

  const photoUrl = useMemo(() => {
    if (p.photo_hero_url) return p.photo_hero_url;
    return photos?.[0]?.url ?? null;
  }, [p.photo_hero_url, photos]);

  const initials = useMemo(() => {
    const parts = p.nom.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
    return (first + second).toUpperCase();
  }, [p.nom]);

  // Palette dérivée du rôle
  const gradient = useMemo(() => {
    switch ((p.role || '').toLowerCase()) {
      case 'proprietaire':
      case 'propriétaire':
        return 'linear-gradient(135deg,#0D6B58 0%,#134e4a 45%,#3d2a12 100%)';
      case 'paysagiste':
        return 'linear-gradient(135deg,#0f766e 0%,#0891b2 100%)';
      default:
        return 'linear-gradient(135deg,#134e4a 0%,#0D6B58 100%)';
    }
  }, [p.role]);

  const style: React.CSSProperties = {
    width: size,
    height: size,
  };

  if (photoUrl) {
    return (
      <div
        className="relative shrink-0 rounded-2xl overflow-hidden ring-1 ring-amber-300/20 shadow-md shadow-black/30"
        style={style}
      >
        <img
          src={photoUrl}
          alt={p.nom}
          className="w-full h-full object-cover animate-[kenburns_9s_ease-in-out_infinite_alternate]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <TreePine className="w-3 h-3 text-amber-200" />
        </div>
        <style>{`@keyframes kenburns{0%{transform:scale(1)}100%{transform:scale(1.08)}}`}</style>
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 rounded-2xl overflow-hidden ring-1 ring-amber-300/25 shadow-md shadow-black/30"
      style={{ ...style, background: gradient }}
    >
      {/* grain / halo */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, rgba(201,162,74,0.35) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Monogramme */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-serif italic tracking-tight"
          style={{
            fontSize: size * 0.42,
            color: '#f4ecd4',
            textShadow: '0 1px 6px rgba(0,0,0,0.45)',
            lineHeight: 1,
          }}
        >
          {initials}
        </span>
      </div>

      {/* Picto famille */}
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
        <TreePine className="w-3 h-3" style={{ color: '#c9a24a' }} />
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
    </div>
  );
}
