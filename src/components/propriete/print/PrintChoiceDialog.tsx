import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Printer, BookOpen, Images, Sparkles, Layers, Leaf, ScrollText } from 'lucide-react';

export type PrintChoice = 'observe' | 'analyze' | 'identify' | 'synthesize' | 'palette' | 'combined';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (choice: PrintChoice) => void;
  portraitPhotoCount: number;
  /** Étape depuis laquelle l'impression est lancée. */
  origin?: 'observe' | 'analyze' | 'identify' | 'synthesize' | 'palette';
  /** L'étape 2 est-elle validée (pour le cahier complet) ? */
  analyzeReady?: boolean;
  /** L'étape 1 est-elle validée (pour le cahier complet) ? */
  observeReady?: boolean;
  /** L'étape 3 est-elle validée (pour le cahier complet) ? */
  identifyReady?: boolean;
  /** L'étape 4 est-elle validée (pour le cahier complet) ? */
  synthesizeReady?: boolean;
  /** L'étape 5 est-elle validée (pour le cahier complet) ? */
  paletteReady?: boolean;
  /** Nombre d'espèces bio-indicatrices cochées (atlas). */
  floraCount?: number;
}

/** Miniature aquarelle — Carnet seul (cachet daté) */
const MiniObserve: React.FC = () => (
  <svg viewBox="0 0 120 90" className="w-full h-24">
    <rect x="6" y="6" width="108" height="78" rx="3" fill="#fbf7ee" stroke="#c9b78a" strokeWidth="1" />
    <line x1="18" y1="24" x2="80" y2="24" stroke="#6b7c5a" strokeWidth="1.4" />
    <line x1="18" y1="34" x2="70" y2="34" stroke="#a89b78" strokeWidth="0.8" />
    <line x1="18" y1="42" x2="76" y2="42" stroke="#a89b78" strokeWidth="0.8" />
    <line x1="18" y1="50" x2="60" y2="50" stroke="#a89b78" strokeWidth="0.8" />
    <line x1="18" y1="58" x2="72" y2="58" stroke="#a89b78" strokeWidth="0.8" />
    <line x1="18" y1="66" x2="54" y2="66" stroke="#a89b78" strokeWidth="0.8" />
    <circle cx="98" cy="60" r="14" fill="none" stroke="#b08d57" strokeWidth="1.2" />
    <circle cx="98" cy="60" r="10" fill="none" stroke="#b08d57" strokeWidth="0.5" />
    <text x="98" y="63" textAnchor="middle" fill="#8a6d3b" fontSize="6" fontStyle="italic" fontFamily="Georgia, serif">Validé</text>
  </svg>
);

/** Miniature aquarelle — Carnet du sol (strates + points de prélèvement) */
const MiniAnalyze: React.FC = () => (
  <svg viewBox="0 0 120 90" className="w-full h-24">
    <rect x="6" y="6" width="108" height="78" rx="3" fill="#fbf7ee" stroke="#c9b78a" strokeWidth="1" />
    <line x1="18" y1="20" x2="72" y2="20" stroke="#6b7c5a" strokeWidth="1.4" />
    <line x1="18" y1="28" x2="60" y2="28" stroke="#a89b78" strokeWidth="0.8" />
    {/* strates de sol */}
    <rect x="18" y="38" width="84" height="10" fill="#c9b18a" opacity="0.75" />
    <rect x="18" y="48" width="84" height="12" fill="#a9865c" opacity="0.7" />
    <rect x="18" y="60" width="84" height="14" fill="#7d5f3d" opacity="0.6" />
    {/* ligne de pH + points de prélèvement */}
    <path d="M22,52 L44,44 L66,58 L88,46 L100,52" fill="none" stroke="#8aa63b" strokeWidth="1.4" />
    {[22, 44, 66, 88].map((x, i) => (
      <circle key={i} cx={x} cy={[52, 44, 58, 46][i]} r="2.6" fill="#2f7d4f" />
    ))}
    <text x="18" y="82" fill="#8a6d3b" fontSize="6" fontFamily="Georgia, serif" fontStyle="italic">A · B · C · D</text>
  </svg>
);

