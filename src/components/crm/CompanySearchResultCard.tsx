import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { MapPin, Users, Building2, Plus, Check, Filter, Ban } from 'lucide-react';
import { CompanyLabelsChips } from './CompanyLabelsChips';
import { CompanyStageBadge } from './CompanyStageBadge';
import type { CompanySearchResult, CrmCompanyStage } from '@/types/crmCompany';
import { formatNaf } from '@/lib/nafCatalog';

interface Props {
  result: CompanySearchResult;
  selected: boolean;
  onToggleSelect: () => void;
  existingStage?: CrmCompanyStage;
  onImport: () => void;
  onPickNaf?: (code: string) => void;
}

export const CompanySearchResultCard: React.FC<Props> = ({ result, selected, onToggleSelect, existingStage, onImport, onPickNaf }) => {
  const isImported = !!existingStage;
  const isCessee = result.etat_administratif === 'C';
  const cessationDate = result.date_cessation
    ? new Date(result.date_cessation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  return (
    <Card className={`p-3 sm:p-4 hover:shadow-md transition-shadow ${isCessee ? 'border-l-4 border-l-destructive bg-destructive/5' : ''}`}>
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-semibold text-sm sm:text-base leading-tight ${isCessee ? 'line-through text-muted-foreground' : ''}`}>{result.nom_complet || result.denomination || 'Sans nom'}</h3>
                {isCessee && (
                  <Badge variant="destructive" className="uppercase text-[10px] tracking-wider px-2 py-0.5 gap-1 shadow-sm">
                    <Ban className="h-3 w-3" /> Cessée
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">SIREN {result.siren}</p>
              {isCessee && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                  <Ban className="h-3 w-3" />
                  Activité cessée{cessationDate ? ` le ${cessationDate}` : ''}
                </p>
              )}
              {result.code_naf && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onPickNaf?.(result.code_naf!); }}
                        className="inline-flex items-center gap-1 mt-1.5 text-[11px] px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                      >
                        <Filter className="h-3 w-3" />
                        {formatNaf(result.code_naf, result.libelle_naf)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Filtrer par cette activité</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
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

