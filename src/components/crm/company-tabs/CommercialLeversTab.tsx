import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp } from 'lucide-react';
import { MaronnierMatchWidget } from './MaronnierMatchWidget';
import { EspeceSignatureWidget } from './EspeceSignatureWidget';
import { DossierPreuveDialog } from './DossierPreuveDialog';

interface Props {
  companyId: string;
  companyName: string;
  hasGps: boolean;
}

export const CommercialLeversTab: React.FC<Props> = ({ companyId, companyName, hasGps }) => {
  const [dossierOpen, setDossierOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Funnel commercial
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Accroche</strong> avec l'Espèce signature → <strong>Rendez-vous</strong> sur un
              salon du maronnier → <strong>Closing</strong> avec le Dossier Preuve.
            </p>
          </div>
          <Button size="sm" onClick={() => setDossierOpen(true)} className="shrink-0">
            <FileText className="h-4 w-4 mr-2" /> Dossier Preuve
          </Button>
        </div>
      </Card>

      <EspeceSignatureWidget companyId={companyId} companyName={companyName} hasGps={hasGps} />
      <MaronnierMatchWidget companyId={companyId} companyName={companyName} />

      <DossierPreuveDialog
        open={dossierOpen}
        onOpenChange={setDossierOpen}
        companyId={companyId}
        companyName={companyName}
      />
    </div>
  );
};
