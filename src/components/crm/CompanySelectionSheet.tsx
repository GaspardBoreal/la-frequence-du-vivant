import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, X, Ban, Loader2, Trash2, MapPin, ShoppingBasket } from 'lucide-react';
import { CompanyStageBadge } from './CompanyStageBadge';
import type { CrmCompanyStage } from '@/types/crmCompany';
import { formatNaf } from '@/lib/nafCatalog';

export interface SelectionEntry {
  siren: string;
  nom_complet?: string | null;
  denomination?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  code_naf?: string | null;
  libelle_naf?: string | null;
  etat_administratif?: string | null;
  date_cessation?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: SelectionEntry[];
  importedBySiren: Map<string, CrmCompanyStage>;
  onPreview: (siren: string) => void;
  onRemove: (siren: string) => void;
  onClearAll: () => void;
  onImportAll: () => void;
  importing?: boolean;
}

export const CompanySelectionSheet: React.FC<Props> = ({
  open, onOpenChange, entries, importedBySiren, onPreview, onRemove, onClearAll, onImportAll, importing,
}) => {
  const total = entries.length;
  const importableCount = entries.filter(e => !importedBySiren.has(e.siren)).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0">
        <SheetHeader className="px-5 py-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                <ShoppingBasket className="h-4 w-4 text-primary" />
                Ma sélection · {total} entreprise{total > 1 ? 's' : ''}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Vérifiez chaque fiche avant import. Ouvrez l'aperçu pour contrôler les détails.
              </p>
            </div>
            {total > 0 && (
              <Button size="sm" variant="ghost" onClick={onClearAll} className="text-destructive hover:text-destructive gap-1 shrink-0">
                <Trash2 className="h-3.5 w-3.5" /> Vider
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {total === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <ShoppingBasket className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Aucune entreprise sélectionnée pour le moment.</p>
              </div>
            ) : entries.map(e => {
              const isCessee = e.etat_administratif === 'C';
              const stage = importedBySiren.get(e.siren);
              const name = e.nom_complet || e.denomination || `SIREN ${e.siren}`;
              return (
                <div
                  key={e.siren}
                  className={`group relative rounded-lg border p-3 hover:shadow-sm transition-all bg-card ${isCessee ? 'border-l-4 border-l-destructive bg-destructive/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onPreview(e.siren)}
                          className={`text-left font-medium text-sm leading-tight hover:text-primary transition-colors ${isCessee ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {name}
                        </button>
                        {isCessee && (
                          <Badge variant="destructive" className="uppercase text-[9px] tracking-wider px-1.5 py-0 gap-0.5">
                            <Ban className="h-2.5 w-2.5" /> Cessée
                          </Badge>
                        )}
                        {stage && <CompanyStageBadge stage={stage} />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">SIREN {e.siren}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-1">
                        {e.ville && (
                          <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{e.ville}{e.code_postal ? ` (${e.code_postal})` : ''}</span>
                        )}
                        {e.code_naf && (
                          <span className="truncate max-w-[200px]" title={formatNaf(e.code_naf, e.libelle_naf)}>
                            {formatNaf(e.code_naf, e.libelle_naf)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onPreview(e.siren)} title="Aperçu détaillé">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onRemove(e.siren)} title="Retirer de la sélection">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {total > 0 && (
          <div className="border-t p-3 bg-background sticky bottom-0">
            <Button
              className="w-full gap-2"
              onClick={onImportAll}
              disabled={importing || importableCount === 0}
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              {importableCount === 0
                ? 'Toutes déjà importées'
                : `Importer comme Suspect (${importableCount})`}
            </Button>
            {importableCount > 0 && importableCount < total && (
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                {total - importableCount} entreprise{total - importableCount > 1 ? 's' : ''} déjà dans le CRM (ignorée{total - importableCount > 1 ? 's' : ''}).
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
