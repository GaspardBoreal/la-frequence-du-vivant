import React, { useMemo, useState } from 'react';
import { useSpeciesThumb } from '@/hooks/useSpeciesThumb';

type Registre = 'marcheur' | 'inat';

interface StripPhoto {
  url: string;
  registre: Registre;
  attribution?: string | null;
}

interface Props {
  scientificName?: string | null;
  displayName: string;
  /** Photos terrain marcheurs (la première est celle de l'observation). */
  walkerPhotos?: (string | null | undefined)[];
  kingdom?: string | null;
  iconicTaxon?: string | null;
  /** Ouvre la visionneuse plein écran sur l'observation courante. */
  onZoomWalker?: () => void;
}

function pictoFor(iconic?: string | null, kingdom?: string | null): string {
  switch ((iconic || '').toLowerCase()) {
    case 'aves': return '🕊️';
    case 'mammalia': return '🦊';
    case 'insecta': return '🦋';
    case 'arachnida': return '🕷️';
    case 'reptilia': return '🦎';
    case 'amphibia': return '🐸';
    case 'actinopterygii':
    case 'chondrichthyes': return '🐟';
    case 'mollusca': return '🐚';
    case 'plantae': return '🌿';
    case 'fungi': return '🍄';
  }
  switch ((kingdom || '').toLowerCase()) {
    case 'plantae': return '🌿';
    case 'fungi': return '🍄';
    case 'animalia': return '🐾';
  }
  return '🌱';
}

/**
 * Bande photo à deux registres pour les popups d'observation :
 *   1. photos terrain marcheurs (prioritaires),
 *   2. photo de référence iNaturalist (species_thumb_cache) — toujours ajoutée
 *      en dernier, y compris quand des photos terrain existent.
 * Sans aucune photo : pictogramme par taxon, jamais de vide.
 */
export const ObservationPhotoStrip: React.FC<Props> = ({
  scientificName,
  displayName,
  walkerPhotos,
  kingdom,
  iconicTaxon,
  onZoomWalker,
}) => {
  const { data: thumb } = useSpeciesThumb(scientificName || undefined);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState(0);

  const photos = useMemo<StripPhoto[]>(() => {
    const out: StripPhoto[] = [];
    const seen = new Set<string>();
    for (const url of walkerPhotos || []) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, registre: 'marcheur' });
    }
    const inat = thumb?.photo_url;
    if (inat && !seen.has(inat)) {
      out.push({ url: inat, registre: 'inat', attribution: thumb?.photo_attribution });
    }
    return out.filter((p) => !broken[p.url]);
  }, [walkerPhotos, thumb, broken]);

  if (photos.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: 84,
          borderRadius: 6,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(47,93,58,.08)',
          border: '1px dashed rgba(47,93,58,.25)',
          fontSize: 26,
        }}
        title="Aucune photo disponible pour cette espèce"
      >
        {pictoFor(iconicTaxon, kingdom)}
      </div>
    );
  }

  const idx = Math.min(active, photos.length - 1);
  const current = photos[idx];
  const isWalker = current.registre === 'marcheur';

  const openCurrent = () => {
    if (isWalker) {
      if (onZoomWalker) onZoomWalker();
      else window.open(current.url, '_blank', 'noopener');
      return;
    }
    const q = encodeURIComponent(scientificName || displayName);
    window.open(`https://www.inaturalist.org/taxa/search?q=${q}`, '_blank', 'noopener');
  };

  return (
    <div style={{ marginBottom: 6 }}>
      <button
        type="button"
        onClick={openCurrent}
        title={isWalker ? 'Agrandir la photo marcheur' : 'Voir la fiche iNaturalist'}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: isWalker ? 'zoom-in' : 'pointer',
        }}
      >
        <img
          src={current.url}
          alt={displayName}
          loading="lazy"
          onError={() => setBroken((b) => ({ ...b, [current.url]: true }))}
          style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, display: 'block' }}
        />
        <span
          style={{
            position: 'absolute',
            left: 5,
            bottom: 5,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '.02em',
            padding: '2px 6px',
            borderRadius: 999,
            color: '#fff',
            background: isWalker ? 'rgba(47,93,58,.88)' : 'rgba(30,42,32,.82)',
          }}
        >
          {isWalker ? '📷 Marcheur' : '🌐 iNat'}
        </span>
      </button>

      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 4, overflowX: 'auto' }}>
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setActive(i)}
              title={p.registre === 'marcheur' ? 'Photo marcheur' : 'Référence iNaturalist'}
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: 40,
                height: 40,
                padding: 0,
                borderRadius: 5,
                overflow: 'hidden',
                cursor: 'pointer',
                border: i === idx ? '2px solid #C9A227' : '1px solid rgba(0,0,0,.15)',
                background: 'none',
                opacity: i === idx ? 1 : 0.75,
              }}
            >
              <img
                src={p.url}
                alt=""
                loading="lazy"
                onError={() => setBroken((b) => ({ ...b, [p.url]: true }))}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 1,
                  bottom: 1,
                  fontSize: 7,
                  lineHeight: 1,
                  padding: '1px 2px',
                  borderRadius: 3,
                  color: '#fff',
                  background: p.registre === 'marcheur' ? 'rgba(47,93,58,.9)' : 'rgba(30,42,32,.85)',
                }}
              >
                {p.registre === 'marcheur' ? 'M' : 'iN'}
              </span>
            </button>
          ))}
        </div>
      )}

      {!isWalker && current.attribution && (
        <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>© {current.attribution}</div>
      )}
    </div>
  );
};

export default ObservationPhotoStrip;
