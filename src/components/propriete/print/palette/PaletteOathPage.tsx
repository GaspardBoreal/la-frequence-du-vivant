import React from 'react';
import { PALETTE_BY_ID } from '@/lib/plantPaletteKb';
import type { PaletteZoneView } from '@/components/propriete/palette/PaletteSummary';

interface Props {
  siteRule: string;
  zones: PaletteZoneView[];
  propertyName?: string;
  commune?: string | null;
  completedAt?: string | null;
}

/**
 * « Le serment du site » — page manifeste : la règle du lieu tenue comme un
 * engagement, appuyée par les chiffres réels de la palette retenue.
 */
export const PaletteOathPage: React.FC<Props> = ({
  siteRule,
  zones,
  propertyName,
  commune,
  completedAt,
}) => {
  const retenues = React.useMemo(() => {
    const ids = new Set<string>();
    for (const z of zones) for (const id of z.selected) ids.add(id);
    return Array.from(ids)
      .map((id) => PALETTE_BY_ID.get(id))
      .filter(Boolean) as NonNullable<ReturnType<typeof PALETTE_BY_ID.get>>[];
  }, [zones]);

  const total = retenues.length;
  const indigenes = retenues.filter((s) => s.origin === 'indigene').length;
  const local = retenues.filter((s) => s.vegetalLocal).length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const chiffres = [
    { k: `${zones.length}`, l: 'emplacements composés' },
    { k: `${total}`, l: 'espèces retenues' },
    { k: `${pct(indigenes)} %`, l: 'de flore indigène' },
    { k: `${pct(local)} %`, l: 'en filière Végétal local' },
  ];

  return (
    <div className="print-exact flex h-full flex-col text-[hsl(var(--ds-forest-deep))]">
      <header>
        <p className="text-[9px] uppercase tracking-[0.28em] opacity-55">
          {propertyName ?? 'Propriété'}
          {commune ? ` · ${commune}` : ''} · Palette végétale
        </p>
        <h3 className="font-serif text-[28px] leading-tight">Le serment du site</h3>
      </header>

      <blockquote className="mt-5 border-l-2 border-[hsl(var(--ds-gold))] pl-5 font-serif text-[20px] italic leading-snug">
        {siteRule?.trim() || 'La règle du site reste à écrire : sans elle, la palette n’est qu’une liste.'}
      </blockquote>

      <div className="mt-6 grid grid-cols-4 gap-2.5">
        {chiffres.map((c) => (
          <div
            key={c.l}
            className="rounded-xl border border-[hsl(var(--ds-line))] bg-white/60 px-2.5 py-3 text-center print-avoid-break"
          >
            <div className="font-serif text-[24px] leading-none">{c.k}</div>
            <div className="mt-1 text-[8.5px] uppercase tracking-[0.14em] opacity-60">{c.l}</div>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/55 px-4 py-3.5">
        <p className="text-[9px] uppercase tracking-[0.2em] opacity-55">Nos trois engagements</p>
        <ol className="mt-2 space-y-2">
          {[
            [
              'Planter ce que le lieu accepte',
              'Chaque espèce retenue l’a été sur ses optima écologiques croisés au sol mesuré et à la flore réellement observée sur place.',
            ],
            [
              'Refuser ce qui abîme',
              'Les espèces écartées le sont pour un motif écrit : invasive avérée, allergène majeur ou hors-sol par rapport au site.',
            ],
            [
              'Tenir la promesse dans le temps',
              'Le calendrier de mise en œuvre engage l’an 0, l’an 1 et l’an 3 : la reprise se constate, elle ne se suppose pas.',
            ],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 print-avoid-break">
              <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--ds-forest))]/15 text-[10px] font-bold print-exact">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="font-serif text-[14px]">{t}</span>
                <p className="text-[10.5px] leading-snug opacity-75">{d}</p>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <p className="max-w-[62%] font-serif text-[13px] italic leading-snug opacity-70">
          « Un jardin nourricier ne se décrète pas : il se négocie avec le sol, la lumière et le
          temps. Ce document est le compte rendu de cette négociation. »
        </p>
        <div className="shrink-0 text-right">
          <div className="h-10 w-28 border-b border-[hsl(var(--ds-line))]" />
          <p className="mt-1 text-[8.5px] uppercase tracking-[0.18em] opacity-55">
            Signature du propriétaire
            {completedAt
              ? ` · scellé le ${new Date(completedAt).toLocaleDateString('fr-FR')}`
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaletteOathPage;
