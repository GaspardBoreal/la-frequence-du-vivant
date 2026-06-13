import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2, MapPin, Calendar, Ban, ExternalLink, Plus, Check, Loader2,
  Hash, Briefcase, Users, Euro, FileText, ShieldCheck, Globe2, Copy,
} from 'lucide-react';
import { CompanyLabelsChips } from './CompanyLabelsChips';
import { CompanyStageBadge } from './CompanyStageBadge';
import { useFrenchCompanyDetails } from '@/hooks/useFrenchCompanyDetails';
import { formatNaf } from '@/lib/nafCatalog';
import { toast } from 'sonner';
import type { CrmCompanyStage } from '@/types/crmCompany';

interface Props {
  siren: string | null;
  onOpenChange: (open: boolean) => void;
  selected: boolean;
  onToggleSelect: () => void;
  existingStage?: CrmCompanyStage;
  onImport: () => void;
  importing?: boolean;
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function formatSiret(siret?: string | null) {
  if (!siret) return '';
  return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copié`));
}

export const CompanyPreviewSheet: React.FC<Props> = ({
  siren, onOpenChange, selected, onToggleSelect, existingStage, onImport, importing,
}) => {
  const open = !!siren;
  const { data, isLoading, error } = useFrenchCompanyDetails(siren);
  const isCessee = data?.etat_administratif === 'C';
  const isImported = !!existingStage;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-0 flex flex-col gap-0">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-destructive text-sm">
            Impossible de charger la fiche : {(error as Error).message}
          </div>
        )}
        {data && (
          <>
            {/* HERO */}
            <div className={`relative px-5 sm:px-6 pt-6 pb-4 border-b ${isCessee ? 'bg-destructive/5' : 'bg-gradient-to-br from-primary/5 via-background to-accent/5'}`}>
              {isCessee && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
              )}
              <SheetHeader className="text-left space-y-0">
                <div className="flex items-start gap-3">
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${isCessee ? 'bg-destructive/15 text-destructive' : 'bg-gradient-to-br from-primary/25 to-accent/25 text-primary'}`}>
                    {(data.denomination || data.nom_complet || data.siren).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className={`leading-tight pr-8 ${isCessee ? 'line-through text-muted-foreground decoration-destructive/60' : ''}`}>
                      {data.denomination || data.nom_complet}
                    </SheetTitle>
                    {data.sigle && <p className="text-xs text-muted-foreground mt-0.5">Sigle · {data.sigle}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {isCessee && (
                        <Badge variant="destructive" className="uppercase text-[10px] tracking-wider gap-1">
                          <Ban className="h-3 w-3" />Cessée{data.date_cessation ? ` · ${formatDate(data.date_cessation)}` : ''}
                        </Badge>
                      )}
                      {existingStage && <CompanyStageBadge stage={existingStage} />}
                      {data.forme_juridique && (
                        <Badge variant="outline" className="text-[10px]">{data.forme_juridique}</Badge>
                      )}
                      {data.categorie_entreprise && (
                        <Badge variant="outline" className="text-[10px]">{data.categorie_entreprise}</Badge>
                      )}
                    </div>
                    <CompanyLabelsChips complements={data.complements} className="mt-2" />
                  </div>
                </div>
              </SheetHeader>

              {/* Quick facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <QuickFact icon={<Hash className="h-3.5 w-3.5" />} label="SIREN"
                  value={data.siren} onCopy={() => copy(data.siren, 'SIREN')} />
                <QuickFact icon={<Building2 className="h-3.5 w-3.5" />} label="SIRET siège"
                  value={formatSiret(data.siege.siret)} onCopy={() => data.siege.siret && copy(data.siege.siret, 'SIRET')} />
                <QuickFact icon={<Calendar className="h-3.5 w-3.5" />} label="Création"
                  value={formatDate(data.date_creation) ?? '—'} />
                <QuickFact icon={<Users className="h-3.5 w-3.5" />} label="Effectif"
                  value={data.tranche_effectif ?? '—'} />
              </div>
            </div>

            {/* CONTENT */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 sm:px-6 py-4">
                {isCessee && (
                  <div className="mb-4 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                    <Ban className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Entreprise cessée</p>
                      <p className="text-xs opacity-90">
                        Cette unité légale est radiée{data.date_cessation ? ` depuis le ${formatDate(data.date_cessation)}` : ''}.
                        L'import est possible mais déconseillé pour la prospection commerciale.
                      </p>
                    </div>
                  </div>
                )}

                <Tabs defaultValue="identite">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="identite" className="gap-1.5 text-xs"><Briefcase className="h-3.5 w-3.5" />Identité</TabsTrigger>
                    <TabsTrigger value="etablissements" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" />Établissements{data.nombre_etablissements ? ` (${data.nombre_etablissements})` : ''}</TabsTrigger>
                    <TabsTrigger value="dirigeants" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Dirigeants</TabsTrigger>
                    <TabsTrigger value="finances" className="gap-1.5 text-xs"><Euro className="h-3.5 w-3.5" />Finances</TabsTrigger>
                  </TabsList>

                  {/* IDENTITE */}
                  <TabsContent value="identite" className="mt-4 space-y-2">
                    <Row icon={<Briefcase className="h-4 w-4" />} label="Activité (NAF/APE)"
                      value={formatNaf(data.code_naf, data.libelle_naf) || '—'} />
                    <Row icon={<ShieldCheck className="h-4 w-4" />} label="TVA intracommunautaire"
                      value={data.tva_intracommunautaire || '—'}
                      onCopy={data.tva_intracommunautaire ? () => copy(data.tva_intracommunautaire!, 'TVA') : undefined} />
                    <Row icon={<Euro className="h-4 w-4" />} label="Capital social"
                      value={data.capital_social ? `${Number(data.capital_social).toLocaleString('fr-FR')} €` : '—'} />
                    <Row icon={<MapPin className="h-4 w-4" />} label="Adresse du siège"
                      value={[data.siege.adresse, data.siege.code_postal, data.siege.commune].filter(Boolean).join(' ') || '—'} />
                    <Row icon={<Globe2 className="h-4 w-4" />} label="Région / Département"
                      value={[data.siege.region, data.siege.departement].filter(Boolean).join(' · ') || '—'} />
                    <Row icon={<Calendar className="h-4 w-4" />} label="Dernière mise à jour"
                      value={formatDate(data.date_mise_a_jour) || '—'} />

                    <div className="mt-4 p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                        <ExternalLink className="h-3 w-3" />Sources officielles
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <ExtLink href={data.liens_externes.annuaire_entreprises}>Annuaire Entreprises</ExtLink>
                        <ExtLink href={data.liens_externes.pappers}>Pappers</ExtLink>
                        <ExtLink href={data.liens_externes.societe_com}>Société.com</ExtLink>
                        <ExtLink href={data.liens_externes.insee}>INSEE</ExtLink>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ETABLISSEMENTS */}
                  <TabsContent value="etablissements" className="mt-4 space-y-2">
                    {data.etablissements.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">Aucun établissement détaillé renvoyé.</p>
                    )}
                    {data.etablissements.map((e) => {
                      const closed = e.etat_administratif === 'F' || !!e.date_fermeture;
                      return (
                        <div key={e.siret} className={`p-3 rounded-lg border text-sm ${closed ? 'border-destructive/30 bg-destructive/5' : 'bg-card'}`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs">{formatSiret(e.siret)}</span>
                                {e.est_siege && <Badge variant="secondary" className="text-[10px]">Siège</Badge>}
                                {closed && (
                                  <Badge variant="destructive" className="text-[10px] gap-1">
                                    <Ban className="h-2.5 w-2.5" />Fermé
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm mt-1">
                                {[e.adresse, e.code_postal, e.commune].filter(Boolean).join(' ') || '—'}
                              </p>
                              {e.libelle_activite_principale && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatNaf(e.activite_principale, e.libelle_activite_principale)}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                              onClick={() => copy(e.siret, 'SIRET')} aria-label="Copier SIRET">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>

                  {/* DIRIGEANTS */}
                  <TabsContent value="dirigeants" className="mt-4 space-y-2">
                    {(!data.dirigeants || data.dirigeants.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-6">Aucun dirigeant connu.</p>
                    )}
                    {data.dirigeants?.map((d: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border bg-card text-sm">
                        <p className="font-medium">{[d.prenoms, d.nom].filter(Boolean).join(' ') || d.denomination || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {d.qualite ?? d.type_dirigeant ?? '—'}
                          {d.annee_de_naissance ? ` · ${d.annee_de_naissance}` : ''}
                          {d.nationalite ? ` · ${d.nationalite}` : ''}
                        </p>
                      </div>
                    ))}
                  </TabsContent>

                  {/* FINANCES */}
                  <TabsContent value="finances" className="mt-4 space-y-2">
                    {data.finances.length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Pas de données financières publiées via l'API.
                      </div>
                    )}
                    {data.finances.length > 0 && (
                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                            <tr>
                              <th className="text-left p-2 font-medium">Année</th>
                              <th className="text-right p-2 font-medium">CA</th>
                              <th className="text-right p-2 font-medium">Résultat net</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.finances
                              .slice()
                              .sort((a, b) => Number(b.year) - Number(a.year))
                              .map((f) => (
                                <tr key={f.year} className="border-t">
                                  <td className="p-2 font-medium">{f.year}</td>
                                  <td className="p-2 text-right tabular-nums">
                                    {f.ca != null ? `${Number(f.ca).toLocaleString('fr-FR')} €` : '—'}
                                  </td>
                                  <td className={`p-2 text-right tabular-nums ${f.resultat_net != null && Number(f.resultat_net) < 0 ? 'text-destructive' : ''}`}>
                                    {f.resultat_net != null ? `${Number(f.resultat_net).toLocaleString('fr-FR')} €` : '—'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            {/* STICKY ACTIONS */}
            <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-3 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none mr-auto">
                <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
                {selected ? 'Dans la sélection' : 'Ajouter à la sélection'}
              </label>
              <Button variant="outline" size="sm" asChild>
                <a href={data.liens_externes.annuaire_entreprises} target="_blank" rel="noopener noreferrer" className="gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />Fiche officielle
                </a>
              </Button>
              <Button
                size="sm"
                variant={isImported || isCessee ? 'outline' : 'default'}
                disabled={isImported || importing}
                onClick={onImport}
                className="gap-1"
              >
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                  isImported ? <Check className="h-3.5 w-3.5" /> :
                  <Plus className="h-3.5 w-3.5" />}
                {isImported ? 'Déjà importée' : 'Importer comme Suspect'}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const QuickFact: React.FC<{ icon: React.ReactNode; label: string; value: string; onCopy?: () => void }> = ({ icon, label, value, onCopy }) => (
  <div className="p-2 rounded-lg border bg-background/60 min-w-0">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{icon}{label}</p>
    <div className="flex items-center gap-1 mt-0.5">
      <p className="text-xs font-medium truncate flex-1">{value}</p>
      {onCopy && (
        <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-foreground shrink-0" aria-label={`Copier ${label}`}>
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  </div>
);

const Row: React.FC<{ icon: React.ReactNode; label: string; value: string; onCopy?: () => void }> = ({ icon, label, value, onCopy }) => (
  <div className="flex items-start gap-2 text-sm border-b py-2">
    <div className="text-muted-foreground mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
    {onCopy && value !== '—' && (
      <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" aria-label={`Copier ${label}`}>
        <Copy className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

const ExtLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-background hover:bg-accent transition-colors">
    {children}
    <ExternalLink className="h-3 w-3" />
  </a>
);
