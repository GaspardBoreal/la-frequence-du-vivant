import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Sparkles, Leaf, Hourglass, ExternalLink, Camera, HelpCircle, ArrowRight } from 'lucide-react';
import { InatPendingObs } from '@/hooks/useMarcheurInatPending';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marcheurPrenom: string;
  inatLogin: string | null;
  recognizedCount: number;
  pending: InatPendingObs[];
  isLoading: boolean;
}

const STATUS_META: Record<InatPendingObs['status'], { label: string; help: string; cta: string }> = {
  no_taxon: {
    label: 'Sans taxon',
    help: 'Aucun nom proposé pour l\'instant',
    cta: 'Demander une suggestion sur iNat',
  },
  genus_or_higher: {
    label: 'Genre identifié',
    help: 'Reste à préciser l\'espèce',
    cta: 'Préciser l\'espèce',
  },
  needs_id: {
    label: 'En attente d\'un second avis',
    help: 'Un naturaliste a déjà proposé, un autre doit confirmer',
    cta: 'Voir sur iNaturalist',
  },
  casual: {
    label: 'Hors Grade Recherche',
    help: 'Photo, date ou lieu manquant — ajouter une 2e photo aide',
    cta: 'Améliorer l\'observation',
  },
};

export const SeuilDuVivantDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  marcheurPrenom,
  inatLogin,
  recognizedCount,
  pending,
  isLoading,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 overflow-y-auto bg-background"
      >
        {/* Header poétique */}
        <div className="relative px-5 pt-6 pb-5 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent border-b border-border/50">
          <div className="absolute top-4 right-12 opacity-60">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-500" />
              Le Seuil du Vivant
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
              {marcheurPrenom ? `${marcheurPrenom}, ` : ''}vos photos vivent leur vie sur iNaturalist.
              Quand deux naturalistes confirment, elles franchissent le seuil et rejoignent la marche.
            </SheetDescription>
          </SheetHeader>

          {/* Mini-frise narrative */}
          <div className="mt-4 grid grid-cols-3 gap-1 text-[10px] text-center">
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-foreground">Posée</span>
              <span className="text-muted-foreground/80">sur iNat</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
              <Hourglass className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-foreground">En chemin</span>
              <span className="text-muted-foreground/80">la communauté observe</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-700 dark:text-emerald-300">Reconnue</span>
              <span className="text-muted-foreground/80">entre dans la marche</span>
            </div>
          </div>
        </div>

        {/* Bandeau "Pourquoi ce seuil ?" */}
        <div className="px-5 py-4 border-b border-border/50 bg-muted/20">
          <div className="flex gap-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
            <p>
              Une espèce n'est jamais reconnue par une personne seule.
              C'est un collectif mondial — botanistes, ornithologues, naturalistes amateurs —
              qui confirme. C'est ce qui rend chaque marche <span className="text-foreground font-medium">scientifiquement précieuse</span>.
            </p>
          </div>
        </div>

        {/* Section : compteur synthèse */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-border/50">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{recognizedCount}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">reconnues</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-amber-500">{pending.length}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">en chemin</span>
            </div>
          </div>
          {inatLogin && (
            <a
              href={`https://www.inaturalist.org/people/${inatLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground transition-colors flex items-center gap-1"
            >
              @{inatLogin}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* Liste des obs en attente */}
        <div className="px-3 py-3 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && pending.length === 0 && (
            <div className="text-center py-8 px-4">
              <Leaf className="w-8 h-8 text-emerald-500/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Toutes vos obs ont franchi le seuil ✨</p>
              <p className="text-xs text-muted-foreground mt-1">
                Chaque photo posée est reconnue par la communauté.
              </p>
            </div>
          )}

          {!isLoading &&
            pending.map((obs) => {
              const meta = STATUS_META[obs.status];
              return (
                <a
                  key={obs.id}
                  href={obs.identifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-2.5 rounded-xl bg-card hover:bg-muted/40 ring-1 ring-border/50 hover:ring-emerald-500/40 transition-all"
                >
                  {obs.photoUrl ? (
                    <img
                      src={obs.photoUrl}
                      alt={obs.taxonName || 'observation'}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">
                        {meta.label}
                      </span>
                      {obs.observedOn && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(obs.observedOn).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground mt-1 truncate">
                      {obs.commonName || obs.taxonName || 'Sans nom pour l\'instant'}
                      {obs.taxonName && obs.commonName && (
                        <span className="text-muted-foreground italic font-normal"> · {obs.taxonName}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {meta.cta}
                      <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </div>
                </a>
              );
            })}
        </div>

        {/* Footer : aider les autres */}
        <div className="px-5 py-4 mt-2 border-t border-border/50 bg-muted/10">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="text-foreground font-medium">Vous savez reconnaître une plante, un insecte ?</span>{' '}
            30 secondes sur iNat suffisent à faire franchir le seuil à une observation —
            la vôtre ou celle d'un autre marcheur.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
