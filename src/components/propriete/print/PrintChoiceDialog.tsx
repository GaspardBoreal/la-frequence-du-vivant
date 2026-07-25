import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Printer, BookOpen, Images, Sparkles } from 'lucide-react';

export type PrintChoice = 'observe' | 'combined';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (choice: PrintChoice) => void;
  portraitPhotoCount: number;
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

/** Miniature aquarelle — Cahier complet (cachet + planches photo) */
const MiniCombined: React.FC = () => (
  <svg viewBox="0 0 120 90" className="w-full h-24">
    <rect x="6" y="6" width="108" height="78" rx="3" fill="#fbf7ee" stroke="#c9b78a" strokeWidth="1" />
    <line x1="18" y1="22" x2="60" y2="22" stroke="#6b7c5a" strokeWidth="1.4" />
    <line x1="18" y1="30" x2="52" y2="30" stroke="#a89b78" strokeWidth="0.8" />
    <line x1="18" y1="38" x2="56" y2="38" stroke="#a89b78" strokeWidth="0.8" />
    <rect x="66" y="20" width="20" height="16" fill="#e9d9b5" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="90" y="20" width="20" height="16" fill="#c8d4b8" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="66" y="40" width="44" height="12" fill="#d8c9a1" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="18" y="52" width="44" height="26" fill="#c6bfa4" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="66" y="58" width="20" height="20" fill="#d9c8ae" stroke="#b08d57" strokeWidth="0.6" />
    <rect x="90" y="58" width="20" height="20" fill="#b8c3a5" stroke="#b08d57" strokeWidth="0.6" />
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

export const PrintChoiceDialog: React.FC<Props> = ({ open, onClose, onConfirm, portraitPhotoCount }) => {
  const [choice, setChoice] = React.useState<PrintChoice | null>(null);
  React.useEffect(() => {
    if (open) setChoice(portraitPhotoCount > 0 ? 'combined' : 'observe');
  }, [open, portraitPhotoCount]);

  const combinedDisabled = portraitPhotoCount === 0;

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
          <Card
            onSelect={() => setChoice('observe')}
            selected={choice === 'observe'}
            title="Carnet seul"
            desc="La synthèse de l'étape « J'observe » : cachet daté, 8 blocs et Âme du Lieu."
            pages="≈ 2 pages · A4"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[hsl(var(--ds-forest))]" />
              <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70 font-bold">J'observe</span>
            </div>
            <MiniObserve />
          </Card>

          <Card
            onSelect={() => setChoice('combined')}
            selected={choice === 'combined'}
            disabled={combinedDisabled}
            disabledHint={combinedDisabled ? 'Ajoutez d\u2019abord des photos dans l\u2019onglet Portrait.' : undefined}
            title="Cahier complet"
            desc="Le « Portrait du site » en ouverture, suivi de la synthèse « J'observe » — un seul document relié."
            pages={combinedDisabled ? '—' : `≈ ${2 + Math.ceil(portraitPhotoCount / 2) + 3} pages · A4`}
            badge={!combinedDisabled ? 'Recommandé' : undefined}
          >
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-[hsl(var(--ds-forest))]" />
              <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70 font-bold">Portrait</span>
              <span className="text-[hsl(var(--ds-gold))]">·</span>
              <BookOpen className="w-4 h-4 text-[hsl(var(--ds-forest))]" />
              <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70 font-bold">J'observe</span>
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
            <Printer className="w-3.5 h-3.5 group-hover:-rotate-6 transition-transform" /> Imprimer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
