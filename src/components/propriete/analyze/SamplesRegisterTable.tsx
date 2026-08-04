import React from 'react';
import { MapPin, Check, AlertTriangle } from 'lucide-react';
import type { SoilReading } from './soilReading';
import { openSampleCore } from './sample/sampleDrawerStore';
import { StrataSeal } from './sample/StrataSeal';
import { RESULT_SHORT, RESULT_ORDER, TEST_LABELS, type StructureResultId } from './structureTests';
import {
  TEXTURE_SHORT,
  TEXTURE_ORDER,
  TEXTURE_TEST_LABELS,
  BOUDIN_FORM_MAP,
  type TextureResultId,
} from './textureTests';
import { PH_CLASS_MAP, PH_TEST_LABELS, classifyPh, phPercent, PH_GRADIENT } from './phTests';
import {
  LIFE_CLASS_MAP,
  LIFE_SIGN_MAP,
  LIFE_TEST_LABELS,
  scoreLife,
  type LifeSignId,
} from './lifeTests';

const MICRO = 'text-[8.5px] uppercase tracking-[0.16em] text-[hsl(var(--ds-forest))]/60';
const VALUE = 'font-semibold text-[hsl(var(--ds-forest-deep))]';
const Dash = () => <span className="text-[hsl(var(--ds-forest-deep))]/30">—</span>;

/** Micro-barre 3 crans : compacte → grumeleuse → très meuble. */
const StructureGauge: React.FC<{ value: StructureResultId }> = ({ value }) => {
  const idx = RESULT_ORDER.indexOf(value);
  return (
    <span className="mt-1 inline-flex items-center gap-[3px]" aria-hidden>
      {RESULT_ORDER.map((id, i) => (
        <span
          key={id}
          className="register-gauge-cran"
          style={{
            display: 'inline-block',
            width: 12,
            height: 3,
            borderRadius: 2,
            background:
              i === idx
                ? value === 'compacte'
                  ? '#b4603f'
                  : value === 'grumeleuse'
                    ? '#2f7d4f'
                    : '#c9a227'
                : 'hsl(var(--ds-forest) / 0.15)',
          }}
        />
      ))}
    </span>
  );
};

/** Micro-jauge texture : position sable → limon → argile. */
const TextureGauge: React.FC<{ value: TextureResultId }> = ({ value }) => {
  const idx = TEXTURE_ORDER.indexOf(value);
  return (
    <span className="mt-1 inline-flex items-center gap-[3px]" aria-hidden>
      {TEXTURE_ORDER.map((id, i) => (
        <span
          key={id}
          style={{
            display: 'inline-block',
            width: 12,
            height: 3,
            borderRadius: 2,
            background:
              i === idx
                ? ['#d8b476', '#a8925f', '#8c5a4a'][i]
                : 'hsl(var(--ds-forest) / 0.15)',
          }}
        />
      ))}
    </span>
  );
};

/** Jauge pH sur l'échelle 4 → 9. */
const PhGauge: React.FC<{ value: number }> = ({ value }) => (
  <span
    className="register-ph-gauge mt-1 block relative"
    style={{
      height: 4,
      width: 56,
      borderRadius: 3,
      background: PH_GRADIENT,
    }}
    aria-hidden
  >
    <span
      style={{
        position: 'absolute',
        top: -2,
        left: `calc(${phPercent(value)}% - 3px)`,
        width: 6,
        height: 8,
        borderRadius: 2,
        background: 'hsl(var(--ds-forest-deep))',
        border: '1px solid #fff',
      }}
    />
  </span>
);

const LifeGauge: React.FC<{ score: number; color: string }> = ({ score, color }) => (
  <span
    className="register-life-gauge mt-1 block relative"
    style={{ height: 3, width: 56, borderRadius: 2, background: 'hsl(var(--ds-forest) / 0.15)' }}
    aria-hidden
  >
    <span
      style={{
        position: 'absolute',
        inset: 0,
        width: `${Math.max(3, Math.min(100, score))}%`,
        borderRadius: 2,
        background: color,
      }}
    />
  </span>
);

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <th
    className={`px-2.5 py-2.5 font-bold text-[8.5px] uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/85 ${className}`}
  >
    {children}
  </th>
);

