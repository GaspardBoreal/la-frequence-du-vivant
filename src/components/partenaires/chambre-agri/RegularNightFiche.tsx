import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Fiche explicative « La haie qui chasse la nuit ».
 * Texte reproduit à l'identique, sans reformulation.
 * Plein écran avec défilement interne sur mobile ; 640 px centrée sur desktop.
 */
export const RegularNightFiche: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="left-0 top-0 h-[100dvh] max-h-full w-full translate-x-0 translate-y-0 overflow-y-auto rounded-none border-border bg-card p-0 text-card-foreground sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85vh] sm:max-w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
      aria-describedby={undefined}
    >
      <div className="p-6 pb-2 pr-14">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Chantier Régulier</p>
        <h2 className="font-serif text-2xl mt-1">La haie qui chasse la nuit</h2>
        <p className="text-sm text-muted-foreground mt-2">Comment les chauves-souris protègent vos cultures, et comment on le mesure.</p>
      </div>

      <div className="px-6 pb-6 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-primary">Ce qui se passe chaque nuit</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            Dès la tombée du jour, les chauves-souris quittent leur gîte et suivent les haies comme on suivrait une route. La haie les abrite du vent et des rapaces nocturnes, et elle concentre une multitude d'insectes. Une pipistrelle, qui pèse à peine le poids d'un morceau de sucre, peut avaler en une nuit plusieurs centaines de papillons de nuit, dont ceux dont les chenilles s'attaquent à la vigne, aux vergers ou au maïs. C'est une régulation des ravageurs gratuite, silencieuse et sans traitement.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-primary">Comment on le sait</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            Pour chasser, les chauves-souris émettent des cris trop aigus pour nos oreilles : des ultrasons. Un petit boîtier posé en bordure de haie les enregistre toute la nuit ; chaque passage capté compte pour un « contact ». Un second boîtier, placé en plein champ, sert de témoin : s'il capte beaucoup moins de contacts, c'est que la haie fait le travail. Une station météo WEENAT installée dans la parcelle enregistre en parallèle la température, le vent et la pluie, car les chauves-souris sortent peu sous 10 °C, par vent fort ou sous la pluie. En croisant les deux, on sait quand et où elles chassent.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-primary">Ce que montre l'animation</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            Les chauves-souris longent la cime de la haie, là où les insectes se rassemblent. Les compteurs comparent l'activité le long de la haie et en plein champ, puis en déduisent un nombre approximatif d'individus et de ravageurs consommés. Le curseur de température fait varier ces chiffres comme le ferait une vraie nuit d'avril ou de juillet.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-primary">À quoi cela vous sert</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            Savoir quelles haies travaillent vraiment et lesquelles sont peu fréquentées. Décider où planter, où renforcer, et à quel moment tailler sans déranger. Objectiver la baisse de pression des ravageurs pour ajuster les traitements. Et donner une preuve concrète, chiffrée, de ce que la biodiversité apporte à votre exploitation.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-primary">Pourquoi un chantier régulier</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            Les chauves-souris sont actives d'avril à octobre. Les boîtiers sont posés plusieurs nuits à chaque passage, et les résultats sont comparés d'une saison à l'autre pour suivre l'effet de vos aménagements dans le temps.
          </p>
        </section>

        <p className="text-xs italic leading-relaxed text-muted-foreground">
          Les valeurs affichées dans l'animation sont des ordres de grandeur destinés à comprendre le phénomène, pas des mesures réelles.
        </p>

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
