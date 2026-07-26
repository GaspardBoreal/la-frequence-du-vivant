import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Activity, AlertTriangle, Worm } from 'lucide-react';
import { LifeSignIcon } from './LifePictos';
import {
  LIFE_CLASS_MAP,
  LIFE_CLASS_ORDER,
  LIFE_SIGNS,
  LIFE_SIGN_MAP,
  LIFE_TEST_LABELS,
  type LifeAggregate,
  type LifeTestId,
} from './lifeTests';

export const LifeResultsSummary: React.FC<{
  agg: LifeAggregate;
  total: number;
  testCounts: Record<LifeTestId, number>;
}> = ({ agg, total, testCounts }) => {
  const dominant = agg.dominant ? LIFE_CLASS_MAP[agg.dominant] : null;
  const maxSign = Math.max(1, ...LIFE_SIGNS.map((s) => agg.signCounts[s.id]));

  return (
    <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
          <Activity className="w-3 h-3" /> Synthèse de la vie du sol
        </div>
        <span className="text-[11px] text-[hsl(var(--ds-forest-deep))]/75">
          <span className="font-semibold">{agg.filled}</span> / {total} prélèvements renseignés
        </span>
      </div>

      {/* Répartition des vitalités */}
      <div className="h-3 w-full rounded-full overflow-hidden bg-[hsl(var(--ds-forest))]/10 flex">
        {LIFE_CLASS_ORDER.map((id) =>
          agg.classCounts[id] > 0 ? (
            <motion.div
              key={id}
              initial={{ width: 0 }}
              animate={{ width: `${(agg.classCounts[id] / Math.max(agg.filled, 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: LIFE_CLASS_MAP[id].color }}
              title={`${LIFE_CLASS_MAP[id].label} : ${agg.classCounts[id]}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {LIFE_CLASS_ORDER.filter((id) => agg.classCounts[id] > 0).map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/80"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: LIFE_CLASS_MAP[id].color }} />
            {LIFE_CLASS_MAP[id].label} · <span className="font-semibold">{agg.classCounts[id]}</span>
          </span>
        ))}
      </div>

      {/* Fréquence des indices */}
      {agg.filled > 0 && (
        <div className="mt-4 grid sm:grid-cols-2 gap-x-5 gap-y-2">
          {LIFE_SIGNS.map((s) => {
            const n = agg.signCounts[s.id];
            return (
              <div key={s.id} className="flex items-center gap-2">
                <span className="shrink-0 [&_svg]:w-4 [&_svg]:h-4 opacity-90">
                  <LifeSignIcon id={s.id} color={n > 0 ? s.color : 'hsl(var(--ds-forest))'} />
                </span>
                <span
                  className={`text-[10.5px] w-[104px] shrink-0 ${
                    n > 0
                      ? 'font-semibold text-[hsl(var(--ds-forest-deep))]'
                      : 'text-[hsl(var(--ds-forest-deep))]/45'
                  }`}
                >
                  {s.short}
                </span>
                <span className="flex-1 h-2 rounded-full bg-[hsl(var(--ds-forest))]/10 overflow-hidden">
                  <motion.span
                    className="block h-full rounded-full"
                    style={{ background: s.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(n / maxSign) * 100}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
                <span className="text-[10.5px] w-6 text-right text-[hsl(var(--ds-forest-deep))]/70">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Chiffres clés */}
      {agg.filled > 0 && (
        <div className="mt-3.5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/80">
          <span>
            indice de vie moyen{' '}
            <span className="font-serif text-lg" style={{ color: dominant?.color }}>
              {Math.round(agg.averageScore ?? 0)}
            </span>
            /100
          </span>
          {agg.minScore != null && agg.maxScore != null && (
            <span>
              min <span className="font-semibold">{agg.minScore}</span> · max{' '}
              <span className="font-semibold">{agg.maxScore}</span>
            </span>
          )}
          {agg.averageWorms != null && (
            <span className="inline-flex items-center gap-1.5">
              <Worm className="w-3.5 h-3.5 text-[#c96a5a]" />
              <span className="font-semibold">{agg.averageWorms.toFixed(1)}</span> vers / bêchée
              <span className="opacity-60">({agg.wormSamples} compté{agg.wormSamples > 1 ? 's' : ''})</span>
            </span>
          )}
          <span>
            {agg.union.length} indice{agg.union.length > 1 ? 's' : ''} présent
            {agg.union.length > 1 ? 's' : ''} sur le site
          </span>
        </div>
      )}

      {/* Lecture dominante */}
      {dominant && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border p-3"
          style={{ borderColor: `${dominant.color}66`, background: `${dominant.color}14` }}
        >
          <div
            className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase"
            style={{ color: dominant.color }}
          >
            <Sparkles className="w-3 h-3" />
            {agg.contrasted ? 'Vitalités contrastées · dominante' : 'Vitalité dominante'}
          </div>
          <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] mt-0.5">
            {dominant.label} · {dominant.verb}
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
            {dominant.reading}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/75 italic">
            {dominant.advice}
          </p>
        </motion.div>
      )}

      {agg.contrasted && (
        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-gold))]/[0.1] p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-[1px] text-[hsl(var(--ds-gold))]" />
          <span className="text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/85">
            <span className="font-semibold">Sol contrasté · </span>
            l’activité biologique varie fortement d’un prélèvement à l’autre : conduire les zones
            pauvres séparément et s’inspirer des zones les plus vivantes.
          </span>
        </div>
      )}

      {/* Indices dominants en pastilles */}
      {agg.union.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {agg.union.map((id) => (
            <span
              key={id}
              className="rounded-full border px-2 py-[2px] text-[10px] font-semibold"
              style={{
                borderColor: `${LIFE_SIGN_MAP[id].color}66`,
                background: `${LIFE_SIGN_MAP[id].color}14`,
                color: LIFE_SIGN_MAP[id].color,
              }}
            >
              {LIFE_SIGN_MAP[id].label} · {agg.signCounts[id]}
            </span>
          ))}
        </div>
      )}

      {/* Tests employés */}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {(Object.keys(testCounts) as LifeTestId[]).map((t) =>
          testCounts[t] > 0 ? (
            <span
              key={t}
              className="rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-2.5 py-[2px] text-[10px] text-[hsl(var(--ds-forest-deep))]/75"
            >
              {LIFE_TEST_LABELS[t]} · {testCounts[t]}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
};
