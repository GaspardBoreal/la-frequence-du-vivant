import React from 'react';
import { ArrowDownWideNarrow, ArrowDownAZ, Check, RotateCcw, Sprout, Undo2 } from 'lucide-react';
import {
  SPECIES_STATUSES,
  SPECIES_STATUS_HINT,
  SPECIES_STATUS_LABEL,
  SPECIES_STATUS_TONE,
  speciesKey,
  type CortegeEntry,
  type SpeciesJuryResult,
  type SpeciesStatus,
  type SpeciesVerdict,
} from '@/lib/chantierIcg';
import SpeciesWeightBar, { weightColor } from './SpeciesWeightBar';
import CortegeBalance from './CortegeBalance';

interface Props {
  entries: CortegeEntry[];
  /** Nom d'affichage (vernaculaire FR résolu par le parent). */
  labelFor: (e: CortegeEntry) => string;
  /** ICG simulé pour un jeu de statuts en brouillon. */
  preview: (draft: Record<string, SpeciesStatus>) => { before: number; after: number | null };
  /** Statuts déjà enregistrés (surcharges manuelles). */
  saved: Record<string, SpeciesStatus>;
  /** Le jury « avant travaux » : poids de chaque espèce sur l'ICG. */
  jury?: SpeciesJuryResult | null;
  onCommit: (changes: Record<string, SpeciesStatus | null>) => Promise<boolean> | void;
  onResetAll: () => void;
}


/**
 * « Le tri du cortège » — chaque espèce du lot reçoit son statut avant/après.
 * Rien n'est écrit tant qu'on n'a pas validé : l'écart d'ICG est montré en
 * brouillon, pour que la décision se prenne en connaissance de cause.
 */
