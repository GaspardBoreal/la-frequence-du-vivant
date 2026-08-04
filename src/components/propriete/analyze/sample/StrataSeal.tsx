import React from 'react';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import type { SoilBlockId } from '@/components/propriete/analyze/media/soilTestCatalog';
import { glyphMarkup, strataState, MUTED } from './strataGlyphs';

type SealSize = 'row' | 'popup' | 'card' | 'print';

const DIM: Record<SealSize, { icon: number; gap: number; label: boolean; value: boolean }> = {
  print: { icon: 8, gap: 1, label: false, value: false },
  row: { icon: 18, gap: 5, label: false, value: false },
  popup: { icon: 26, gap: 8, label: false, value: true },
  card: { icon: 32, gap: 12, label: true, value: true },
};

interface Props {
  sample: SoilSample;
  size?: SealSize;
  /** Ouvre la fiche carotte sur la strate cliquée. */
  onSelect?: (block: SoilBlockId) => void;
  /** Rendu monochrome tramé pour l'impression N&B. */
  mono?: boolean;
  className?: string;
}

/**
 * « Sceau des 4 strates » : Structure · Texture · Acidité · Vie du sol.
 * Lecture immédiate du niveau de tests réalisés, sans ouvrir la fiche carotte.
 */
export const StrataSeal: React.FC<Props> = ({
  sample,
  size = 'row',
  onSelect,
  mono,
  className = '',
}) => {
  const d = DIM[size];
  const strata = strataState(sample);

  return (
    <span
      className={`inline-flex items-start ${className}`}
      style={{ gap: d.gap }}
      aria-label="Niveau de tests réalisés"
    >
      {strata.map((st) => {
        const Tag = onSelect ? 'button' : 'span';
        return (
          <Tag
            key={st.id}
            {...(onSelect
              ? { type: 'button' as const, onClick: () => onSelect(st.id) }
              : {})}
            title={st.tooltip + (onSelect ? ' — cliquer pour ouvrir la fiche carotte' : '')}
            className={
              'group inline-flex flex-col items-center leading-none transition ' +
              (onSelect ? 'cursor-pointer hover:-translate-y-[1px]' : '')
            }
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <span
              className="inline-flex items-center justify-center rounded-full transition"
              style={{
                width: d.icon + 10,
                height: d.icon + 10,
                background: st.done
                  ? `color-mix(in srgb, ${mono ? '#3a2f22' : st.color} 16%, transparent)`
                  : 'transparent',
                border: `1px ${st.done ? 'solid' : 'dashed'} ${
                  st.done ? (mono ? '#3a2f22' : st.color) : MUTED
                }${st.done ? '' : '66'}`,
                opacity: st.done ? 1 : st.started ? 0.85 : 0.5,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={d.icon}
                height={d.icon}
                dangerouslySetInnerHTML={{
                  __html: glyphMarkup(st.id, {
                    color: st.color,
                    done: st.done,
                    started: st.started,
                    mono,
                  }),
                }}
              />
            </span>

            {d.label && (
              <span
                className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em]"
                style={{ color: st.done ? (mono ? '#3a2f22' : st.color) : MUTED }}
              >
                {st.label}
              </span>
            )}
            {d.value && (
              <span
                className="mt-1 text-[9px] font-semibold text-center"
                style={{
                  color: st.done ? (mono ? '#3a2f22' : st.color) : MUTED,
                  maxWidth: d.icon + 22,
                  opacity: st.done ? 0.95 : 0.6,
                }}
              >
                {st.short ?? '—'}
              </span>
            )}
          </Tag>
        );
      })}
    </span>
  );
};

/** Ligne « 3 strates sur 4 · n preuves ». */
export const StrataCompletionLine: React.FC<{
  sample: SoilSample;
  evidence?: number;
  className?: string;
}> = ({ sample, evidence, className = '' }) => {
  const strata = strataState(sample);
  const done = strata.filter((s) => s.done).length;
  return (
    <span
      className={`text-[9.5px] font-bold uppercase tracking-[0.18em] ${className}`}
      style={{ color: done === 4 ? '#2f7d4f' : done === 0 ? MUTED : '#a98c52' }}
    >
      {done} strate{done > 1 ? 's' : ''} sur {strata.length}
      {typeof evidence === 'number' && evidence > 0 ? ` · ${evidence} preuve${evidence > 1 ? 's' : ''}` : ''}
    </span>
  );
};

export default StrataSeal;
