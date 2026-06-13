import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Building2, Plus, Check } from 'lucide-react';
import { CompanyLabelsChips } from './CompanyLabelsChips';
import { CompanyStageBadge } from './CompanyStageBadge';
import type { CompanySearchResult, CrmCompanyStage } from '@/types/crmCompany';

interface Props {
  result: CompanySearchResult;
  selected: boolean;
  onToggleSelect: () => void;
  existingStage?: CrmCompanyStage;
  onImport: () => void;
}

export const CompanySearchResultCard: React.FC<Props> = ({ result, selected, onToggleSelect, existingStage, onImport }) => {
  const isImported = !!existingStage;
  return (
    <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base leading-tight truncate">{result.nom_complet || result.denomination || 'Sans nom'}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">SIREN {result.siren} · {result.code_naf ?? '—'}{result.libelle_naf ? ` · ${result.libelle_naf}` : ''}</p>
            </div>
            {existingStage ? <CompanyStageBadge stage={existingStage} /> : null}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
            {result.ville && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{result.ville}{result.code_postal ? ` (${result.code_postal})` : ''}</span>
            )}
            {result.tranche_effectif && (
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{result.tranche_effectif}</span>
            )}
            {result.categorie_entreprise && (
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{result.categorie_entreprise}</span>
            )}
            {result.etat_administratif === 'C' && (
              <Badge variant="outline" className="border-destructive text-destructive">Cessée</Badge>
            )}
          </div>

          <CompanyLabelsChips complements={result.complements} className="mt-2" />

          {result.dirigeants && result.dirigeants.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              <span className="font-medium">Dirigeant·e :</span> {result.dirigeants.slice(0, 2).map(d => `${d.prenoms ?? ''} ${d.nom ?? ''}`.trim()).join(', ')}
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <Button size="sm" variant={isImported ? 'outline' : 'default'} onClick={onImport} disabled={isImported} className="gap-1">
              {isImported ? <><Check className="h-3.5 w-3.5" /> Déjà importée</> : <><Plus className="h-3.5 w-3.5" /> Importer</>}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