export const CortegeTriage: React.FC<Props> = ({
  entries,
  labelFor,
  preview,
  saved,
  jury,
  onCommit,
  onResetAll,
}) => {
  const [draft, setDraft] = React.useState<Record<string, SpeciesStatus>>({});
  const [busy, setBusy] = React.useState(false);
  const [order, setOrder] = React.useState<'weight' | 'alpha'>('weight');
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);

  /** Poids ICG par espèce, indexé sur le nom scientifique normalisé. */
  const weights = React.useMemo(() => {
    const map = new Map<string, SpeciesVerdict>();
    for (const v of jury?.verdicts ?? []) map.set(speciesKey(v.scientificName), v);
    return map;
  }, [jury]);

  const maxWeight = React.useMemo(
    () => Math.max(1, ...(jury?.verdicts ?? []).map((v) => Math.abs(v.deltaPoints))),
    [jury],
  );


  const current = React.useMemo(() => {
    const out: Record<string, SpeciesStatus> = {};
    for (const e of entries) out[speciesKey(e.scientificName)] = draft[speciesKey(e.scientificName)] ?? e.status;
    return out;
  }, [entries, draft]);

  const changes = React.useMemo(() => {
    const out: Record<string, SpeciesStatus | null> = {};
    for (const e of entries) {
      const key = speciesKey(e.scientificName);
      const next = current[key];
      const savedVal = saved[key];
      const wasEffective = savedVal ?? e.defaultStatus;
      if (next === wasEffective) continue;
      out[e.scientificName] = next === e.defaultStatus ? null : next;
    }
    return out;
  }, [entries, current, saved]);

  const changeCount = Object.keys(changes).length;
  const base = React.useMemo(() => preview({}), [preview]);
  const sim = React.useMemo(() => (changeCount ? preview(draft) : base), [changeCount, draft, preview, base]);

  const counts = React.useMemo(() => {
    const c: Record<SpeciesStatus, number> = { conservee: 0, retiree: 0, nouvelle: 0, ecartee: 0 };
    for (const e of entries) c[current[speciesKey(e.scientificName)]] += 1;
    return c;
  }, [entries, current]);

  const setAll = (s: SpeciesStatus) => {
    const next: Record<string, SpeciesStatus> = {};
    for (const e of entries) next[speciesKey(e.scientificName)] = s;
    setDraft(next);
  };

  const gain = sim.after != null && base.after != null ? sim.after - base.after : null;

  const ordered = React.useMemo(() => {
    const list = [...entries];
    if (order === 'alpha')
      return list.sort((a, b) => labelFor(a).localeCompare(labelFor(b), 'fr'));
    return list.sort((a, b) => {
      const wa = weights.get(speciesKey(a.scientificName))?.deltaPoints ?? 0;
      const wb = weights.get(speciesKey(b.scientificName))?.deltaPoints ?? 0;
      if (wa === wb) return labelFor(a).localeCompare(labelFor(b), 'fr');
      // positives d'abord (les plus fortes en haut), puis négatives (les plus lourdes)
      if (wa >= 0 && wb >= 0) return wb - wa;
      if (wa < 0 && wb < 0) return wa - wb;
      return wa >= 0 ? -1 : 1;
    });
  }, [entries, order, weights, labelFor]);

  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] opacity-55">
          <Sprout className="h-3 w-3" /> Le tri du cortège · {entries.length}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setOrder((o) => (o === 'weight' ? 'alpha' : 'weight'))}
            title="Changer l'ordre de lecture"
            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] opacity-75 hover:opacity-100"
          >
            {order === 'weight' ? (
              <>
                <ArrowDownWideNarrow className="h-3 w-3" /> Par influence
              </>
            ) : (
              <>
                <ArrowDownAZ className="h-3 w-3" /> Alphabétique
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setAll('conservee')}
            className="rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] opacity-75 hover:opacity-100"
          >
            Tout conserver
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft({});
              onResetAll();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] opacity-75 hover:opacity-100"
          >
            <RotateCcw className="h-3 w-3" /> Réinitialiser sur les dates
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-2 text-[10.5px]">
        {SPECIES_STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 opacity-75">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: SPECIES_STATUS_TONE[s] }}
            />
            {SPECIES_STATUS_LABEL[s]} · {counts[s]}
            <span className="hidden opacity-45 lg:inline">— {SPECIES_STATUS_HINT[s]}</span>
          </span>
        ))}
      </div>

      {jury && (
        <CortegeBalance
          up={jury.up}
          down={jury.down}
          sentence={jury.sentence}
          nameFor={(v) => v.plantName}
          hovered={hovered}
          onHover={setHovered}
          onSelect={(v) => setOpenKey(speciesKey(v.scientificName))}
        />
      )}

      {!entries.length && (
        <p className="text-[12px] italic opacity-60">
          Aucune observation dans ce périmètre — élargissez la rigueur.
        </p>
      )}

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {ordered.map((e) => {
          const key = speciesKey(e.scientificName);
          const status = current[key];
          const dirty = status !== (saved[key] ?? e.defaultStatus);
          const v = weights.get(key);
          const weight = v?.deltaIcg ?? 0;
          const ghost = status === 'retiree' || status === 'ecartee';
          const open = openKey === key;
          const lit = hovered && v && hovered === v.plantId;
          return (
            <li
              key={key}
              className="rounded-xl border px-2.5 py-1.5 transition"
              style={{
                borderColor: lit
                  ? weightColor(weight)
                  : dirty
                    ? SPECIES_STATUS_TONE[status]
                    : 'rgba(255,255,255,0.12)',
                background: lit
                  ? `${weightColor(weight)}18`
                  : dirty
                    ? `${SPECIES_STATUS_TONE[status]}14`
                    : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-6 shrink-0 overflow-hidden rounded-md bg-white/10"
                  aria-hidden
                >
                  {e.photoUrl && (
                    <img src={e.photoUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px]">
                  {labelFor(e)} <span className="opacity-45">×{e.count}</span>
                </span>

                <button
                  type="button"
                  disabled={!v}
                  onClick={() => setOpenKey(open ? null : key)}
                  onMouseEnter={() => v && setHovered(v.plantId)}
                  onMouseLeave={() => setHovered(null)}
                  title={
                    v
                      ? `${weight > 0 ? '+' : ''}${weight} pts d'ICG — voir pourquoi`
                      : 'Hors référentiel bio-indicateur : sans influence sur l’ICG'
                  }
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-0.5 py-0.5 transition hover:bg-white/[0.06] disabled:cursor-default disabled:opacity-35"
                >
                  <SpeciesWeightBar
                    value={v ? v.deltaPoints : 0}
                    max={maxWeight}
                    ghost={ghost}
                    width={62}
                  />
                  <span
                    className="w-[26px] text-right text-[10.5px] font-semibold tabular-nums"
                    style={{
                      color: v ? weightColor(weight) : undefined,
                      opacity: v ? (ghost ? 0.5 : 1) : 0.35,
                    }}
                  >
                    {v ? (weight > 0 ? `+${weight}` : weight === 0 ? '—' : weight) : '·'}
                  </span>
                </button>

                <span className="flex shrink-0 gap-0.5">
                  {SPECIES_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      title={`${SPECIES_STATUS_LABEL[s]} — ${SPECIES_STATUS_HINT[s]}`}
                      onClick={() => setDraft((d) => ({ ...d, [key]: s }))}
                      className="rounded-full px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.08em] transition"
                      style={
                        status === s
                          ? { background: SPECIES_STATUS_TONE[s], color: '#0d1c14' }
                          : { opacity: 0.45 }
                      }
                    >
                      {SPECIES_STATUS_LABEL[s].slice(0, 4)}
                    </button>
                  ))}
                </span>
              </div>

              {open && v && (
                <div className="mt-1.5 border-t border-current/10 pt-1.5">
                  {v.impacts.length > 0 ? (
                    <ul className="space-y-0.5">
                      {v.impacts.map((im) => (
                        <li
                          key={im.key}
                          className="flex items-center gap-2 text-[10.5px] opacity-80"
                        >
                          <span className="w-[92px] shrink-0 truncate">{im.label}</span>
                          <span className="shrink-0 opacity-50">·{im.intensity}</span>
                          <span className="min-w-0 flex-1 truncate opacity-65">
                            {im.matchWith.toLowerCase()}
                            {im.gain !== 0 && ` (sans elle : ${im.matchWithout.toLowerCase()})`}
                          </span>
                          <span
                            className="w-[26px] shrink-0 text-right font-semibold tabular-nums"
                            style={{ color: weightColor(im.gain) }}
                          >
                            {im.gain > 0 ? `+${im.gain}` : im.gain === 0 ? '—' : im.gain}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-1 text-[10.5px] italic opacity-70">{v.reason}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>


      {changeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#c8a24a]/40 bg-[#c8a24a]/[0.08] px-3 py-2">
          <span className="text-[11.5px]">
            <strong>{changeCount}</strong> changement{changeCount > 1 ? 's' : ''} en brouillon
          </span>
          <span className="text-[11.5px] opacity-80">
            ICG avant {base.before} → {sim.before}
            {sim.after != null && base.after != null && (
              <>
                {' '}
                · après {base.after} → {sim.after}{' '}
                <span
                  className={
                    (gain ?? 0) > 0
                      ? 'text-[#8fd6a0]'
                      : (gain ?? 0) < 0
                        ? 'text-[#e39c86]'
                        : 'opacity-50'
                  }
                >
                  ({(gain ?? 0) > 0 ? `+${gain}` : gain})
                </span>
              </>
            )}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setDraft({})}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-[11.5px] opacity-80 hover:opacity-100"
            >
              <Undo2 className="h-3.5 w-3.5" /> Annuler
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const ok = await onCommit(changes);
                setBusy(false);
                if (ok !== false) setDraft({});
              }}
              className="inline-flex items-center gap-1 rounded-full border border-[#c8a24a] bg-[#c8a24a]/20 px-3 py-1.5 text-[11.5px] text-[#e7d3a1] disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Valider le tri
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CortegeTriage;
