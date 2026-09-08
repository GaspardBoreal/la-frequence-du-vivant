import React from 'react';
import { Info, AlertTriangle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { canRemediate } from '@/hooks/useApiMcpRemediate';

interface Explain {
  critical: string;
  execution: string;
}

const EXPLAIN: Record<string, Explain> = {
  inaturalist: {
    critical:
      'Les observations iNaturalist ne sont plus fraîches. Les cartes de biodiversité, les synthèses et les fiches espèces risquent de manquer les observations récentes des marcheurs.',
    execution:
      'La fonction edge batch-data-collector est appelée en mode manuel. Elle relance la collecte des snapshots de biodiversité sur les marches configurées et met à jour la table biodiversity_snapshots.',
  },
  gbif: {
    critical:
      'Les données GBIF ne sont plus fraîches. Les espèces observées autour des propriétés et des marches peuvent apparaître sans le contexte régional ou historique fourni par GBIF.',
    execution:
      'La fonction edge batch-data-collector est appelée en mode manuel. Elle relance la collecte des snapshots de biodiversité sur les marches configurées et met à jour la table biodiversity_snapshots.',
  },
  'lovable-ai': {
    critical:
      "L'alerte ne mesure pas l'ancienneté du dernier travail, mais le retard réel : le nombre d'espèces déjà observées qui n'ont encore aucune étiquette écologique (mellifère, fixateur d'azote, etc.). Aucune espèce en attente = vert, même si la dernière classification est ancienne. De 1 à 30 espèces = orange, au-delà de 30 (ou si le comptage échoue) = rouge.",
    execution:
      "La relance recompte d'abord les espèces en attente. S'il n'y en a aucune, rien n'est classifié et le contrôle est simplement horodaté. Sinon, un lot d'au plus 60 espèces est envoyé à la classification par IA, puis le retard restant est recalculé et affiché.",
  },
};

interface Props {
  slug: string;
  name?: string;
  className?: string;
}

const ApiRemediateInfo: React.FC<Props> = ({ slug, name, className }) => {
  const explain = EXPLAIN[slug];
  const remediable = canRemediate(slug);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-emerald-200/70 hover:text-emerald-100 hover:bg-emerald-400/15 ${className ?? ''}`}
          aria-label={name ? `Comprendre l'alerte — ${name}` : "Comprendre l'alerte"}
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-emerald-400/20 bg-emerald-950 text-emerald-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-50 text-base">
            <Info className="h-4 w-4 text-emerald-300" />
            {name ?? slug}
          </DialogTitle>
          <DialogDescription className="text-emerald-200/60 text-xs">
            Aide à la décision avant relance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-rose-400/20 bg-rose-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" />
              Ce qui est critique
            </div>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              {explain?.critical ??
                'Cette API est signalée en alerte. Les données qu\'elle fournit peuvent être obsolètes ou indisponibles.'}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-900/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wide">
              <PlayCircle className="h-3.5 w-3.5" />
              {remediable ? 'Ce que va exécuter la relance' : 'Relance automatique'}
            </div>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              {remediable
                ? explain?.execution ??
                  'La fonction de relance va contacter l\'API concernée et récupérer les données manquantes ou obsolètes.'
                : 'Aucune relance automatique n\'est prévue pour cette API. L\'intervention doit être faite manuellement ou ailleurs.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiRemediateInfo;