export const SamplesRegisterTable: React.FC<{
  reading: SoilReading;
  printOnly?: boolean;
  proprieteId?: string;
}> = ({ reading: r, printOnly = false, proprieteId }) => {
  const n = r.samples.length;
  const named = r.samples.filter((s) => (s.location ?? '').trim().length > 0).length;
  const phClass = r.ph.dominant ? PH_CLASS_MAP[r.ph.dominant] : null;
  const lifeClass = r.life.dominant ? LIFE_CLASS_MAP[r.life.dominant] : null;
  const complete = n - r.incomplete.length;

  return (
    <div className="samples-register overflow-x-auto rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] print:rounded-none">
      <table className="w-full min-w-[680px] text-left text-[11px] border-collapse print:min-w-0">
        <colgroup>
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <thead className="samples-register-head">
          <tr className="bg-[hsl(var(--ds-forest))]/[0.07] border-b-2 border-[hsl(var(--ds-gold))]/70">
            <Th>Prélèvement</Th>
            <Th>Lieu</Th>
            <Th>Structure</Th>
            <Th>Texture</Th>
            <Th>pH</Th>
            <Th>Vie du sol</Th>
            <Th className="text-right">État</Th>
          </tr>
        </thead>


        <tbody>
          {r.samples.map((s, rowIdx) => {
            const incomplete = r.incomplete.includes(s.label);
            const ph = typeof s.ph_value === 'number' ? s.ph_value : null;
            const phc = ph != null ? classifyPh(ph) : null;
            const signIds = (s.life_signs ?? []) as LifeSignId[];
            const signs = signIds.map((id) => LIFE_SIGN_MAP[id]?.label).filter(Boolean);
            const life =
              signIds.length > 0 || typeof s.worm_count === 'number'
                ? scoreLife(signIds, s.worm_count ?? null)
                : null;
            const lifeK = life ? LIFE_CLASS_MAP[life.klass] : null;

            return (
              <tr
                key={s.id}
                className={
                  'samples-register-row border-t border-[hsl(var(--ds-line))] align-top ' +
                  (rowIdx % 2 === 1 ? 'bg-[hsl(var(--ds-forest))]/[0.025] ' : '') +
                  (printOnly ? '' : 'transition-colors hover:bg-[hsl(var(--ds-gold))]/10')
                }
              >
                {/* # */}
                <td className="px-2.5 py-2.5">
                  <span className="flex items-start gap-2">
                    {printOnly ? (
                      <span className="mt-[1px] w-6 h-6 shrink-0 rounded-full bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] flex items-center justify-center text-[11px] font-bold">
                        {s.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSampleCore(s.id, r.samples, proprieteId)}
                        title={`Ouvrir la fiche carotte ${s.label}`}
                        className="mt-[1px] w-6 h-6 shrink-0 rounded-full bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] flex items-center justify-center text-[11px] font-bold transition hover:scale-110 hover:bg-[hsl(var(--ds-gold))] hover:text-[hsl(var(--ds-forest-deep))]"
                      >
                        {s.label}
                      </button>
                    )}
                    <span className="min-w-0">
                      {s.lat != null && s.lng != null ? (
                        <>
                          <span className="print-nowrap inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ds-gold))]">
                            <MapPin className="w-2.5 h-2.5" /> Géolocalisé
                          </span>
                          <span className="register-coords print-nowrap block text-[8.5px] tabular-nums text-[hsl(var(--ds-forest))]/55">
                            {s.lat.toFixed(5)} · {s.lng.toFixed(5)}
                          </span>
                        </>
                      ) : (
                        <span className={MICRO}>Non situé</span>
                      )}
                    </span>
                  </span>
                </td>

                {/* Lieu */}
                <td className="px-2.5 py-2.5">
                  {s.location?.trim() ? (
                    <span className="text-[hsl(var(--ds-forest-deep))]/85">{s.location.trim()}</span>
                  ) : (
                    <span className="italic text-[hsl(var(--ds-forest-deep))]/35">sans repère</span>
                  )}
                </td>

                {/* Structure */}
                <td className="px-2.5 py-2.5">
                  {s.structure_result ? (
                    <>
                      <span className={VALUE}>{RESULT_SHORT[s.structure_result]}</span>
                      <StructureGauge value={s.structure_result} />
                      <span className={`block ${MICRO}`}>
                        {s.structure_test ? TEST_LABELS[s.structure_test] : 'test non précisé'}
                      </span>
                    </>
                  ) : (
                    <Dash />
                  )}
                </td>

                {/* Texture */}
                <td className="px-2.5 py-2.5">
                  {s.texture_result ? (
                    <>
                      <span className={VALUE}>{TEXTURE_SHORT[s.texture_result]}</span>
                      <TextureGauge value={s.texture_result} />
                      <span className={`block ${MICRO}`}>
                        {s.texture_test ? TEXTURE_TEST_LABELS[s.texture_test] : 'test non précisé'}
                        {s.boudin_form ? ` · ${BOUDIN_FORM_MAP[s.boudin_form].label}` : ''}
                      </span>
                    </>
                  ) : (
                    <Dash />
                  )}
                </td>

                {/* pH */}
                <td className="px-2.5 py-2.5">
                  {ph != null ? (
                    <>
                      <span className={`${VALUE} tabular-nums`}>{ph.toFixed(1)}</span>
                      <PhGauge value={ph} />
                      <span className={`block ${MICRO}`}>
                        {phc?.short}
                        {s.ph_test ? ` · ${PH_TEST_LABELS[s.ph_test]}` : ''}
                      </span>
                    </>
                  ) : (
                    <Dash />
                  )}
                </td>

                {/* Vie du sol */}
                <td className="px-2.5 py-2.5">
                  {life ? (
                    <>
                      <span className={`${VALUE} tabular-nums`}>
                        {typeof s.worm_count === 'number'
                          ? `${s.worm_count} ver${s.worm_count > 1 ? 's' : ''}`
                          : 'sans comptage'}
                        <span className="ml-1.5 font-normal text-[hsl(var(--ds-forest))]/70">
                          indice {life.score.toFixed(1)}/100
                        </span>
                      </span>
                      <LifeGauge score={life.score} color={lifeK?.color ?? '#2f7d4f'} />
                      <span className="block text-[8.5px] leading-snug text-[hsl(var(--ds-forest))]/70">
                        {signs.length ? signs.join(' · ') : 'aucun indice coché'}
                        {s.life_test ? ` — ${LIFE_TEST_LABELS[s.life_test]}` : ''}
                      </span>
                    </>
                  ) : (
                    <Dash />
                  )}
                </td>

                {/* État */}
                <td className="px-2.5 py-2.5 text-right print:whitespace-normal whitespace-nowrap">
                  <span className="inline-flex flex-col items-end gap-1 max-w-full">
                    <StrataSeal
                      className="samples-register-seal"
                      sample={s}
                      size="row"
                      mono={printOnly}
                      onSelect={
                        printOnly
                          ? undefined
                          : (block) => openSampleCore(s.id, r.samples, proprieteId, block)
                      }
                    />
                    {incomplete ? (
                      <span className="print-nowrap inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-amber-800">
                        <AlertTriangle className="w-2.5 h-2.5" /> À compléter
                      </span>
                    ) : (
                      <span className="print-nowrap inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-forest))]/30 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[hsl(var(--ds-forest))]">
                        <Check className="w-2.5 h-2.5" /> Complet
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* ===== Synthèse par colonne ===== */}
        <tfoot className="samples-register-foot">
          <tr className="border-t-2 border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-forest))]/[0.06] align-top">
            <td className="px-2.5 py-3">
              <span className="block text-[8.5px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--ds-forest))]">
                Synthèse
              </span>
              <span className={`${VALUE} block mt-0.5`}>
                {n} prélèvement{n > 1 ? 's' : ''}
              </span>
              <span className={`block ${MICRO}`}>{r.placedSamples} géolocalisé{r.placedSamples > 1 ? 's' : ''}</span>
            </td>

            <td className="px-2.5 py-3">
              <span className={VALUE}>
                {named} / {n}
              </span>
              <span className={`block ${MICRO}`}>repères nommés</span>
            </td>

            <td className="px-2.5 py-3">
              {r.structure.dominant ? (
                <>
                  <span className={VALUE}>{RESULT_SHORT[r.structure.dominant]}</span>
                  <span className={`block ${MICRO}`}>
                    {r.structure.filled} / {n} testés
                    {r.structure.contrasted ? ' · sol contrasté' : ''}
                  </span>
                </>
              ) : (
                <Dash />
              )}
            </td>

            <td className="px-2.5 py-3">
              {r.texture.dominant ? (
                <>
                  <span className={VALUE}>{TEXTURE_SHORT[r.texture.dominant]}</span>
                  <span className={`block ${MICRO}`}>
                    {r.texture.filled} / {n} testés
                    {r.texture.contrasted ? ' · texture contrastée' : ''}
                  </span>
                </>
              ) : (
                <Dash />
              )}
            </td>

            <td className="px-2.5 py-3">
              {r.ph.average != null ? (
                <>
                  <span className={`${VALUE} tabular-nums`}>{r.ph.average.toFixed(1)}</span>
                  <span className={`block ${MICRO} tabular-nums`}>
                    {r.ph.min?.toFixed(1)} – {r.ph.max?.toFixed(1)}
                    {phClass ? ` · ${phClass.short}` : ''}
                  </span>
                </>
              ) : (
                <Dash />
              )}
            </td>

            <td className="px-2.5 py-3">
              {r.life.filled > 0 ? (
                <>
                  <span className={`${VALUE} tabular-nums`}>
                    {r.life.averageWorms != null
                      ? `${r.life.averageWorms.toFixed(1)} vers / bêchée`
                      : 'sans comptage'}
                  </span>
                  <span className={`block ${MICRO} tabular-nums`}>
                    indice {r.life.averageScore != null ? r.life.averageScore.toFixed(1) : '—'}/100
                    {lifeClass ? ` · ${lifeClass.label}` : ''}
                  </span>
                </>
              ) : (
                <Dash />
              )}
            </td>

            <td className="px-2.5 py-3 text-right">
              <span className={`${VALUE} tabular-nums`}>
                {complete} / {n}
              </span>
              <span className={`block ${MICRO}`}>
                {r.incomplete.length === 0 ? 'registre complet' : `${r.incomplete.join(' · ')} à compléter`}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