/** Miniature aquarelle — Atlas de la flore (grille de vignettes) */
const MiniIdentify: React.FC = () => (
  <svg viewBox="0 0 120 90" className="w-full h-24">
    <rect x="6" y="6" width="108" height="78" rx="3" fill="#fbf7ee" stroke="#c9b78a" strokeWidth="1" />
    <line x1="18" y1="18" x2="76" y2="18" stroke="#6b7c5a" strokeWidth="1.4" />
    {[0, 1, 2, 3].map((c) =>
      [0, 1, 2].map((r) => (
        <g key={`${c}-${r}`}>
          <rect
            x={18 + c * 22}
            y={26 + r * 18}
            width="17"
            height="12"
            fill={['#cfe0c2', '#e3dcc0', '#c8d9cf', '#ded0bb'][(c + r) % 4]}
            stroke="#b08d57"
            strokeWidth="0.5"
          />
          <line x1={18 + c * 22} y1={40 + r * 18} x2={30 + c * 22} y2={40 + r * 18} stroke="#a89b78" strokeWidth="0.7" />
        </g>
      )),
    )}
  </svg>
);

/** Miniature aquarelle — Synthèse (carte d'identité + trois colonnes) */
const MiniSynthesize: React.FC = () => (
  <svg viewBox="0 0 120 90" className="w-full h-24">
    <rect x="6" y="6" width="108" height="78" rx="3" fill="#fbf7ee" stroke="#c9b78a" strokeWidth="1" />
    <line x1="18" y1="18" x2="70" y2="18" stroke="#6b7c5a" strokeWidth="1.4" />
    {/* carte d'identité */}
    {[0, 1, 2].map((r) => (
      <g key={r}>
        <line x1="18" y1={28 + r * 7} x2="46" y2={28 + r * 7} stroke="#a89b78" strokeWidth="0.7" />
        <line x1="62" y1={28 + r * 7} x2="102" y2={28 + r * 7} stroke="#b08d57" strokeWidth="0.7" />
      </g>
    ))}
    {/* trois colonnes atouts / contraintes / vigilances */}
    {[0, 1, 2].map((c) => (
      <g key={c}>
        <rect x={18 + c * 31} y="54" width="26" height="22" fill="none" stroke="#b08d57" strokeWidth="0.5" />
        <circle cx={21.5 + c * 31} cy="60" r="1.4" fill={['#2f7d4f', '#b08d57', '#d19a3a'][c]} />
        <line x1={25 + c * 31} y1="60" x2={41 + c * 31} y2="60" stroke="#a89b78" strokeWidth="0.6" />
        <circle cx={21.5 + c * 31} cy="66" r="1.4" fill={['#2f7d4f', '#b08d57', '#d19a3a'][c]} />
        <line x1={25 + c * 31} y1="66" x2={38 + c * 31} y2="66" stroke="#a89b78" strokeWidth="0.6" />
      </g>
    ))}
  </svg>
);

/** Miniature aquarelle — Cahier complet (photos + carnets) */
const MiniCombined: React.FC = () => (
  <svg viewBox="0 0 120 90" className="w-full h-24">
    <rect x="6" y="6" width="108" height="78" rx="3" fill="#fbf7ee" stroke="#c9b78a" strokeWidth="1" />
    <line x1="18" y1="22" x2="60" y2="22" stroke="#6b7c5a" strokeWidth="1.4" />
    <line x1="18" y1="30" x2="52" y2="30" stroke="#a89b78" strokeWidth="0.8" />
    <rect x="66" y="20" width="20" height="16" fill="#e9d9b5" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="90" y="20" width="20" height="16" fill="#c8d4b8" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="18" y="38" width="44" height="14" fill="#d8c9a1" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="66" y="40" width="44" height="12" fill="#c6bfa4" stroke="#b08d57" strokeWidth="0.6" />
    {/* strates du sol en bas = étape 2 */}
    <rect x="18" y="58" width="92" height="8" fill="#c9b18a" opacity="0.8" />
    <rect x="18" y="66" width="92" height="10" fill="#a9865c" opacity="0.7" />
    <path d="M22,66 L46,60 L70,70 L94,62 L108,66" fill="none" stroke="#2f7d4f" strokeWidth="1.2" />
  </svg>
);

