import React from 'react';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import type { HerbierEntry } from '../HerbierPanel';
import { STRATES, STRATE_ORDER, ECO_FUNCTIONS, type Strate } from '@/lib/plantSpread';
import { sizeAt } from '@/lib/immersion/growthModel';
import { printImageUrl } from '@/components/propriete/print/printImageUrl';
import ChantierPlanSVG from './ChantierPlanSVG';

export interface ChantierPrintOptions {
  /** Horizon de projection des houppiers sur le plan (années). */
  year: number;
  withInPlace: boolean;
  withPhotos: boolean;
  withNeighbours: boolean;
}

interface Props {
  propertyName?: string;
  commune?: string | null;
  ouvrageNom: string;
  ouvrageType: string;
  scenarioNom: string;
  areaM2: number;
  geometry: any;
  neighbours?: any[];
  plantings: Planting[];
  inPlace: HerbierEntry[];
  proposed: HerbierEntry[];
  photos: ObjetPhoto[];
  notes?: string | null;
  rigourLabel: string;
  options: ChantierPrintOptions;
}

interface PlantLine {
  n: number;
  scientificName: string;
  commonNameFr: string | null;
  strate: Strate;
  spreadM: number;
  count: number;
  origin: Planting['origin'];
  photoUrl?: string | null;
  functions?: string[];
  note?: string | null;
}

const fmtM = (v: number) => `${v.toFixed(1).replace('.', ',')} m`;
const fmtArea = (v: number) =>
  v >= 10000 ? `${(v / 10000).toFixed(2).replace('.', ',')} ha` : `${Math.round(v)} m²`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const ORIGIN_LABEL: Record<Planting['origin'], string> = {
  place: 'En place',
  proposee: 'Apport proposé',
  libre: 'Apport libre',
};

const ecoGlyph = (k: string) => ECO_FUNCTIONS.find((f) => f.key === k) ?? null;

/* ------------------------------------------------------------------ */
/* Blocs                                                               */
/* ------------------------------------------------------------------ */

const Title: React.FC<{ eyebrow: string; children: React.ReactNode; sub?: string }> = ({
  eyebrow,
  children,
  sub,
}) => (
  <header className="mb-4">
    <p className="text-[8pt] uppercase tracking-[0.28em] text-[#8a6d3b]">{eyebrow}</p>
    <h3 className="font-serif text-[22pt] italic leading-tight text-[#2a2419]">{children}</h3>
    {sub && <p className="mt-1 text-[9pt] italic text-[#5d5544]">{sub}</p>}
  </header>
);

const StrateChip: React.FC<{ strate: Strate }> = ({ strate }) => {
  const info = STRATES[strate] ?? STRATES.herbacee;
  return (
    <span
      className="print-exact inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[7.6pt] font-semibold"
      style={{ backgroundColor: `${info.color}1f`, color: info.color }}
    >
      <span
        aria-hidden
        className="print-exact inline-block h-[6px] w-[6px] rounded-full"
        style={{ backgroundColor: info.color }}
      />
      {info.label}
    </span>
  );
};

