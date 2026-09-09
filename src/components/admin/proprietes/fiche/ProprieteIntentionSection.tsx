import React from 'react';
import { Compass, Download, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PortraitIntention from '@/components/propriete/portrait/PortraitIntention';
import { usePropertyIntention } from '@/hooks/propriete/usePropertyIntention';
import { exportIntentionCsv, exportIntentionJson, exportIntentionPdf } from '@/lib/intentionExport';

interface Props {
  proprieteId: string;
  nom: string;
  sousTitre?: string | null;
}

/**
 * Portrait · Intention dans la fiche admin : exactement ce que voit le
 * jardinier, corrigeable question par question, et exportable.
 */
const ProprieteIntentionSection: React.FC<Props> = ({ proprieteId, nom, sousTitre }) => {
  const { data: intention, isLoading } = usePropertyIntention(proprieteId);
  const [section, setSection] = React.useState<'jardin' | 'projet'>('jardin');

  const run = (fn: () => void, format: string) => {
    if (!intention) return;
    try {
      fn();
      toast.success(`Intention exportée en ${format}`);
    } catch (e) {
      toast.error(`Export impossible : ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Compass className="h-4 w-4" /> Portrait · Intention
          </h3>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Ce que le jardinier voit dans Mon projet › Portrait › Intention. Les corrections
            faites ici sont immédiatement visibles de son côté.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {intention?.hasOnboarding === false && !isLoading && (
            <Badge variant="outline">Parcours d’accueil non fait</Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading || !intention}>
                {isLoading
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Download className="mr-2 h-4 w-4" />}
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => run(() => exportIntentionCsv(intention!, nom), 'CSV')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Tableur (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => run(() => exportIntentionJson(intention!, nom), 'JSON')}>
                <FileJson className="mr-2 h-4 w-4" /> Données complètes (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => run(() => exportIntentionPdf(intention!, nom, sousTitre), 'PDF')}>
                <FileText className="mr-2 h-4 w-4" /> Document (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PortraitIntention
        proprieteId={proprieteId}
        proprieteNom={nom}
        section={section}
        onSectionChange={setSection}
        hideHeader
      />
    </div>
  );
};

export default ProprieteIntentionSection;