const Card: React.FC<{
  onSelect: () => void;
  selected: boolean;
  disabled?: boolean;
  title: string;
  desc: string;
  pages: string;
  badge?: string;
  disabledHint?: string;
  children: React.ReactNode;
}> = ({ onSelect, selected, disabled, title, desc, pages, badge, disabledHint, children }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onSelect}
    disabled={disabled}
    title={disabled ? disabledHint : undefined}
    className={[
      'relative text-left rounded-2xl border p-4 transition-all',
      'bg-[hsl(var(--ds-cream))]',
      disabled
        ? 'opacity-50 cursor-not-allowed border-[hsl(var(--ds-line))]'
        : selected
          ? 'border-[hsl(var(--ds-gold))] shadow-[0_10px_30px_-12px_rgba(176,141,87,0.55)] scale-[1.01]'
          : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-gold))]/60 hover:shadow-md hover:scale-[1.005]',
    ].join(' ')}
  >
    {badge && !disabled && (
      <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 shadow">
        <Sparkles className="w-3 h-3" /> {badge}
      </span>
    )}
    <div className="rounded-xl bg-white/60 border border-[hsl(var(--ds-line))] p-2 mb-3">
      {children}
    </div>
    <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))]">{title}</div>
    <div className="mt-1 text-xs text-[hsl(var(--ds-forest-deep))]/70">{desc}</div>
    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/70">{pages}</div>
    {disabled && disabledHint && (
      <div className="mt-2 text-[11px] italic text-amber-700">{disabledHint}</div>
    )}
  </button>
);

const Eyebrow: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1.5">
    {icon}
    <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70 font-bold">
      {label}
    </span>
  </span>
);

