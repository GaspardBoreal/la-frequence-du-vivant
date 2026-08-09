import React from 'react';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';
import type { IcgDelta, IcgReading, SpeciesJuryResult, SpeciesVerdict } from '@/lib/chantierIcg';
import { MATCH_LABEL, PHASE_LABEL, type MediaPhase } from '@/lib/chantierIcg';
import { printImageUrl } from '@/components/propriete/print/printImageUrl';

export interface RapportSpecies {
  scientificName: string;
  commonName: string | null;
  photoUrl: string | null;
  count: number;
  bio?: boolean;
}

export interface ChantierRapportOptions {
  /** « simple » = 2 pages de synthèse ; « complet » = dossier intégral. */
  format: 'simple' | 'complet';
}

interface Props {
  propertyName?: string;
  commune?: string | null;
  chantierNom: string;
  ouvrages: string[];
  dateTravaux: string | null;
  rigourLabel: string;
  soilSentence: string;
  before: IcgReading;
  after: IcgReading | null;
  afterLabel: string;
  delta: IcgDelta | null;
  inPlace: RapportSpecies[];
  plantings: Planting[];
  photos: Array<ObjetPhoto & { phase: MediaPhase }>;
  /** Le jury des espèces de l'état initial — contributions signées à l'ICG. */
  jury?: SpeciesJuryResult | null;
  /** Noms vernaculaires FR résolus, indexés par nom scientifique. */
  juryNames?: Record<string, string>;
  options: ChantierRapportOptions;
}

const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const Page: React.FC<{ children: React.ReactNode; foot?: string }> = ({ children, foot }) => (
  <section className="chantier-print-page">
    <div className="chantier-print-root text-[#2a2419]">{children}</div>
    {foot && <p className="mt-4 text-[8pt] italic text-[#8a8272]">{foot}</p>}
  </section>
);

const Title: React.FC<{ eyebrow: string; children: React.ReactNode; sub?: string }> = ({
  eyebrow,
  children,
  sub,
}) => (
  <header className="mb-4">
    <p className="text-[8pt] uppercase tracking-[0.28em] text-[#8a6d3b]">{eyebrow}</p>
    <h3 className="font-serif text-[21pt] italic leading-tight text-[#2a2419]">{children}</h3>
    {sub && <p className="mt-1 text-[9pt] italic text-[#5d5544]">{sub}</p>}
  </header>
);

