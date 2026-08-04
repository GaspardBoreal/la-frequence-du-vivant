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
  /** Candidats ordonnés : terrain d'abord, puis photo de référence. */
  candidates: Array<{ url: string; field: boolean }>;
  index: number;
}> = ({ plant, candidates, index }) => {
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => setAttempt(0), [candidates.map((c) => c.url).join('|')]);
  const current = candidates[attempt];
  return (
  <figure className="flora-atlas-cell print-avoid-break">
    <div className="flora-atlas-photo">
      {current ? (
        <img
          key={current.url}
          src={current.url}
          alt={plant.nom}
          loading="eager"
          decoding="sync"
          referrerPolicy="no-referrer"
          onError={() => setAttempt((a) => a + 1)}
        />
      ) : (
        <div className="flora-atlas-photo-fallback">
          <FamilyIcon family={plant.famille} active size={40} />
          <span className="flora-atlas-nophoto">photo indisponible</span>
        </div>
      )}
      <span className="flora-atlas-num">{index}</span>
      {current?.field && <span className="flora-atlas-field">Terrain</span>}
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

const norm = (s: string | null | undefined) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+(spp?|sp)\.?$/i, '')
    .trim();

/** Premier mot normalisé — genre latin ou racine vernaculaire (« Achillée »). */
const firstWord = (s: string | null | undefined) => norm(s).split(/\s+/)[0] || '';

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

  /**
   * Photos marcheurs indexées à trois niveaux : nom scientifique exact,
   * genre (obs. déterminées au genre : « Achillea »), nom vernaculaire.
   * On conserve plusieurs URLs par clé pour pouvoir enchaîner les replis.
   */
  const fieldIndex = React.useMemo(() => {
    const exact = new Map<string, string[]>();
    const genus = new Map<string, string[]>();
    const common = new Map<string, string[]>();
    const add = (m: Map<string, string[]>, k: string, urls: string[]) => {
      if (!k || urls.length === 0) return;
      const arr = m.get(k);
      if (arr) arr.push(...urls);
      else m.set(k, [...urls]);
    };
    for (const s of species ?? []) {
      const urls: string[] = ((s as any).photos ?? []).filter(Boolean).slice(0, 3);
      if (urls.length === 0) continue;
      add(exact, norm((s as any).scientificName), urls);
      add(genus, firstWord((s as any).scientificName), urls);
      add(common, norm((s as any).commonName), urls);
      add(common, firstWord((s as any).commonName), urls);
    }
    return { exact, genus, common };
  }, [species]);

  if (plants.length === 0) return null;

  const pages: PlantIndicator[][] = [];
  for (let i = 0; i < plants.length; i += ATLAS_PER_PAGE) {
    pages.push(plants.slice(i, i + ATLAS_PER_PAGE));
  }

  const fieldPhotosOf = (p: PlantIndicator): string[] =>
    fieldIndex.exact.get(norm(p.latin)) ??
    fieldIndex.genus.get(firstWord(p.latin)) ??
    fieldIndex.common.get(norm(p.nom)) ??
    fieldIndex.common.get(firstWord(p.nom)) ??
    [];

  const candidatesOf = (p: PlantIndicator): Array<{ url: string; field: boolean }> => {
    const seen = new Set<string>();
    const out: Array<{ url: string; field: boolean }> = [];
    for (const url of fieldPhotosOf(p)) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, field: true });
    }
    const ref = thumbs.data?.get((p.latin ?? p.nom).trim().toLowerCase())?.photo_url;
    if (ref && !seen.has(ref)) out.push({ url: ref, field: false });
    return out;
  };




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
                candidates={candidatesOf(p)}

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