export const PrintChoiceDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  portraitPhotoCount,
  origin = 'observe',
  analyzeReady = false,
  observeReady = true,
  identifyReady = false,
  synthesizeReady = false,
  paletteReady = false,
  floraCount = 0,
}) => {
  const soloChoice: PrintChoice =
    origin === 'analyze'
      ? 'analyze'
      : origin === 'identify'
        ? 'identify'
        : origin === 'synthesize'
          ? 'synthesize'
          : origin === 'palette'
            ? 'palette'
            : 'observe';
  const [choice, setChoice] = React.useState<PrintChoice | null>(null);

  const combinedDisabled =
    portraitPhotoCount === 0 || (origin !== 'observe' && !observeReady);

  React.useEffect(() => {
    if (open) setChoice(combinedDisabled ? soloChoice : 'combined');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, combinedDisabled, soloChoice]);

  const atlasPages = Math.ceil((floraCount ?? 0) / 24);
  const soloPages =
    origin === 'analyze'
      ? '≈ 2 – 3 pages · A4'
      : origin === 'identify'
        ? `≈ ${2 + atlasPages} pages · A4`
        : origin === 'synthesize' || origin === 'palette'
          ? '2 pages · A4'
          : '≈ 2 pages · A4';
  const combinedPages = combinedDisabled
    ? '—'
    : `≈ ${2 + Math.ceil(portraitPhotoCount / 2) + 3 + (analyzeReady ? 3 : 0) + (identifyReady ? 3 + atlasPages : 0) + (synthesizeReady ? 3 : 0) + (paletteReady ? 3 : 0)} pages · A4`;

  const combinedHint =
    portraitPhotoCount === 0
      ? 'Ajoutez d’abord des photos dans l’onglet Portrait.'
      : origin !== 'observe' && !observeReady
        ? 'Validez d’abord l’étape 1 « J’observe ».'
        : undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-[hsl(var(--ds-cream))] border-[hsl(var(--ds-gold))]/50 rounded-3xl">
        <div className="pointer-events-none absolute inset-x-6 top-3 h-px bg-[hsl(var(--ds-gold))]/50" />
        <div className="pointer-events-none absolute inset-x-6 bottom-3 h-px bg-[hsl(var(--ds-gold))]/50" />

        <DialogTitle className="font-serif italic text-2xl md:text-3xl text-[hsl(var(--ds-forest-deep))] pr-6">
          Comment souhaitez-vous imprimer ce carnet&nbsp;?
        </DialogTitle>
        <DialogDescription className="italic text-[hsl(var(--ds-gold))]/90">
          Deux façons de partager votre regard sur le site.
        </DialogDescription>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {origin === 'analyze' ? (
            <Card
              onSelect={() => setChoice('analyze')}
              selected={choice === 'analyze'}
              title="J'analyse (seul)"
              desc="La synthèse du sol : signature, lectures agronomiques et registre des prélèvements A → E."
              pages={soloPages}
            >
              <Eyebrow icon={<Layers className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="J'analyse le sol" />
              <MiniAnalyze />
            </Card>
          ) : origin === 'identify' ? (
            <Card
              onSelect={() => setChoice('identify')}
              selected={choice === 'identify'}
              title="Carnet de flore seul"
              desc={`La lecture du cortège végétal, la concordance sol ↔ flore et l'atlas illustré des ${floraCount} espèces reconnues (24 par page).`}
              pages={soloPages}
            >
              <Eyebrow icon={<Leaf className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="J'identifie" />
              <MiniIdentify />
            </Card>
          ) : origin === 'palette' ? (
            <Card
              onSelect={() => setChoice('palette')}
              selected={choice === 'palette'}
              title="Palette seule"
              desc="Deux pages : la règle du site et les palettes par emplacement, puis les refus argumentés et la mise en œuvre."
              pages={soloPages}
            >
              <Eyebrow icon={<Leaf className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="Palette végétale" />
              <MiniIdentify />
            </Card>
          ) : origin === 'synthesize' ? (
            <Card
              onSelect={() => setChoice('synthesize')}
              selected={choice === 'synthesize'}
              title="Synthèse seule"
              desc="Deux pages : la carte d'identité écologique et le portrait du site, puis atouts, contraintes et vigilances."
              pages={soloPages}
            >
              <Eyebrow icon={<ScrollText className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="Je synthétise" />
              <MiniSynthesize />
            </Card>
          ) : (
            <Card
              onSelect={() => setChoice('observe')}
              selected={choice === 'observe'}
              title="Carnet seul"
              desc="La synthèse de l'étape « J'observe » : cachet daté, 8 blocs et Âme du Lieu."
              pages={soloPages}
            >
              <Eyebrow icon={<BookOpen className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="J'observe" />
              <MiniObserve />
            </Card>
          )}

          <Card
            onSelect={() => setChoice('combined')}
            selected={choice === 'combined'}
            disabled={combinedDisabled}
            disabledHint={combinedHint}
            title="Cahier complet"
            desc={
              analyzeReady
                ? 'Portrait du site, puis « J\u2019observe », puis « J\u2019analyse le sol » — un seul document relié.'
                : 'Le « Portrait du site » en ouverture, suivi de la synthèse « J\u2019observe » — un seul document relié.'
            }
            pages={combinedPages}
            badge={!combinedDisabled ? 'Recommandé' : undefined}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow icon={<Images className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="Portrait" />
              <span className="text-[hsl(var(--ds-gold))]">·</span>
              <Eyebrow icon={<BookOpen className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="J'observe" />
              {analyzeReady && (
                <>
                  <span className="text-[hsl(var(--ds-gold))]">·</span>
                  <Eyebrow icon={<Layers className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="J'analyse" />
                </>
              )}
              {identifyReady && (
                <>
                  <span className="text-[hsl(var(--ds-gold))]">·</span>
                  <Eyebrow icon={<Leaf className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="J'identifie" />
                </>
              )}
              {synthesizeReady && (
                <>
                  <span className="text-[hsl(var(--ds-gold))]">·</span>
                  <Eyebrow icon={<ScrollText className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="Je synthétise" />
                </>
              )}
              {paletteReady && (
                <>
                  <span className="text-[hsl(var(--ds-gold))]">·</span>
                  <Eyebrow icon={<Leaf className="w-4 h-4 text-[hsl(var(--ds-forest))]" />} label="Palette" />
                </>
              )}
            </div>
            <MiniCombined />
          </Card>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]/70 hover:text-[hsl(var(--ds-forest-deep))]"
          >
            Annuler
          </button>
          <button
            onClick={() => choice && onConfirm(choice)}
            disabled={!choice}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] text-xs font-semibold uppercase tracking-widest hover:bg-[hsl(var(--ds-forest-deep))] transition-colors disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
