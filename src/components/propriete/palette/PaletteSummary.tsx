import React from 'react';
import {
  Check,
  Pencil,
  Printer,
  RotateCcw,
  ShieldCheck,
  Ban,
  CalendarRange,
  Quote,
  Sprout,
  BookOpen,
} from 'lucide-react';
import { ZonePaletteCard } from './ZonePaletteCard';
import { PALETTE_SOURCES } from '@/lib/plantPaletteKb';
import type { StrateRecommendation } from '@/lib/paletteEngine';
import type {
  PaletteExclusion,
  PalettePlanStep,
  PaletteZoneChoice,
} from '@/hooks/propriete/usePropertyPalette';
import type { ZoneAmbiance } from '@/lib/paletteEngine';

export interface PaletteZoneView {
  id: string;
  name: string;
  color: string;
  ambiance: ZoneAmbiance;
  intention?: string | null;
  recommendations: StrateRecommendation[];
  selected: string[];
}

export type PaletteBlockId = 'rule' | 'zones' | 'excluded' | 'implementation' | 'notes';

/** Présence terrain d'un refus, indexée par nom latin normalisé. */
export interface ExcludedPresenceLite {
  count: number;
  zoneNames?: string[];
}

export const normLatin = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

interface Props {
  siteRule: string;
  zones: PaletteZoneView[];
  excluded: PaletteExclusion[];
  implementation: PalettePlanStep[];
  notes?: string | null;
  completedAt: string | null;
  propertyName?: string;
  commune?: string | null;
  /** Refus réellement observés sur la propriété (clé = latin normalisé) */
  presence?: Record<string, ExcludedPresenceLite>;
  onEditBlock?: (id: PaletteBlockId) => void;
  onReopenAll?: () => void;
  onPrint?: () => void;
  printOnly?: boolean;
  /** p1 = règle + zones · p2 = refus + mise en œuvre + sources */
  printSection?: 'all' | 'p1' | 'p2';
  /** Masque le cartouche à l'écran (il est alors porté par l'en-tête d'étape) */
  hideCartoucheOnScreen?: boolean;
  /** Remplace la section 02 à l'écran par le widget « Emplacements & ouvrages » */
  zonesSlot?: React.ReactNode;
}

const SectionHead: React.FC<{
  num: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
  ink: string;
  onEdit?: () => void;
}> = ({ num, label, Icon, tint, ink, onEdit }) => (
  <div className="flex items-center gap-2.5 print-avoid-break">
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 print-exact"
      style={{ backgroundColor: tint, color: ink }}
    >
      <Icon className="w-3.5 h-3.5" />
    </span>
    <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: ink }}>
      {num}. {label}
    </span>
    <span className="flex-1 h-px print-exact" style={{ backgroundColor: tint }} />
    {onEdit && (
      <button
        onClick={onEdit}
        className="print:hidden text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70 hover:text-[hsl(var(--ds-forest-deep))] inline-flex items-center gap-1"
      >
        <Pencil className="w-3 h-3" /> Modifier
      </button>
    )}
  </div>
);

