import React from 'react';
import { Images, SplitSquareHorizontal } from 'lucide-react';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import { PHASE_LABEL, phaseFromDate, type MediaPhase } from '@/lib/chantierIcg';

export interface PhasedPhoto extends ObjetPhoto {
  phase: MediaPhase;
  /** Vrai quand la phase a été posée à la main (et non déduite de la date). */
  manual: boolean;
}

/** Range les médias d'un lot selon la date des travaux, surcharges comprises. */
export function phasePhotos(
  photos: ObjetPhoto[],
  workDate: string | null,
  overrides: Record<string, MediaPhase>,
): PhasedPhoto[] {
  return photos.map((p) => ({
    ...p,
    phase: overrides[p.id] ?? phaseFromDate(p.taken_at, workDate),
    manual: !!overrides[p.id],
  }));
}

const PHASES: MediaPhase[] = ['avant', 'pendant', 'apres'];

const Tile: React.FC<{
  photo: PhasedPhoto;
  readOnly?: boolean;
  onPhase: (phase: MediaPhase) => void;
  onZoom: () => void;
}> = ({ photo, readOnly, onPhase, onZoom }) => (
  <figure className="group relative overflow-hidden rounded-xl border border-current/15">
    <button type="button" onClick={onZoom} className="block w-full">
      {photo.url ? (
        <img
          src={photo.url}
          alt={photo.caption || 'Photographie du chantier'}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <span className="flex aspect-[4/3] w-full items-center justify-center text-[11px] opacity-40">
          image indisponible
        </span>
      )}
    </button>
    <figcaption className="flex items-center gap-1 px-1.5 py-1">
      <span className="min-w-0 flex-1 truncate text-[10.5px] opacity-60">
        {photo.taken_at
          ? new Date(photo.taken_at).toLocaleDateString('fr-FR')
          : 'date inconnue'}
        {photo.manual ? ' · étiquetée' : ''}
      </span>
      {!readOnly &&
        PHASES.map((ph) => (
          <button
            key={ph}
            type="button"
            title={PHASE_LABEL[ph]}
            onClick={() => onPhase(ph)}
            className={`rounded px-1 text-[9.5px] uppercase tracking-[0.08em] transition ${
              photo.phase === ph
                ? 'bg-[#c8a24a] text-[hsl(var(--ds-forest-deep))]'
                : 'opacity-40 hover:opacity-80'
            }`}
          >
            {ph === 'avant' ? 'AV' : ph === 'pendant' ? 'PD' : 'AP'}
          </button>
        ))}
    </figcaption>
  </figure>
);

/**
 * Les images du chantier : mosaïque par phase, ou rideau comparatif qui fait
 * glisser l'après sur l'avant pour les prises de vue appariées.
 */
export const MediaCurtain: React.FC<{
  photos: PhasedPhoto[];
  readOnly?: boolean;
  onPhase: (photoId: string, phase: MediaPhase) => void;
}> = ({ photos, readOnly, onPhase }) => {
  const [mode, setMode] = React.useState<'mosaique' | 'rideau'>('mosaique');
  const [cursor, setCursor] = React.useState(50);
  const [zoom, setZoom] = React.useState<string | null>(null);

  const avant = photos.filter((p) => p.phase === 'avant');
  const apres = photos.filter((p) => p.phase === 'apres');
  const [aIdx, setAIdx] = React.useState(0);
  const [bIdx, setBIdx] = React.useState(0);

  const left = avant[Math.min(aIdx, avant.length - 1)];
  const right = apres[Math.min(bIdx, apres.length - 1)];
  const canCurtain = !!left?.url && !!right?.url;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-55">
          Images du chantier · {photos.length}
        </p>
        <div className="ml-auto flex gap-1">
          {(['mosaique', 'rideau'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={m === 'rideau' && !canCurtain}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition disabled:opacity-30 ${
                mode === m ? 'border-[#c8a24a] bg-[#c8a24a]/15' : 'border-current/20 opacity-70'
              }`}
            >
              {m === 'mosaique' ? (
                <Images className="h-3 w-3" />
              ) : (
                <SplitSquareHorizontal className="h-3 w-3" />
              )}
              {m === 'mosaique' ? 'Mosaïque' : 'Rideau'}
            </button>
          ))}
        </div>
      </div>

      {photos.length === 0 && (
        <p className="rounded-xl border border-dashed border-current/20 px-3 py-6 text-center text-[12px] italic opacity-55">
          Aucune photographie au carnet des ouvrages de ce chantier.
        </p>
      )}

      {mode === 'mosaique' &&
        PHASES.map((ph) => {
          const list = photos.filter((p) => p.phase === ph);
          if (!list.length) return null;
          return (
            <div key={ph} className="mb-3">
              <p className="mb-1 text-[11px] font-semibold opacity-70">{PHASE_LABEL[ph]}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((p) => (
                  <Tile
                    key={p.id}
                    photo={p}
                    readOnly={readOnly}
                    onPhase={(phase) => onPhase(p.id, phase)}
                    onZoom={() => setZoom(p.url || null)}
                  />
                ))}
              </div>
            </div>
          );
        })}

      {mode === 'rideau' && canCurtain && (
        <div>
          <div className="relative overflow-hidden rounded-xl border border-current/15">
            <img src={left.url} alt="Avant travaux" className="block w-full object-cover" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${cursor}%` }}
            >
              <img
                src={right.url}
                alt="Après travaux"
                className="h-full w-full object-cover"
                style={{ width: `${(100 / cursor) * 100}%`, maxWidth: 'none' }}
              />
            </div>
            <span
              className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#c8a24a]"
              style={{ left: `${cursor}%` }}
            />
            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
              Après
            </span>
            <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
              Avant
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cursor}
            onChange={(e) => setCursor(Number(e.target.value))}
            className="mt-2 w-full accent-[#c8a24a]"
            aria-label="Curseur avant / après"
          />
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setAIdx((i) => (i + 1) % Math.max(avant.length, 1))}
              className="rounded-full border border-current/20 px-2 py-0.5"
            >
              Avant suivant ({avant.length})
            </button>
            <button
              type="button"
              onClick={() => setBIdx((i) => (i + 1) % Math.max(apres.length, 1))}
              className="rounded-full border border-current/20 px-2 py-0.5"
            >
              Après suivant ({apres.length})
            </button>
          </div>
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-[3600] flex items-center justify-center bg-black/85 p-6"
          onClick={() => setZoom(null)}
        >
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </section>
  );
};

export default MediaCurtain;