/** Vignette d'espèce — planche « en place » ou « apports retenus ». */
const SpeciesTile: React.FC<{
  photoUrl?: string | null;
  title: string;
  latin: string;
  strate: Strate;
  meta?: string;
  badge?: string;
  functions?: string[];
}> = ({ photoUrl, title, latin, strate, meta, badge, functions }) => {
  const info = STRATES[strate] ?? STRATES.herbacee;
  return (
    <article className="print-avoid-break overflow-hidden rounded-xl border border-[#e0d5b6] bg-white/70">
      <div
        className="print-exact relative h-[42mm] w-full overflow-hidden"
        style={{ backgroundColor: `${info.color}14` }}
      >
        {photoUrl ? (
          // Pas de crossOrigin : les photos iNaturalist / GBIF ne renvoient pas
          // toujours d'en-tête CORS, et le mode « anonymous » les faisait échouer
          // silencieusement à l'impression.
          <img
            src={printImageUrl(photoUrl, 'plate')}
            alt={title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#8a8172]">
            <span className="text-[26pt] opacity-45">{info.glyph}</span>
            <span className="text-[7pt] uppercase tracking-[0.12em] opacity-70">
              photographie à venir
            </span>
          </div>
        )}
        {badge && (
          <span className="print-exact absolute left-1.5 top-1.5 rounded-full bg-[#2a2419]/78 px-2 py-[1px] text-[7.5pt] font-semibold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-[10pt] font-semibold leading-tight text-[#2a2419]">{title}</p>
        <p className="truncate font-serif text-[8.5pt] italic text-[#6b6151]">{latin}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <StrateChip strate={strate} />
          {meta && <span className="text-[7.8pt] text-[#7a7261]">{meta}</span>}
        </div>
        {functions && functions.length > 0 && (
          <p className="mt-[3px] truncate text-[7.6pt] text-[#7a7261]">
            {functions
              .map((f) => ecoGlyph(f))
              .filter(Boolean)
              .map((f) => `${f!.glyph} ${f!.label}`)
              .join(' · ')}
          </p>
        )}
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Maquette                                                            */
/* ------------------------------------------------------------------ */

const LIST_ROWS_1 = 20;
const LIST_ROWS_N = 26;
const TILES_PER_PAGE = 12;
const PHOTOS_PER_PAGE = 6;

/**
 * « Dossier de chantier » — la pièce que l'on pose sur la table d'un
 * paysagiste : ce qui existe déjà, ce que l'on apporte, où cela se plante,
 * et l'état des lieux photographié avant la première bêche.
 */
export const ChantierPrintLayout: React.FC<Props> = ({
  propertyName,
  commune,
  ouvrageNom,
  ouvrageType,
  scenarioNom,
  areaM2,
  geometry,
  neighbours = [],
  plantings,
  inPlace,
  proposed,
  photos,
  notes,
  rigourLabel,
  options,
}) => {
  const editionDate = new Date();

  /* --- Liste de plantation : une ligne par espèce, triée par strate --- */
  const { lines, numberOf } = React.useMemo(() => {
    const photoBySci = new Map<string, string | null | undefined>();
    const metaBySci = new Map<string, HerbierEntry>();
    [...proposed, ...inPlace].forEach((e) => {
      if (!photoBySci.get(e.scientificName)) photoBySci.set(e.scientificName, e.photoUrl);
      if (!metaBySci.has(e.scientificName)) metaBySci.set(e.scientificName, e);
    });

    const by = new Map<string, PlantLine>();
    plantings.forEach((p) => {
      const prev = by.get(p.scientificName);
      if (prev) {
        prev.count += 1;
        return;
      }
      const meta = metaBySci.get(p.scientificName);
      by.set(p.scientificName, {
        n: 0,
        scientificName: p.scientificName,
        commonNameFr: p.commonNameFr ?? meta?.commonNameFr ?? null,
        strate: p.strate,
        spreadM: p.spreadM || (STRATES[p.strate] ?? STRATES.herbacee).spreadM,
        count: 1,
        origin: p.origin,
        photoUrl: p.photoUrl ?? photoBySci.get(p.scientificName) ?? null,
        functions: p.functions ?? meta?.functions,
        note: p.note ?? meta?.note ?? null,
      });
    });

    const sorted = Array.from(by.values()).sort((a, b) => {
      const d = STRATE_ORDER.indexOf(a.strate) - STRATE_ORDER.indexOf(b.strate);
      if (d !== 0) return d;
      return (a.commonNameFr || a.scientificName).localeCompare(b.commonNameFr || b.scientificName, 'fr');
    });
    const map = new Map<string, number>();
    sorted.forEach((l, i) => {
      l.n = i + 1;
      map.set(l.scientificName, l.n);
    });
    return { lines: sorted, numberOf: map };
  }, [plantings, proposed, inPlace]);

  const totalPlants = plantings.length;
  const strateCount = new Set(plantings.map((p) => p.strate)).size;

  /** Couverture projetée : somme des houppiers, plafonnée à l'emprise. */
  const coverage = React.useMemo(() => {
    const at = (y: number) =>
      plantings.reduce((s, p) => {
        const r = sizeAt(p, y).spreadM / 2;
        return s + Math.PI * r * r;
      }, 0);
    const pct = (v: number) => (areaM2 > 0 ? Math.min(100, Math.round((v / areaM2) * 100)) : 0);
    return { y3: pct(at(3)), y10: pct(at(10)) };
  }, [plantings, areaM2]);

  const retained = React.useMemo(() => {
    const placedSci = new Set(plantings.filter((p) => p.origin !== 'place').map((p) => p.scientificName));
    return proposed.filter((e) => placedSci.has(e.scientificName));
  }, [proposed, plantings]);
  const notRetained = React.useMemo(() => {
    const placedSci = new Set(plantings.map((p) => p.scientificName));
    return proposed.filter((e) => !placedSci.has(e.scientificName));
  }, [proposed, plantings]);

  const inPlaceList = options.withInPlace ? inPlace : [];
  const photoList = options.withPhotos ? photos.filter((p) => p.url) : [];

  /* --- Pagination --- */
  const listPages = lines.length
    ? 1 + Math.max(0, Math.ceil((lines.length - LIST_ROWS_1) / LIST_ROWS_N))
    : 0;
  const inPlacePages = Math.ceil(inPlaceList.length / TILES_PER_PAGE);
  const proposedTiles = [...retained, ...notRetained];
  const proposedPages = Math.ceil(proposedTiles.length / TILES_PER_PAGE);
  const photoPages = photoList.length
    ? 1 + Math.max(0, Math.ceil((photoList.length - 1) / PHOTOS_PER_PAGE))
    : 0;

  const total =
    1 /* cover */ +
    1 /* plan */ +
    listPages +
    inPlacePages +
    proposedPages +
    photoPages +
    1; /* repères */

  let page = 1;
  const Foot: React.FC<{ index: number }> = ({ index }) => (
    <footer className="synthesize-print-foot">
      <span>
        {propertyName ?? 'Propriété'} · {ouvrageNom} · {scenarioNom}
      </span>
      <span>
        {index} / {total}
      </span>
    </footer>
  );

  const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const index = page++;
    return (
      <section className="synthesize-print-page">
        <div className="synthesize-print-rule" />
        <div className="synthesize-print-body">{children}</div>
        <Foot index={index} />
      </section>
    );
  };

  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const listChunks: PlantLine[][] = [];
  if (lines.length) {
    listChunks.push(lines.slice(0, LIST_ROWS_1));
    for (let i = LIST_ROWS_1; i < lines.length; i += LIST_ROWS_N)
      listChunks.push(lines.slice(i, i + LIST_ROWS_N));
  }

  return (
    <div className="synthesize-print-root-wrap chantier-print-root">
      {/* ---------- 1 · Couverture ---------- */}
      <section className="chantier-cover print-exact">
        {(() => {
          page++;
          return null;
        })()}
        <div className="chantier-cover-eyebrow">Dossier de chantier</div>
        <h2 className="chantier-cover-title">{ouvrageNom}</h2>
        <div className="chantier-cover-rule" />
        <p className="chantier-cover-sub">
          {ouvrageType} · {scenarioNom}
        </p>

        <div className="chantier-cover-plan print-exact">
          <ChantierPlanSVG
            geometry={geometry}
            neighbours={options.withNeighbours ? neighbours : []}
            plantings={plantings}
            numberOf={numberOf}
            year={options.year}
            width={640}
            height={360}
            compact
          />
        </div>

        <div className="chantier-cover-keys print-exact">
          {[
            { k: 'Emprise', v: fmtArea(areaM2) },
            { k: 'Sujets à planter', v: String(totalPlants) },
            { k: 'Espèces', v: String(lines.length) },
            { k: 'Strates', v: String(strateCount) },
            { k: 'Couverture An 3', v: `${coverage.y3} %` },
            { k: 'Couverture An 10', v: `${coverage.y10} %` },
          ].map((c) => (
            <div key={c.k} className="chantier-cover-key">
              <span className="chantier-cover-key-v">{c.v}</span>
              <span className="chantier-cover-key-k">{c.k}</span>
            </div>
          ))}
        </div>

        <div className="chantier-cover-foot">
          {propertyName ?? 'Propriété'}
          {commune ? ` · ${commune}` : ''} · Fréquence du Vivant · {fmtDate(editionDate)}
        </div>
      </section>

      {/* ---------- 2 · Le plan de plantation ---------- */}
      <Page>
        <Title
          eyebrow="Planche 1"
          sub={`Houppiers projetés à l’horizon An ${options.year} · emprise ${fmtArea(areaM2)} · les numéros renvoient à la liste de plantation.`}
        >
          Le plan de plantation
        </Title>

        <div className="overflow-hidden rounded-xl border border-[#e0d5b6]">
          <ChantierPlanSVG
            geometry={geometry}
            neighbours={options.withNeighbours ? neighbours : []}
            plantings={plantings}
            numberOf={numberOf}
            year={options.year}
            width={1000}
            height={660}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {STRATE_ORDER.filter((s) => plantings.some((p) => p.strate === s)).map((s) => {
            const info = STRATES[s];
            const n = plantings.filter((p) => p.strate === s).length;
            return (
              <span key={s} className="flex items-center gap-1.5 text-[8.6pt] text-[#4a4335]">
                <span
                  aria-hidden
                  className="print-exact inline-block h-[9px] w-[9px] rounded-full"
                  style={{ backgroundColor: `${info.color}40`, border: `1.4px solid ${info.color}` }}
                />
                {info.label} — {n} sujet{n > 1 ? 's' : ''}
              </span>
            );
          })}
        </div>
        <p className="mt-2 border-t border-[#e0d5b6] pt-2 text-[7.6pt] italic text-[#8a7c64]">
          Plan gravé sans fond photographique : les positions sont issues des coordonnées GPS réelles
          relevées sur place. Échelle et nord portés sur la planche.
        </p>
      </Page>

      {/* ---------- 3 · La liste de plantation ---------- */}
      {listChunks.map((rows, ci) => (
        <Page key={`list-${ci}`}>
          {ci === 0 && (
            <Title
              eyebrow="Planche 2"
              sub="Pièce à chiffrer : la colonne prix reste vierge, à compléter par le professionnel."
            >
              La liste de plantation
            </Title>
          )}
          <table className="w-full border-collapse text-[8.8pt]">
            <thead>
              <tr className="print-exact bg-[#f1ead7] text-[7.6pt] uppercase tracking-[0.14em] text-[#6b5c3c]">
                <th className="w-[8mm] border border-[#e0d5b6] px-1 py-1 text-left">N°</th>
                <th className="border border-[#e0d5b6] px-1.5 py-1 text-left">Espèce</th>
                <th className="w-[26mm] border border-[#e0d5b6] px-1.5 py-1 text-left">Strate</th>
                <th className="w-[24mm] border border-[#e0d5b6] px-1.5 py-1 text-left">Origine</th>
                <th className="w-[18mm] border border-[#e0d5b6] px-1.5 py-1 text-right">Envergure</th>
                <th className="w-[12mm] border border-[#e0d5b6] px-1.5 py-1 text-right">Qté</th>
                <th className="w-[24mm] border border-[#e0d5b6] px-1.5 py-1 text-right">Prix unit.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const info = STRATES[l.strate] ?? STRATES.herbacee;
                return (
                  <tr key={l.scientificName} className="align-top">
                    <td className="border border-[#e0d5b6] px-1 py-[3px] text-center font-bold" style={{ color: info.color }}>
                      {l.n}
                    </td>
                    <td className="border border-[#e0d5b6] px-1.5 py-[3px]">
                      <span className="font-semibold text-[#2a2419]">
                        {l.commonNameFr || l.scientificName}
                      </span>{' '}
                      <span className="font-serif italic text-[8pt] text-[#6b6151]">({l.scientificName})</span>
                    </td>
                    <td className="border border-[#e0d5b6] px-1.5 py-[3px]">
                      <StrateChip strate={l.strate} />
                    </td>
                    <td className="border border-[#e0d5b6] px-1.5 py-[3px] text-[8.2pt] text-[#5d5544]">
                      {ORIGIN_LABEL[l.origin]}
                    </td>
                    <td className="border border-[#e0d5b6] px-1.5 py-[3px] text-right">{fmtM(l.spreadM)}</td>
                    <td className="border border-[#e0d5b6] px-1.5 py-[3px] text-right font-semibold">{l.count}</td>
                    <td className="border border-[#e0d5b6] px-1.5 py-[3px]" />
                  </tr>
                );
              })}
            </tbody>
            {ci === listChunks.length - 1 && (
              <tfoot>
                <tr className="print-exact bg-[#f7f2e4] font-semibold">
                  <td className="border border-[#e0d5b6] px-1.5 py-1 text-right" colSpan={5}>
                    Total — {lines.length} espèce{lines.length > 1 ? 's' : ''}
                  </td>
                  <td className="border border-[#e0d5b6] px-1.5 py-1 text-right">{totalPlants}</td>
                  <td className="border border-[#e0d5b6] px-1.5 py-1" />
                </tr>
              </tfoot>
            )}
          </table>
          {ci === listChunks.length - 1 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {STRATE_ORDER.filter((s) => lines.some((l) => l.strate === s)).map((s) => {
                const info = STRATES[s];
                const qty = lines.filter((l) => l.strate === s).reduce((n, l) => n + l.count, 0);
                return (
                  <div
                    key={s}
                    className="print-exact rounded-lg border border-[#e0d5b6] px-2 py-1.5"
                    style={{ backgroundColor: `${info.color}0f` }}
                  >
                    <p className="text-[7.6pt] uppercase tracking-[0.16em]" style={{ color: info.color }}>
                      {info.label}
                    </p>
                    <p className="text-[11pt] font-semibold text-[#2a2419]">
                      {qty} <span className="text-[8pt] font-normal text-[#6b6151]">sujet{qty > 1 ? 's' : ''}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Page>
      ))}

      {/* ---------- 4 · Les espèces en place ---------- */}
      {chunk(inPlaceList, TILES_PER_PAGE).map((tiles, ci) => (
        <Page key={`place-${ci}`}>
          {ci === 0 && (
            <Title
              eyebrow="Planche 3"
              sub={`Ce qui pousse déjà dans l’emprise (${rigourLabel}) : à conserver, à dégager ou à recomposer — décision à prendre ensemble sur le terrain.`}
            >
              Les espèces en place
            </Title>
          )}
          <div className="grid grid-cols-4 gap-2">
            {tiles.map((e) => (
              <SpeciesTile
                key={e.key}
                photoUrl={e.photoUrl}
                title={e.commonNameFr || e.scientificName}
                latin={e.scientificName}
                strate={e.strate}
                badge={e.zone === 'dedans' ? 'dedans' : e.zone === 'lisiere' ? 'lisière' : e.zone ? 'voisinage' : undefined}
                meta={
                  e.observations
                    ? `${e.observations} obs.${e.distanceM != null && e.distanceM > 0 ? ` · ${Math.round(e.distanceM)} m` : ''}`
                    : undefined
                }
              />
            ))}
          </div>
        </Page>
      ))}

      {/* ---------- 5 · Les apports retenus ---------- */}
      {chunk(proposedTiles, TILES_PER_PAGE).map((tiles, ci) => (
        <Page key={`prop-${ci}`}>
          {ci === 0 && (
            <Title
              eyebrow="Planche 4"
              sub={`${retained.length} espèce${retained.length > 1 ? 's' : ''} retenue${retained.length > 1 ? 's' : ''} et posée${retained.length > 1 ? 's' : ''} au plan${notRetained.length ? ` · ${notRetained.length} en réserve` : ''}.`}
            >
              Les espèces proposées et retenues
            </Title>
          )}
          <div className="grid grid-cols-4 gap-2">
            {tiles.map((e) => {
              const isRetained = retained.some((r) => r.key === e.key);
              const n = numberOf.get(e.scientificName);
              return (
                <SpeciesTile
                  key={e.key}
                  photoUrl={e.photoUrl}
                  title={e.commonNameFr || e.scientificName}
                  latin={e.scientificName}
                  strate={e.strate}
                  badge={isRetained ? `retenue · n° ${n ?? '—'}` : 'en réserve'}
                  meta={`Ø ${fmtM(e.spreadM)}`}
                  functions={e.functions}
                />
              );
            })}
          </div>
        </Page>
      ))}

      {/* ---------- 6 · Photos avant aménagement ---------- */}
      {photoList.length > 0 && (
        <Page>
          <Title
            eyebrow="Planche 5"
            sub="État des lieux avant la première bêche — carnet photo de l’ouvrage."
          >
            Avant aménagement
          </Title>
          <figure className="overflow-hidden rounded-xl border border-[#e0d5b6]">
            <img
              src={printImageUrl(photoList[0].url, 'hero')}
              alt={photoList[0].caption || 'État actuel'}
              className="h-[150mm] w-full object-cover"
              crossOrigin="anonymous"
            />
            <figcaption className="flex items-center justify-between px-2 py-1.5 text-[8pt] text-[#6b6151]">
              <span>{photoList[0].caption || 'État actuel de l’emprise'}</span>
              <span>
                {photoList[0].taken_at ? fmtDate(photoList[0].taken_at) : fmtDate(photoList[0].uploaded_at)}
              </span>
            </figcaption>
          </figure>
        </Page>
      )}
      {chunk(photoList.slice(1), PHOTOS_PER_PAGE).map((batch, ci) => (
        <Page key={`ph-${ci}`}>
          <Title eyebrow="Planche 5 (suite)" sub="Le lieu, sous tous ses angles.">
            Le carnet photo de l’ouvrage
          </Title>
          <div className="grid grid-cols-2 gap-3">
            {batch.map((ph) => (
              <figure key={ph.id} className="print-avoid-break overflow-hidden rounded-xl border border-[#e0d5b6]">
                <img
                  src={printImageUrl(ph.url, 'plate')}
                  alt={ph.caption || 'Photographie de l’ouvrage'}
                  className="h-[62mm] w-full object-cover"
                  crossOrigin="anonymous"
                />
                <figcaption className="flex items-center justify-between px-2 py-1 text-[7.6pt] text-[#6b6151]">
                  <span className="truncate">{ph.caption || '—'}</span>
                  <span>{ph.taken_at ? fmtDate(ph.taken_at) : fmtDate(ph.uploaded_at)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Page>
      ))}

      {/* ---------- 7 · Repères de chantier ---------- */}
      <Page>
        <Title eyebrow="Pour le professionnel" sub="Ce que le plan engage, ce qu'il reste à décider ensemble.">
          Repères de chantier
        </Title>

        <div className="grid grid-cols-2 gap-3">
          <div className="print-exact rounded-xl border border-[#e0d5b6] bg-white/60 p-3">
            <p className="mb-1.5 text-[8pt] uppercase tracking-[0.18em] text-[#8a6d3b]">Le métré</p>
            <ul className="space-y-1 text-[9.4pt] text-[#3d3729]">
              <li>Emprise dessinée — <b>{fmtArea(areaM2)}</b></li>
              <li>Sujets à planter — <b>{totalPlants}</b></li>
              <li>Espèces distinctes — <b>{lines.length}</b></li>
              <li>
                Densité — <b>{areaM2 > 0 ? (totalPlants / areaM2).toFixed(2).replace('.', ',') : '—'}</b> sujet/m²
              </li>
              <li>
                Couverture projetée — <b>{coverage.y3} %</b> à An 3, <b>{coverage.y10} %</b> à An 10
              </li>
            </ul>
          </div>

          <div className="print-exact rounded-xl border border-[#e0d5b6] bg-white/60 p-3">
            <p className="mb-1.5 text-[8pt] uppercase tracking-[0.18em] text-[#8a6d3b]">Écartements indicatifs</p>
            <ul className="space-y-1 text-[9.4pt] text-[#3d3729]">
              {STRATE_ORDER.filter((s) => plantings.some((p) => p.strate === s)).map((s) => {
                const info = STRATES[s];
                const avg =
                  plantings.filter((p) => p.strate === s).reduce((a, p) => a + (p.spreadM || info.spreadM), 0) /
                  Math.max(1, plantings.filter((p) => p.strate === s).length);
                return (
                  <li key={s}>
                    {info.label} — entraxe conseillé <b>{fmtM(avg * 0.9)}</b>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="print-exact mt-3 rounded-xl border border-[#e0d5b6] bg-white/60 p-3">
          <p className="mb-1.5 text-[8pt] uppercase tracking-[0.18em] text-[#8a6d3b]">À valider sur le terrain</p>
          <ol className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9.2pt] text-[#3d3729]">
            {[
              'Accès chantier, stockage des végétaux et gestion des déblais.',
              'Sort réservé aux espèces en place : conservation, transplantation, dégagement.',
              'Préparation du sol : décompactage manuel, apport organique, paillage.',
              'Arrosage de reprise : réseau, cuve, ou portage.',
              'Protection contre le gibier et le piétinement la première année.',
              'Calendrier : plantation à racines nues de novembre à mars.',
            ].map((t, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="print-exact mt-[2px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#6b7c5a]/15 text-[7pt] font-bold text-[#4c5a3f]">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>

        {notes?.trim() && (
          <div className="print-exact mt-3 rounded-xl border-l-[0.8mm] border-[#c9b477] bg-white/60 p-3">
            <p className="mb-1 text-[8pt] uppercase tracking-[0.18em] text-[#8a6d3b]">Note du scénario</p>
            <p className="whitespace-pre-line font-serif text-[10.5pt] italic leading-relaxed text-[#3d3729]">
              {notes}
            </p>
          </div>
        )}

        <p className="mt-4 border-t border-[#e0d5b6] pt-2 text-[7.4pt] leading-relaxed text-[#8a7c64]">
          Dossier établi depuis le Scénographe d'ouvrage · positions GPS relevées sur place, envergures
          adultes issues du référentiel de strates, projection de croissance logistique par strate.
          Les espèces en place proviennent des observations naturalistes rattachées à la propriété
          ({rigourLabel}). Ce document est une hypothèse d'aménagement : il ne vaut pas étude technique
          ni devis. · {propertyName ?? 'Propriété'}
          {commune ? ` · ${commune}` : ''} · édité le {fmtDate(editionDate)}.
        </p>
      </Page>
    </div>
  );
};

export default ChantierPrintLayout;