export const PaletteSummary: React.FC<Props> = ({
  siteRule,
  zones,
  excluded,
  implementation,
  notes,
  completedAt,
  propertyName,
  commune,
  presence,
  onEditBlock,
  onReopenAll,
  onPrint,
  printOnly,
  printSection = 'all',
  hideCartoucheOnScreen,
  zonesSlot,
}) => {
  const showP1 = printSection === 'all' || printSection === 'p1';
  const showP2 = printSection === 'all' || printSection === 'p2';

  return (
    <div className="space-y-6">
      {showP1 && (
        <>
          {/* Cartouche */}
          <header className={`${hideCartoucheOnScreen ? 'hidden print:block ' : ''}rounded-3xl border border-[hsl(var(--ds-gold))]/45 bg-[hsl(var(--ds-cream))] p-6 md:p-8 print-avoid-break print-exact`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]">
                  Méthode D.S. · Étape 5 / 5
                </div>
                <h2 className="font-serif italic text-3xl md:text-4xl mt-2 text-[hsl(var(--ds-forest-deep))]">
                  Palette végétale
                </h2>
                <p className="mt-1 text-sm text-[hsl(var(--ds-forest))]/80">
                  {propertyName}
                  {commune ? ` · ${commune}` : ''}
                </p>
              </div>
              {completedAt && (
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))]/15 px-3 py-1 text-xs font-semibold text-[hsl(var(--ds-forest-deep))] print-exact">
                    <ShieldCheck className="w-3.5 h-3.5" /> Scellée le{' '}
                    {new Date(completedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* 01 — La règle du site */}
          <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 print-avoid-break">
            <SectionHead
              num="01"
              label="La règle du site"
              Icon={Quote}
              tint="#e6f0e4"
              ink="#2f5d3a"
              onEdit={printOnly ? undefined : () => onEditBlock?.('rule')}
            />
            <blockquote className="mt-3 font-serif italic text-xl md:text-2xl leading-snug text-[hsl(var(--ds-forest-deep))] border-l-2 border-[hsl(var(--ds-gold))] pl-4 print-exact">
              {siteRule || 'Règle non rédigée.'}
            </blockquote>
          </section>

          {/* 02 — Emplacements & ouvrages (widget vivant) ou palettes par emplacement */}
          {zonesSlot && !printOnly ? (
            <section className="space-y-4">{zonesSlot}</section>
          ) : (
            <section className="space-y-4">
              <SectionHead
                num="02"
                label="Une palette par emplacement"
                Icon={Sprout}
                tint="#e9f1e6"
                ink="#2f5d3a"
                onEdit={printOnly ? undefined : () => onEditBlock?.('zones')}
              />
              {zones.length === 0 && (
                <p className="text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
                  Aucun emplacement tracé.
                </p>
              )}
              {zones.map((z, i) => (
                <ZonePaletteCard
                  key={z.id}
                  index={i}
                  name={z.name}
                  color={z.color}
                  ambiance={z.ambiance}
                  intention={z.intention}
                  recommendations={z.recommendations}
                  selectedIds={z.selected}
                  readOnly
                  forceOpen
                />
              ))}
            </section>
          )}
        </>
      )}


      {showP2 && (
        <>
          {/* 03 — Ce que l'on écarte */}
          <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 print-avoid-break">
            <SectionHead
              num="03"
              label="Ce que l’on écarte, et pourquoi"
              Icon={Ban}
              tint="#f7e3e0"
              ink="#8c3a2e"
              onEdit={printOnly ? undefined : () => onEditBlock?.('excluded')}
            />
            <div className="mt-3 grid grid-cols-1 gap-2.5">
              {excluded.map((e, i) => (
                <div
                  key={`${e.latin}-${i}`}
                  className="rounded-2xl border border-[#e2c7c1] bg-[#fdf4f2] p-3 print-exact print-avoid-break"
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-[#8c3a2e] text-white text-[10px] font-bold flex items-center justify-center print-exact">
                      {i + 1}
                    </span>
                    <span className="font-serif text-[15px] text-[#7a3126]">{e.fr}</span>
                    <span className="italic text-[12px] text-[#8c3a2e]/70">{e.latin}</span>
                    {(presence?.[normLatin(e.latin)]?.count ?? 0) > 0 && (
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#fdf6e6] text-[#7a5a1c] border border-[#d9a441]/60 print-exact">
                        Présente sur site · {presence![normLatin(e.latin)].count} point
                        {presence![normLatin(e.latin)].count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-[#5f2c23]">{e.why}</p>
                  {!!presence?.[normLatin(e.latin)]?.zoneNames?.length && (
                    <p className="mt-1 text-[11px] italic text-[#7a5a1c]">
                      Emplacements concernés :{' '}
                      {presence![normLatin(e.latin)].zoneNames!.join(', ')}
                    </p>
                  )}
                </div>
              ))}
              {excluded.length === 0 && (
                <p className="text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
                  Aucun refus documenté.
                </p>
              )}
            </div>
          </section>

          {/* 04 — Mise en œuvre */}
          <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 print-avoid-break">
            <SectionHead
              num="04"
              label="Mise en œuvre"
              Icon={CalendarRange}
              tint="#f2e9d8"
              ink="#8a6d3b"
              onEdit={printOnly ? undefined : () => onEditBlock?.('implementation')}
            />
            <ol className="mt-3 space-y-2.5">
              {implementation.map((s, i) => (
                <li
                  key={`${s.title}-${i}`}
                  className="flex gap-3 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/55 p-3 print-avoid-break"
                >
                  <span className="w-6 h-6 shrink-0 rounded-full bg-[hsl(var(--ds-gold))]/25 text-[#8a6d3b] text-[11px] font-bold flex items-center justify-center print-exact">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6d3b]">
                      {s.period}
                    </div>
                    <div className="font-serif text-[15px] text-[hsl(var(--ds-forest-deep))]">
                      {s.title}
                    </div>
                    <p className="text-[12px] leading-snug text-[hsl(var(--ds-forest-deep))]/80">
                      {s.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {notes?.trim() && (
            <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 print-avoid-break">
              <SectionHead
                num="05"
                label="Note libre"
                Icon={Pencil}
                tint="#e6ecf2"
                ink="#3b5f78"
                onEdit={printOnly ? undefined : () => onEditBlock?.('notes')}
              />
              <p className="mt-2 text-sm whitespace-pre-wrap text-[hsl(var(--ds-forest-deep))]">
                {notes}
              </p>
            </section>
          )}

          {/* Sources */}
          <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-5 print-avoid-break">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
              <BookOpen className="w-3 h-3" /> Sources
            </div>
            <ul className="mt-2 space-y-1">
              {PALETTE_SOURCES.map((s) => (
                <li key={s} className="text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/75">
                  · {s}
                </li>
              ))}
            </ul>
          </section>

          {/* Sceau */}
          {completedAt && (
            <div className="rounded-3xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-forest))]/[0.07] p-5 flex flex-wrap items-center justify-between gap-3 print-exact print-avoid-break">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[hsl(var(--ds-forest))] text-white flex items-center justify-center print-exact">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))]">
                    Palette verrouillée · prête pour le rapport client
                  </div>
                  <div className="text-[11px] text-[hsl(var(--ds-forest))]/75 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Scellée le{' '}
                    {new Date(completedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              {!printOnly && (
                <div className="flex gap-2 print:hidden">
                  {onPrint && (
                    <button
                      onClick={onPrint}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]"
                    >
                      <Printer className="w-3.5 h-3.5" /> Imprimer
                    </button>
                  )}
                  {onReopenAll && (
                    <button
                      onClick={onReopenAll}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--ds-cream))]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Rouvrir en édition
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaletteSummary;