const IcgTable: React.FC<{ reading: IcgReading; delta: IcgDelta | null }> = ({ reading, delta }) => (
  <table className="w-full border-collapse text-[8.6pt]">
    <thead>
      <tr className="border-b border-[#c8a24a]">
        <th className="py-1 text-left font-normal uppercase tracking-[0.12em] text-[#8a6d3b]">Critère</th>
        <th className="py-1 text-left font-normal uppercase tracking-[0.12em] text-[#8a6d3b]">Sol lu</th>
        <th className="py-1 text-left font-normal uppercase tracking-[0.12em] text-[#8a6d3b]">Flore lue</th>
        <th className="py-1 text-left font-normal uppercase tracking-[0.12em] text-[#8a6d3b]">Verdict</th>
        <th className="py-1 text-right font-normal uppercase tracking-[0.12em] text-[#8a6d3b]">Pts</th>
        {delta && <th className="py-1 text-right font-normal uppercase tracking-[0.12em] text-[#8a6d3b]">Δ</th>}
      </tr>
    </thead>
    <tbody>
      {reading.detail.rows.map((r, i) => (
        <tr key={r.key} className="border-b border-[#e3ddcd]">
          <td className="py-1 pr-2">{r.label}</td>
          <td className="py-1 pr-2 text-[#5d5544]">{r.soil}</td>
          <td className="py-1 pr-2 text-[#5d5544]">{r.flora}</td>
          <td className="py-1 pr-2">{MATCH_LABEL[r.match]}</td>
          <td className="py-1 text-right tabular-nums">{r.rowPoints}/2</td>
          {delta && (
            <td className="py-1 text-right tabular-nums">
              {delta.rows[i]?.gain > 0 ? `+${delta.rows[i].gain}` : delta.rows[i]?.gain || '—'}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);

const SpeciesPlate: React.FC<{ list: RapportSpecies[]; title: string; eyebrow: string }> = ({
  list,
  title,
  eyebrow,
}) => (
  <>
    <Title eyebrow={eyebrow} sub={`${list.length} espèce${list.length > 1 ? 's' : ''}`}>
      {title}
    </Title>
    <div className="grid grid-cols-3 gap-3">
      {list.map((s) => (
        <figure key={s.scientificName} className="break-inside-avoid">
          {s.photoUrl ? (
            <img
              src={printImageUrl(s.photoUrl, 'thumb')}
              alt={s.commonName || s.scientificName}
              className="h-[42mm] w-full rounded-[3px] object-cover"
            />
          ) : (
            <span className="flex h-[42mm] w-full items-center justify-center rounded-[3px] bg-[#efe9db] text-[8pt] text-[#8a8272]">
              sans image
            </span>
          )}
          <figcaption className="mt-1 leading-tight">
            <span className="block text-[9pt] font-semibold">
              {s.commonName || s.scientificName}
            </span>
            <span className="block text-[8pt] italic text-[#5d5544]">{s.scientificName}</span>
            {s.count > 0 && (
              <span className="block text-[7.6pt] text-[#8a8272]">
                {s.count} observation{s.count > 1 ? 's' : ''}
                {s.bio ? ' · bio-indicatrice' : ''}
              </span>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  </>
);

/** Le dossier papier du chantier : ce qui était, ce qui sera, et pourquoi. */

/** Les quatre curseurs, version encre : lecture immédiate avant le tableau. */
const PrintScales: React.FC<{
  before: ConcordanceDetail;
  after: ConcordanceDetail | null;
  afterLabel: string;
}> = ({ before, after, afterLabel }) => {
  const b = buildScaleReadings(before, true);
  const a = after ? buildScaleReadings(after, true) : null;
  const pos = (n: number) => ((n - 0.5) / 5) * 100;

  return (
    <div className="mb-4 rounded border border-[#d8cfbb] p-3">
      <p className="mb-2 text-[8pt] uppercase tracking-[0.2em] text-[#8a6d3b]">
        Ce que dit le site — avant (rond clair) / {afterLabel.toLowerCase()} (rond plein)
      </p>
      <div className="space-y-2.5">
        {b.map((r, i) => {
          const av = r.flora;
          const ap = a ? a[i].flora : null;
          return (
            <div key={r.axis.id}>
              <div className="flex justify-between text-[8.4pt]">
                <span className="font-semibold">{r.axis.label}</span>
                <span>
                  {av ? r.axis.steps[av - 1] : '—'}
                  {ap != null && ap !== av ? ` → ${r.axis.steps[ap - 1]}` : ''}
                </span>
              </div>
              <div className="relative mt-1 h-[6px] rounded-full bg-[#ece5d6]">
                {av != null && (
                  <span
                    className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8a6d3b] bg-white"
                    style={{ left: `${pos(av)}%` }}
                  />
                )}
                {ap != null && (
                  <span
                    className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8a6d3b]"
                    style={{ left: `${pos(ap)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[7.4pt] text-[#5d5544]">
                <span>{r.axis.left}</span>
                <span>{r.axis.right}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChantierRapportLayout: React.FC<Props> = ({
  propertyName,
  commune,
  chantierNom,
  ouvrages,
  dateTravaux,
  rigourLabel,
  soilSentence,
  before,
  after,
  afterLabel,
  delta,
  inPlace,
  plantings,
  photos,
  jury,
  juryNames,
  options,
}) => {
  const nameOf = (v: SpeciesVerdict) =>
    juryNames?.[v.scientificName] || v.commonName || v.plantName;
  const complet = options.format === 'complet';
  const proposed: RapportSpecies[] = React.useMemo(() => {
    const by = new Map<string, RapportSpecies>();
    plantings.forEach((p) => {
      const k = p.scientificName;
      const prev = by.get(k);
      if (prev) prev.count += 1;
      else
        by.set(k, {
          scientificName: k,
          commonName: p.commonNameFr ?? null,
          photoUrl: p.photoUrl ?? null,
          count: 1,
        });
    });
    return Array.from(by.values());
  }, [plantings]);

  const foot = `${propertyName || 'Propriété'}${commune ? ` · ${commune}` : ''} — Le Chantier · ${chantierNom}`;

  return (
    <div className="chantier-print-body">
      {/* Page 1 — couverture et bilan */}
      <Page foot={foot}>
        <p className="text-[8pt] uppercase tracking-[0.32em] text-[#8a6d3b]">
          Dossier de chantier · avant / après
        </p>
        <h1 className="mt-2 font-serif text-[34pt] italic leading-[1.05]">{chantierNom}</h1>
        <p className="mt-1 text-[10pt] text-[#5d5544]">
          {propertyName}
          {commune ? ` · ${commune}` : ''} — travaux du {fmtDate(dateTravaux)}
        </p>

        <div className="mt-5 flex items-end gap-8 border-y border-[#c8a24a] py-4">
          <div>
            <p className="text-[8pt] uppercase tracking-[0.2em] text-[#8a6d3b]">Avant</p>
            <p className="font-serif text-[40pt] leading-none">{before.detail.icg}</p>
            <p className="text-[8.5pt] text-[#5d5544]">/ 100 · {before.detail.band}</p>
          </div>
          <div>
            <p className="text-[8pt] uppercase tracking-[0.2em] text-[#8a6d3b]">{afterLabel}</p>
            <p className="font-serif text-[40pt] leading-none">{after ? after.detail.icg : '—'}</p>
            <p className="text-[8.5pt] text-[#5d5544]">
              {after ? `/ 100 · ${after.detail.band}` : 'non renseigné'}
            </p>
          </div>
          {delta && (
            <div className="ml-auto text-right">
              <p className="font-serif text-[32pt] leading-none">
                {delta.icg > 0 ? `+${delta.icg}` : delta.icg}
              </p>
              <p className="text-[8.5pt] text-[#5d5544]">points d'ICG</p>
            </div>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[9pt]">
          <div>
            <dt className="text-[8pt] uppercase tracking-[0.14em] text-[#8a6d3b]">Ouvrages</dt>
            <dd>{ouvrages.join(' · ')}</dd>
          </div>
          <div>
            <dt className="text-[8pt] uppercase tracking-[0.14em] text-[#8a6d3b]">Périmètre retenu</dt>
            <dd>{rigourLabel}</dd>
          </div>
          <div>
            <dt className="text-[8pt] uppercase tracking-[0.14em] text-[#8a6d3b]">Lecture du sol</dt>
            <dd>{soilSentence}</dd>
          </div>
          <div>
            <dt className="text-[8pt] uppercase tracking-[0.14em] text-[#8a6d3b]">Cortège en place</dt>
            <dd>
              {inPlace.length} espèce{inPlace.length > 1 ? 's' : ''} ·{' '}
              {before.indicatorCount} bio-indicatrice{before.indicatorCount > 1 ? 's' : ''}
            </dd>
          </div>
        </dl>

        {delta && delta.drivers.length > 0 && (
          <div className="mt-5">
            <p className="text-[8pt] uppercase tracking-[0.2em] text-[#8a6d3b]">
              Ce qui explique l'écart
            </p>
            <ul className="mt-1 space-y-0.5 text-[9.5pt]">
              {delta.drivers.map((d) => (
                <li key={d.key}>
                  <span className="font-semibold">{d.label}</span> —{' '}
                  {MATCH_LABEL[d.before.match].toLowerCase()} →{' '}
                  {MATCH_LABEL[d.after.match].toLowerCase()} (
                  {d.gain > 0 ? `+${d.gain}` : d.gain} pt)
                </li>
              ))}
            </ul>
          </div>
        )}
      </Page>

      {/* Page 2 — le calcul, ligne à ligne */}
      <Page foot={foot}>
        <Title
          eyebrow="Indice de concordance jardin"
          sub="Barème D.S. — même niveau 2 points, un cran d'écart 1 point, deux crans 0. Total sur 16, ramené sur 100."
        >
          Comment l'ICG est calculé
        </Title>
        <PrintScales before={before.detail} after={after ? after.detail : null} afterLabel={afterLabel} />

        <p className="mb-2 text-[9pt] font-semibold">Avant travaux</p>
        <IcgTable reading={before} delta={null} />
        <p className="mt-1.5 text-[8.6pt] italic text-[#5d5544]">{before.sentence}</p>

        {after && (
          <>
            <p className="mb-2 mt-5 text-[9pt] font-semibold">{afterLabel}</p>
            <IcgTable reading={after} delta={delta} />
            <p className="mt-1.5 text-[8.6pt] italic text-[#5d5544]">{after.sentence}</p>
          </>
        )}
      </Page>

      {/* Page 3 — le jury des espèces */}
      {jury && jury.verdicts.length > 0 && (
        <Page foot={foot}>
          <Title
            eyebrow="Comprendre le score"
            sub="Contribution obtenue par retrait à un : l'ICG est recalculé sans l'espèce, l'écart est sa part."
          >
            Qui fait monter, qui fait descendre
          </Title>
          <p className="mb-3 text-[9.5pt] italic text-[#5d5544]">{jury.sentence}</p>

          <div className="grid grid-cols-2 gap-5">
            {[
              { t: 'Elles confirment la lecture du sol', list: complet ? jury.up : jury.up.slice(0, 3) },
              { t: 'Elles contredisent la lecture du sol', list: complet ? jury.down : jury.down.slice(0, 3) },
            ].map((col) => (
              <div key={col.t}>
                <p className="border-b border-[#c8a24a] pb-1 text-[8pt] uppercase tracking-[0.14em] text-[#8a6d3b]">
                  {col.t}
                </p>
                {col.list.length === 0 ? (
                  <p className="mt-1.5 text-[8.6pt] italic text-[#8a8272]">Aucune.</p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {col.list.map((v) => (
                      <li key={v.plantId} className="flex items-baseline gap-2 text-[9pt]">
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold">{nameOf(v)}</span>{' '}
                          <span className="italic text-[#5d5544]">{v.scientificName}</span>
                          {v.poles.length > 0 && (
                            <span className="block text-[7.8pt] text-[#8a8272]">
                              {v.poles.map((p) => p.short).join(' · ')}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {v.deltaIcg > 0 ? `+${v.deltaIcg}` : v.deltaIcg}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {complet && jury.unmatched.length > 0 && (
            <p className="mt-5 text-[8.4pt] text-[#8a8272]">
              Hors référentiel bio-indicateur, sans influence sur l'ICG :{' '}
              {jury.unmatched
                .map((s) => juryNames?.[s.scientificName] || s.commonName || s.scientificName)
                .join(' · ')}
              .
            </p>
          )}
        </Page>
      )}

      {/* Pages suivantes — dossier complet */}
      {complet && inPlace.length > 0 && (
        <Page foot={foot}>
          <SpeciesPlate
            eyebrow="Planche 1 · état initial"
            title="Les espèces en place"
            list={inPlace}
          />
        </Page>
      )}

      {complet && proposed.length > 0 && (
        <Page foot={foot}>
          <SpeciesPlate
            eyebrow="Planche 2 · projet"
            title="Les apports retenus"
            list={proposed}
          />
        </Page>
      )}

      {photos.length > 0 && (
        <Page foot={foot}>
          <Title eyebrow="Preuves photographiques" sub={`${photos.length} vue${photos.length > 1 ? 's' : ''}`}>
            Avant, pendant, après
          </Title>
          <div className="grid grid-cols-2 gap-3">
            {(complet ? photos : photos.slice(0, 6)).map((p) => (
              <figure key={p.id} className="break-inside-avoid">
                {p.url && (
                  <img
                    src={printImageUrl(p.url, 'plate')}
                    alt={p.caption || PHASE_LABEL[p.phase]}
                    className="h-[62mm] w-full rounded-[3px] object-cover"
                  />
                )}
                <figcaption className="mt-1 text-[8pt] text-[#5d5544]">
                  {PHASE_LABEL[p.phase]}
                  {p.taken_at ? ` · ${fmtDate(p.taken_at)}` : ''}
                  {p.caption ? ` — ${p.caption}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </Page>
      )}
    </div>
  );
};

export default ChantierRapportLayout;
