import React from 'react';
import type { TestMedia } from '@/hooks/propriete/usePropertyTestMedias';
import {
  SOIL_TESTS,
  SOIL_BLOCKS,
  SOIL_TEST_MAP,
  type SoilTestId,
} from '@/components/propriete/analyze/media/soilTestCatalog';
import { printImageUrl } from '@/components/propriete/print/printImageUrl';

const PER_PAGE = 12;

export interface TestMediaPlate {
  testId: SoilTestId;
  photos: TestMedia[];
  /** Index de la planche pour ce test (0 = première). */
  part: number;
  parts: number;
  /** Nombre de vidéos non imprimables pour ce test (mention seulement). */
  videoCount: number;
  locations: number;
}

const dateOf = (m: TestMedia) => m.taken_at ?? m.created_at;

/** Découpe les médias en planches A4 de 12 vignettes, groupées par test. */
export const buildTestMediaPlates = (medias: TestMedia[] | undefined): TestMediaPlate[] => {
  const list = medias ?? [];
  const plates: TestMediaPlate[] = [];

  SOIL_TESTS.forEach((test) => {
    const forTest = list.filter((m) => m.test_id === test.id);
    const photos = forTest
      .filter((m) => m.media_type === 'photo' && !!m.url)
      .sort((a, b) => {
        const la = (a.sample_label ?? '').localeCompare(b.sample_label ?? '');
        if (la !== 0) return la;
        // Ordre choisi par l'utilisateur au sein d'un prélèvement, puis date.
        const oi = (a.order_index ?? 0) - (b.order_index ?? 0);
        if (oi !== 0) return oi;
        return String(dateOf(a)).localeCompare(String(dateOf(b)));
      });
    if (photos.length === 0) return;

    const videoCount = forTest.filter((m) => m.media_type === 'video').length;
    const locations = new Set(photos.map((p) => p.sample_label ?? p.sample_id)).size;
    const parts = Math.ceil(photos.length / PER_PAGE);

    for (let i = 0; i < parts; i += 1) {
      plates.push({
        testId: test.id,
        photos: photos.slice(i * PER_PAGE, (i + 1) * PER_PAGE),
        part: i,
        parts,
        videoCount: i === 0 ? videoCount : 0,
        locations,
      });
    }
  });

  return plates;
};

export const testMediaPlateCount = (medias: TestMedia[] | undefined): number =>
  buildTestMediaPlates(medias).length;

/** Gabarit adaptatif : la grille se verrouille au nombre de vignettes de la page. */
const densityClass = (count: number) => {
  if (count <= 4) return 'combined-print-plate-grid--d4';
  if (count <= 6) return 'combined-print-plate-grid--d6';
  if (count <= 9) return 'combined-print-plate-grid--d9';
  return 'combined-print-plate-grid--d12';
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Planches « Preuves de terrain » pour l'impression du cahier complet :
 * une page par test (12 vignettes max), date sous chaque photo.
 */
export const TestMediaPrintPlates: React.FC<{
  medias: TestMedia[] | undefined;
  propertyName?: string;
}> = ({ medias, propertyName }) => {
  const plates = React.useMemo(() => buildTestMediaPlates(medias), [medias]);
  if (plates.length === 0) return null;

  return (
    <>
      {plates.map((plate, idx) => {
        const def = SOIL_TEST_MAP[plate.testId];
        const accent = SOIL_BLOCKS[def.block].accent;
        return (
          <section
            key={`${plate.testId}-${plate.part}-${idx}`}
            className="portrait-print-page combined-print-plate"
            style={{ ['--plate-accent' as any]: `hsl(${accent})` }}
          >
            <header className="combined-print-plate-head">
              <div className="combined-print-plate-eyebrow">Preuves de terrain</div>
              <h3 className="combined-print-plate-title">
                {def.label}
                {plate.parts > 1 && (
                  <span className="combined-print-plate-suite"> (suite {plate.part + 1}/{plate.parts})</span>
                )}
              </h3>
              <div className="combined-print-plate-rule" />
              <div className="combined-print-plate-meta">
                {SOIL_BLOCKS[def.block].label} · {plate.photos.length} photo
                {plate.photos.length > 1 ? 's' : ''} · {plate.locations} emplacement
                {plate.locations > 1 ? 's' : ''}
                {plate.videoCount > 0 && ` · + ${plate.videoCount} vidéo${plate.videoCount > 1 ? 's' : ''}`}
              </div>
            </header>

            <div className={`combined-print-plate-grid ${densityClass(plate.photos.length)}`}>
              {plate.photos.map((p) => (
                <figure key={p.id} className="combined-print-thumb">
                  <div className="combined-print-thumb-frame">
                    <img src={printImageUrl(p.url, 'thumb')} loading="eager" alt={p.caption ?? `${def.label} — ${p.sample_label ?? ''}`} />
                    {p.sample_label && (
                      <span className="combined-print-thumb-pin">{p.sample_label}</span>
                    )}
                  </div>
                  <figcaption className="combined-print-thumb-cap">
                    <span className="combined-print-thumb-date">{formatDate(dateOf(p))}</span>
                    {p.sample_location && (
                      <span className="combined-print-thumb-loc"> · {p.sample_location}</span>
                    )}
                    {p.caption && <span className="combined-print-thumb-note">{p.caption}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>

            <footer className="combined-print-plate-foot">
              {propertyName ?? 'Propriété'} · Étape 2 · Preuves de terrain
            </footer>
          </section>
        );
      })}
    </>
  );
};
