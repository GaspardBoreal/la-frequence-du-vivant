import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export interface DemoFicheSection {
  titre: string;
  texte: string;
}

/**
 * Fiche explicative partagée des démonstrateurs.
 * Plein écran avec défilement interne sur mobile ; 640 px centrée sur desktop.
 * Fermeture par la croix (DialogContent), Échap, clic extérieur ou bouton « Fermer ».
 */
export const DemoFiche: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kicker: string;
  titre: string;
  sousTitre: string;
  sections: DemoFicheSection[];
  note: string;
}> = ({ open, onOpenChange, kicker, titre, sousTitre, sections, note }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="left-0 top-0 h-[100dvh] max-h-full w-full translate-x-0 translate-y-0 overflow-y-auto rounded-none border-border bg-card p-0 text-card-foreground sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85vh] sm:max-w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
      aria-describedby={undefined}
    >
      <div className="p-6 pb-2 pr-14">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">{kicker}</p>
        <DialogTitle asChild>
          <h2 className="font-serif text-2xl mt-1">{titre}</h2>
        </DialogTitle>
        <p className="text-sm text-muted-foreground mt-2">{sousTitre}</p>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {sections.map((section) => (
          <section key={section.titre}>
            <h3 className="text-sm font-semibold text-primary">{section.titre}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{section.texte}</p>
          </section>
        ))}

        <p className="text-xs italic leading-relaxed text-muted-foreground">{note}</p>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Fermer
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
