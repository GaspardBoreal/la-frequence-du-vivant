import React from 'react';
import { X, Sparkles, MapPinPlus } from 'lucide-react';
import {
  AGE_LABEL,
  ENJEU_LABEL,
  TYPOLOGIE_LABEL,
  filterInspirations,
  type InspirationAge,
  type InspirationCard,
  type InspirationEnjeu,
  type InspirationTypologie,
} from '@/lib/inspirationsKb';
import { TOOL_BY_KEY } from '@/lib/paysageTools';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Arme l'outil correspondant : le prochain tracé porte la fiche en mémoire. */
  onUse: (card: InspirationCard) => void;
}

const chip = (on: boolean) =>
  `rounded-full border px-2 py-0.5 text-[10px] transition-all ${
    on
      ? 'border-transparent bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
      : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/55'
  }`;

export const InspirationDrawer: React.FC<Props> = ({ open, onClose, onUse }) => {
  const [typologie, setTypologie] = React.useState<InspirationTypologie | 'all'>('all');
  const [enjeu, setEnjeu] = React.useState<InspirationEnjeu | 'all'>('all');
  const [anciennete, setAnciennete] = React.useState<InspirationAge | 'all'>('all');
  const [q, setQ] = React.useState('');

  const cards = React.useMemo(
    () => filterInspirations({ typologie, enjeu, anciennete, q }),
    [typologie, enjeu, anciennete, q],
  );

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[1200] flex justify-end bg-black/35 backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative flex h-full w-full max-w-[420px] flex-col border-l border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] shadow-2xl">
        <header className="flex items-start gap-2 border-b border-[hsl(var(--ds-line))] px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 text-[hsl(var(--ds-forest))]" />
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[15px] leading-tight">Aménagements inspirants</h3>
            <p className="text-[10.5px] italic opacity-60">
              Des lieux qui ont fait le pari du vivant. À poser sur votre plan, puis à trahir.
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 opacity-55 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-2 border-b border-[hsl(var(--ds-line))]/70 px-4 py-2.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher : noue, verger, pierre sèche…"
            className="w-full rounded-full border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-1.5 text-[11px] outline-none focus:border-[hsl(var(--ds-forest))]/50"
          />
          <div className="flex flex-wrap gap-1">
            <button className={chip(typologie === 'all')} onClick={() => setTypologie('all')}>
              Toutes typologies
            </button>
            {(Object.keys(TYPOLOGIE_LABEL) as InspirationTypologie[]).map((t) => (
              <button
                key={t}
                className={chip(typologie === t)}
                onClick={() => setTypologie(typologie === t ? 'all' : t)}
              >
                {TYPOLOGIE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(ENJEU_LABEL) as InspirationEnjeu[]).map((e) => (
              <button
                key={e}
                className={chip(enjeu === e)}
                onClick={() => setEnjeu(enjeu === e ? 'all' : e)}
              >
                {ENJEU_LABEL[e]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(AGE_LABEL) as InspirationAge[]).map((a) => (
              <button
                key={a}
                className={chip(anciennete === a)}
                onClick={() => setAnciennete(anciennete === a ? 'all' : a)}
              >
                {AGE_LABEL[a]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
          {cards.length === 0 && (
            <p className="py-8 text-center text-[11px] italic opacity-55">
              Aucune fiche ne répond à ce croisement. Élargissez le regard.
            </p>
          )}
          {cards.map((c) => {
            const tool = TOOL_BY_KEY[c.toolKey];
            return (
              <article
                key={c.key}
                className="rounded-xl border border-[hsl(var(--ds-line))]/80 bg-white/60 p-3 transition-shadow hover:shadow-md"
              >
                <div className="mb-1 flex items-start gap-2">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px]"
                    style={{ backgroundColor: `${tool?.color || '#2f7d4f'}22` }}
                  >
                    {tool?.glyph || '✦'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif text-[13.5px] leading-tight">{c.titre}</h4>
                    <p className="text-[10px] opacity-60">
                      {c.lieu} · {TYPOLOGIE_LABEL[c.typologie]} · {AGE_LABEL[c.anciennete]}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] leading-snug opacity-85">{c.resume}</p>
                <p className="mt-1 border-l-2 border-[hsl(var(--ds-forest))]/30 pl-2 text-[10.5px] italic leading-snug opacity-70">
                  Le sol : {c.sol}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {c.enjeux.map((e) => (
                    <span
                      key={e}
                      className="rounded-full bg-[hsl(var(--ds-forest))]/10 px-2 py-0.5 text-[9px]"
                    >
                      {ENJEU_LABEL[e]}
                    </span>
                  ))}
                  <button
                    onClick={() => onUse(c)}
                    className="ml-auto inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))] px-2.5 py-1 text-[10px] text-[hsl(var(--ds-cream))] hover:opacity-90"
                  >
                    <MapPinPlus className="h-3 w-3" /> Poser sur le plan
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

export default InspirationDrawer;
