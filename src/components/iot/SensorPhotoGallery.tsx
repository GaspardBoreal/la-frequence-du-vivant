import React from 'react';
import { Images } from 'lucide-react';
import { useCapteurPhotos } from '@/hooks/iot/useCapteurPhotos';
import SensorPhotoViewer from '@/components/iot/SensorPhotoViewer';

interface Props {
  capteurId: string;
  nom?: string;
  /** Couverture déjà signée par la liste/carte : sert d'affichage immédiat. */
  coverUrl?: string;
}

/**
 * Photos « en situation » dans la fiche capteur : couverture cliquable,
 * bande de vignettes, et visionneuse plein écran (balayage mobile).
 */
export const SensorPhotoGallery: React.FC<Props> = ({ capteurId, nom, coverUrl }) => {
  const { data: photos = [] } = useCapteurPhotos(capteurId);
  const [viewer, setViewer] = React.useState<number | null>(null);

  const cover = photos[0]?.thumbUrl ?? photos[0]?.url ?? coverUrl;
  if (!cover) return null;

  const count = photos.length;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => count && setViewer(0)}
        disabled={!count}
        className="relative block w-full overflow-hidden rounded-xl"
        aria-label={count > 1 ? `Voir les ${count} photos en grand` : 'Voir la photo en grand'}
      >
        <img
          src={cover}
          alt={`${nom ?? 'Capteur'} en situation`}
          decoding="async"
          fetchPriority="high"
          className="h-28 w-full object-cover"
        />
        {count > 1 && (
          <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
            <Images className="h-3 w-3" /> 1/{count}
          </span>
        )}
      </button>

      {count > 1 && (
        <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
          {photos.map((p, k) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setViewer(k)}
              aria-label={`Ouvrir la photo ${k + 1}`}
              className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/60"
            >
              <img
                src={p.thumbUrl ?? p.url}
                alt={p.caption ?? `Photo ${k + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <SensorPhotoViewer photos={photos} index={viewer} onClose={() => setViewer(null)} onNavigate={setViewer} />
    </div>
  );
};

export default SensorPhotoGallery;
