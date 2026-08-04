import React from 'react';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { FamilyIcon } from '@/components/propriete/identify/FloraPictos';
import {
  PLANT_INDICATORS,
  ECO_SOURCE,
  type PlantIndicator,
} from '@/lib/plantIndicatorKb';


export const ATLAS_PER_PAGE = 20; // 4 colonnes × 5 lignes

export function floraAtlasPlants(observedIds: string[]): PlantIndicator[] {
  const order = ['herbacee', 'arbuste', 'liane', 'arbre'];
  return PLANT_INDICATORS.filter((p) => observedIds.includes(p.id)).sort((a, b) => {
    const d = order.indexOf(a.famille) - order.indexOf(b.famille);
    return d !== 0 ? d : a.nom.localeCompare(b.nom, 'fr');
  });
}

export function floraAtlasPageCount(observedIds: string[]): number {
  const n = floraAtlasPlants(observedIds).length;
  return n === 0 ? 0 : Math.ceil(n / ATLAS_PER_PAGE);
}

/** 4 micro-pastilles : Eau · Texture · Nutrition · pH (valeurs signées -3..+3) */
const AXES: Array<{ key: 'eau' | 'texture' | 'nutri' | 'ph'; letter: string; neg: string; pos: string; hue: string }> = [
  { key: 'eau', letter: 'E', neg: 'sec', pos: 'frais', hue: '#4f7fa8' },
  { key: 'texture', letter: 'T', neg: 'sable', pos: 'argile', hue: '#a9865c' },
  { key: 'nutri', letter: 'N', neg: 'pauvre', pos: 'riche', hue: '#6b7c5a' },
  { key: 'ph', letter: 'pH', neg: 'acide', pos: 'calcaire', hue: '#9c6f8f' },
];

const Pastille: React.FC<{ letter: string; value: number; hue: string; title: string }> = ({
  letter,
  value,
  hue,
  title,
}) => {
  const a = Math.min(3, Math.abs(value));
  const opacity = a === 0 ? 0.12 : 0.22 + a * 0.22;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '·';
  return (
    <span
      title={title}
      className="flora-atlas-pastille"
      style={{ background: hue, opacity }}
    >
      <span style={{ opacity: 1 }}>{letter}</span>
      <span className="flora-atlas-pastille-val">
        {sign}
        {a > 0 ? a : ''}
      </span>
    </span>
  );
};

const Vignette: React.FC<{
  plant: PlantIndicator;
  photo?: string | null;
  field?: boolean;
  index: number;
}> = ({ plant, photo, field, index }) => {
  const [broken, setBroken] = React.useState(false);
  const showPhoto = !!photo && !broken;
  return (
  <figure className="flora-atlas-cell print-avoid-break">
    <div className="flora-atlas-photo">
      {showPhoto ? (
        <img
          src={photo!}
          alt={plant.nom}
          loading="eager"
          decoding="sync"
          crossOrigin="anonymous"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flora-atlas-photo-fallback">
          <FamilyIcon family={plant.famille} active size={34} />
        </div>
      )}
      <span className="flora-atlas-num">{index}</span>
      {field && showPhoto && <span className="flora-atlas-field">Terrain</span>}
    </div>

    <figcaption>
      <span className="flora-atlas-name">{plant.nom}</span>
      {plant.latin && <span className="flora-atlas-latin">{plant.latin}</span>}
      <span className="flora-atlas-dots">
        {AXES.map((ax) => (
          <Pastille
            key={ax.key}
            letter={ax.letter}
            value={plant[ax.key]}
            hue={ax.hue}
            title={`${ax.letter} · ${plant[ax.key] > 0 ? ax.pos : plant[ax.key] < 0 ? ax.neg : 'indifférent'}`}
          />
        ))}
      </span>
    </figcaption>
  </figure>
  );
};


interface Props {
  observedIds: string[];
  propertyName?: string;
  /** Propriété — permet de prioriser les photos de terrain des marcheurs. */
  proprieteId?: string;
  /** Classe de page : A4 dédiée (solo) ou page du cahier complet. */
  pageClassName?: string;
}

const norm = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/**
 * Atlas du cortège bio-indicateur — 24 vignettes par page A4 (4 × 6).
 * Chaque vignette : photo de terrain du marcheur (prioritaire) ou photo de
 * référence, nom français, nom latin, et les 4 indices écologiques CNPF.
 */
export const FloraAtlasPrintPlates: React.FC<Props> = ({
  observedIds,
  propertyName,
  proprieteId,
  pageClassName = 'identify-print-page',
}) => {
  const plants = React.useMemo(() => floraAtlasPlants(observedIds), [observedIds]);
  const thumbs = useSpeciesThumbs(plants.map((p) => p.latin ?? p.nom));
  const { species } = usePropertySpeciesPool(proprieteId);

  /** Photos marcheurs indexées par nom scientifique ET nom français normalisés. */
  const fieldByName = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of species ?? []) {
      const url = (s as any).photos?.[0];
      if (!url) continue;
      for (const key of [norm((s as any).scientificName), norm((s as any).commonName)]) {
        if (key && !m.has(key)) m.set(key, url);
      }
    }
    return m;
  }, [species]);

  if (plants.length === 0) return null;

  const pages: PlantIndicator[][] = [];
  for (let i = 0; i < plants.length; i += ATLAS_PER_PAGE) {
    pages.push(plants.slice(i, i + ATLAS_PER_PAGE));
  }

  const fieldPhotoOf = (p: PlantIndicator) =>
    fieldByName.get(norm(p.latin ?? '')) ?? fieldByName.get(norm(p.nom)) ?? null;

  const photoOf = (p: PlantIndicator) =>
    fieldPhotoOf(p) ??
    thumbs.data?.get((p.latin ?? p.nom).trim().toLowerCase())?.photo_url ??
    null;


  return (
    <>
      {pages.map((page, pi) => (
        <section key={pi} className={`${pageClassName} flora-atlas-page`}>
          <header className="flora-atlas-head">
            <div>
              <div className="flora-atlas-eyebrow">Étape 3 · Atlas du cortège</div>
              <h3 className="flora-atlas-title">
                {plants.length} espèce{plants.length > 1 ? 's' : ''} bio-indicatrice
                {plants.length > 1 ? 's' : ''} reconnues
              </h3>
            </div>
            <div className="flora-atlas-page-num">
              {pages.length > 1 ? `Planche ${pi + 1} / ${pages.length}` : 'Planche unique'}
            </div>
          </header>

          <div className="flora-atlas-grid">
            {page.map((p, i) => (
              <Vignette
                key={p.id}
                plant={p}
                photo={photoOf(p)}
                field={!!fieldPhotoOf(p)}
                index={pi * ATLAS_PER_PAGE + i + 1}
              />
            ))}

          </div>

          <footer className="flora-atlas-foot">
            <span>
              E&nbsp;eau · T&nbsp;texture · N&nbsp;nutrition · pH&nbsp;réaction — signe «&nbsp;+&nbsp;» :
              frais / argileux / riche / calcaire ; signe «&nbsp;−&nbsp;» : sec / sableux / pauvre / acide.
            </span>
            {pi === pages.length - 1 && <span className="flora-atlas-source">{ECO_SOURCE}</span>}
            <span className="flora-atlas-sign">
              {propertyName ?? 'Propriété'} · Fréquence du Vivant
            </span>
          </footer>
        </section>
      ))}
    </>
  );
};

export default FloraAtlasPrintPlates;
