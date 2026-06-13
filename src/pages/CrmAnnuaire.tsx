import React from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Loader2, Building2, MapPin, ListFilter } from 'lucide-react';
import { useCrmRole } from '@/hooks/useCrmRole';
import { useCompanySearch } from '@/hooks/useCompanySearch';
import { useCrmCompanies, useImportCompanies } from '@/hooks/useCrmCompanies';
import { useDebounce } from '@/hooks/useDebounce';
import { CompanySearchFiltersDrawer } from '@/components/crm/CompanySearchFiltersDrawer';
import { CompanySearchResultCard } from '@/components/crm/CompanySearchResultCard';
import { CompanyDetailSheet } from '@/components/crm/CompanyDetailSheet';
import { CrmCompaniesMap } from '@/components/crm/CrmCompaniesMap';
import { CompanyStageBadge } from '@/components/crm/CompanyStageBadge';
import type { CompanySearchFilters, CrmCompanyStage } from '@/types/crmCompany';
import { STAGE_LABELS } from '@/types/crmCompany';

const CrmAnnuaire: React.FC = () => {
  const { canAccessCrm } = useCrmRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'annuaire';
  const [tab, setTab] = React.useState(initialTab);

  // Annuaire state
  const [q, setQ] = React.useState('');
  const debouncedQ = useDebounce(q, 350);
  const [filters, setFilters] = React.useState<CompanySearchFilters>({ per_page: 20, page: 1 });
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const searchFilters = React.useMemo(() => ({ ...filters, q: debouncedQ || undefined }), [filters, debouncedQ]);
  const hasQuery = !!(searchFilters.q || Object.keys(searchFilters).some(k => !['q', 'page', 'per_page'].includes(k) && (searchFilters as any)[k] != null && (searchFilters as any)[k] !== ''));
  const { data: searchData, isFetching } = useCompanySearch(searchFilters, hasQuery && canAccessCrm);

  // Entreprises importées
  const [companyFilters, setCompanyFilters] = React.useState<{ stage: CrmCompanyStage | 'all'; search: string }>({ stage: 'all', search: '' });
  const { data: companies = [], isLoading: companiesLoading } = useCrmCompanies(companyFilters);
  const importedBySiren = React.useMemo(() => {
    const map = new Map<string, CrmCompanyStage>();
    companies.forEach(c => map.set(c.siren, c.lifecycle_stage));
    return map;
  }, [companies]);

  const importMutation = useImportCompanies();
  const [drawerId, setDrawerId] = React.useState<string | null>(null);

  if (!canAccessCrm) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits CRM.</p>
          <Link to="/admin"><Button variant="outline" className="mt-4">Retour</Button></Link>
        </div>
      </div>
    );
  }

  const onTabChange = (v: string) => {
    setTab(v);
    setSearchParams(prev => { prev.set('tab', v); return prev; });
  };

  const toggleSelect = (siren: string) => setSelected(s => {
    const next = new Set(s);
    next.has(siren) ? next.delete(siren) : next.add(siren);
    return next;
  });

  const importSelected = () => {
    if (selected.size === 0) return;
    importMutation.mutate({ sirens: Array.from(selected) }, {
      onSuccess: () => setSelected(new Set()),
    });
  };

  const importOne = (siren: string) => importMutation.mutate({ sirens: [siren] });

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />CRM</Button></Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">CRM Commercial</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Annuaire entreprises · Pipeline · Carte</p>
            </div>
          </div>
          <Link to="/admin/crm/pipeline"><Button size="sm">Pipeline</Button></Link>
        </div>

        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="annuaire" className="gap-2"><Search className="h-4 w-4" />Annuaire</TabsTrigger>
            <TabsTrigger value="entreprises" className="gap-2"><Building2 className="h-4 w-4" />Entreprises</TabsTrigger>
            <TabsTrigger value="carte" className="gap-2"><MapPin className="h-4 w-4" />Carte</TabsTrigger>
          </TabsList>

          {/* === ANNUAIRE === */}
          <TabsContent value="annuaire" className="mt-4">
            <Card className="p-3 mb-3">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, SIREN, dirigeant…" className="pl-9" />
                </div>
                <CompanySearchFiltersDrawer value={filters} onChange={setFilters} />
              </div>
              {selected.size > 0 && (
                <div className="mt-3 flex items-center justify-between gap-2 p-2 bg-primary/10 rounded-md">
                  <span className="text-sm font-medium">{selected.size} entreprise(s) sélectionnée(s)</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Annuler</Button>
                    <Button size="sm" onClick={importSelected} disabled={importMutation.isPending}>
                      {importMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                      Importer comme Suspect
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {!hasQuery ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Saisissez un nom, un SIREN, ou appliquez des filtres pour explorer l'annuaire officiel des entreprises françaises.</p>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-[1fr_400px] gap-3">
                <div className="space-y-2">
                  {isFetching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
                  {searchData?.results.map(r => (
                    <CompanySearchResultCard
                      key={r.siren}
                      result={r}
                      selected={selected.has(r.siren)}
                      onToggleSelect={() => toggleSelect(r.siren)}
                      existingStage={importedBySiren.get(r.siren)}
                      onImport={() => importOne(r.siren)}
                    />
                  ))}
                  {!isFetching && searchData?.results.length === 0 && (
                    <Card className="p-8 text-center text-muted-foreground">Aucun résultat.</Card>
                  )}
                  {searchData && searchData.total_pages > 1 && (
                    <div className="flex items-center justify-between pt-3">
                      <Button size="sm" variant="outline" disabled={(filters.page ?? 1) <= 1}
                        onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}>Précédent</Button>
                      <span className="text-xs text-muted-foreground">
                        Page {searchData.page} / {searchData.total_pages} · {searchData.total} résultats
                      </span>
                      <Button size="sm" variant="outline" disabled={(filters.page ?? 1) >= searchData.total_pages}
                        onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}>Suivant</Button>
                    </div>
                  )}
                </div>
                <div className="hidden lg:block sticky top-4">
                  <CrmCompaniesMap
                    height={600}
                    companies={(searchData?.results ?? []).filter(r => r.latitude && r.longitude).map(r => ({
                      id: r.siren, lat: r.latitude!, lng: r.longitude!,
                      title: r.nom_complet || r.denomination, subtitle: r.ville ?? undefined,
                      stage: importedBySiren.get(r.siren),
                    }))}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* === ENTREPRISES IMPORTEES === */}
          <TabsContent value="entreprises" className="mt-4">
            <Card className="p-3 mb-3">
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={companyFilters.search} onChange={e => setCompanyFilters(f => ({ ...f, search: e.target.value }))}
                    placeholder="Rechercher (nom, SIREN, ville)…" className="pl-9" />
                </div>
                <Select value={companyFilters.stage} onValueChange={(v) => setCompanyFilters(f => ({ ...f, stage: v as any }))}>
                  <SelectTrigger className="w-48 gap-1"><ListFilter className="h-4 w-4" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les stages</SelectItem>
                    <SelectItem value="suspect">Suspect</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {companiesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : companies.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucune entreprise importée pour le moment.</p>
                <Button className="mt-3" onClick={() => onTabChange('annuaire')}>Explorer l'annuaire</Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {companies.map(c => (
                  <Card key={c.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrawerId(c.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{c.denomination ?? c.nom_complet}</p>
                        <p className="text-xs text-muted-foreground truncate">SIREN {c.siren}</p>
                      </div>
                      <CompanyStageBadge stage={c.lifecycle_stage} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      {c.ville && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.ville}{c.code_postal ? ` (${c.code_postal})` : ''}</p>}
                      {c.libelle_naf && <p className="truncate">{c.libelle_naf}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* === CARTE === */}
          <TabsContent value="carte" className="mt-4">
            <Card className="p-3 mb-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Select value={companyFilters.stage} onValueChange={(v) => setCompanyFilters(f => ({ ...f, stage: v as any }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les stages</SelectItem>
                    <SelectItem value="suspect">Suspect</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" />Suspect</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" />Prospect</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" />Client</span>
                </div>
              </div>
            </Card>
            <CrmCompaniesMap companies={companies.filter(c => c.latitude && c.longitude)} height="70vh" onSelect={setDrawerId} />
            <p className="text-xs text-muted-foreground mt-2">{companies.filter(c => c.latitude && c.longitude).length} entreprise(s) géolocalisée(s) sur {companies.length}.</p>
          </TabsContent>
        </Tabs>

        <CompanyDetailSheet companyId={drawerId} onOpenChange={(o) => !o && setDrawerId(null)} />
      </div>
    </div>
  );
};

export default CrmAnnuaire;
