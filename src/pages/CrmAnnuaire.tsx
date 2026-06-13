import React from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Loader2, Building2, MapPin, ListFilter, X, ShoppingBasket } from 'lucide-react';
import { CompanySelectionSheet, type SelectionEntry } from '@/components/crm/CompanySelectionSheet';
import { useFrenchCompanyDetails } from '@/hooks/useFrenchCompanyDetails';
import { useCrmRole } from '@/hooks/useCrmRole';
import { useCompanySearch } from '@/hooks/useCompanySearch';
import { useCrmCompanies, useImportCompanies } from '@/hooks/useCrmCompanies';
import { useDebounce } from '@/hooks/useDebounce';
import { CompanySearchFiltersDrawer } from '@/components/crm/CompanySearchFiltersDrawer';
import { CompanySearchResultCard } from '@/components/crm/CompanySearchResultCard';
import { CompanyDetailSheet } from '@/components/crm/CompanyDetailSheet';
import { CompanyPreviewSheet } from '@/components/crm/CompanyPreviewSheet';
import { CrmCompaniesMap } from '@/components/crm/CrmCompaniesMap';
import { CompanyStageBadge } from '@/components/crm/CompanyStageBadge';
import { FRENCH_DEPARTMENTS_WITH_CODES, FRENCH_REGIONS_WITH_CODES } from '@/utils/frenchAdministrativeCodes';
import { getNafLabel, formatNaf } from '@/lib/nafCatalog';
import type { CompanySearchFilters, CrmCompanyStage } from '@/types/crmCompany';
import { STAGE_LABELS } from '@/types/crmCompany';

const FILTER_LABELS: Partial<Record<keyof CompanySearchFilters, string>> = {
  commune: 'Ville', code_postal: 'CP', departement: 'Département', region: 'Région',
  activite_principale: 'Activité', categorie_juridique: 'Forme juridique',
  tranche_effectif_salarie: 'Effectif', categorie_entreprise: 'Catégorie', etat_administratif: 'État',
  nom_personne: 'Dirigeant (nom)', prenoms_personne: 'Dirigeant (prénom)',
  ca_min: 'CA min', ca_max: 'CA max', resultat_net_min: 'Résultat min', resultat_net_max: 'Résultat max',
  est_ess: 'ESS', est_rge: 'RGE', est_bio: 'Bio', est_qualiopi: 'Qualiopi', est_finess: 'FINESS',
  est_uai: 'UAI', est_entrepreneur_spectacle: 'Spectacle',
  est_collectivite_territoriale: 'Collectivité', est_societe_mission: 'Société à mission',
};

function formatFilterValue(key: keyof CompanySearchFilters, v: any): string {
  if (typeof v === 'boolean') return 'Oui';
  if (key === 'departement') {
    const d = FRENCH_DEPARTMENTS_WITH_CODES.find(x => x.code === v);
    return d ? `${d.code} — ${d.label}` : String(v);
  }
  if (key === 'region') {
    const r = FRENCH_REGIONS_WITH_CODES.find(x => x.code === v);
    return r ? r.label : String(v);
  }
  if (key === 'activite_principale') {
    const lbl = getNafLabel(String(v));
    return lbl ? `${v} — ${lbl}` : String(v);
  }
  return String(v);
}

const CrmAnnuaire: React.FC = () => {
  const { canAccessCrm } = useCrmRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'annuaire';
  const [tab, setTab] = React.useState(initialTab);

  // Annuaire state
  const [q, setQ] = React.useState('');
  const debouncedQ = useDebounce(q, 350);
  const [filters, setFilters] = React.useState<CompanySearchFilters>({ per_page: 20, page: 1 });
  const SELECTION_KEY = 'crm.annuaire.selection.v1';
  const [selectedMap, setSelectedMap] = React.useState<Map<string, SelectionEntry>>(() => {
    try {
      const raw = sessionStorage.getItem(SELECTION_KEY);
      if (!raw) return new Map();
      const arr = JSON.parse(raw) as Array<[string, SelectionEntry]>;
      return new Map(arr);
    } catch { return new Map(); }
  });
  const [selectionOpen, setSelectionOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(SELECTION_KEY, JSON.stringify(Array.from(selectedMap.entries())));
    } catch { /* ignore */ }
  }, [selectedMap]);

  const searchFilters = React.useMemo(() => ({ ...filters, q: debouncedQ || undefined }), [filters, debouncedQ]);
  const hasQuery = !!(searchFilters.q || Object.keys(searchFilters).some(k => !['q', 'page', 'per_page'].includes(k) && (searchFilters as any)[k] != null && (searchFilters as any)[k] !== ''));
  const { data: searchData, isFetching, error: searchError } = useCompanySearch(searchFilters, hasQuery && canAccessCrm);

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
  const [previewSiren, setPreviewSiren] = React.useState<string | null>(null);

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

  const toggleSelect = (entry: SelectionEntry) => setSelectedMap(m => {
    const next = new Map(m);
    if (next.has(entry.siren)) next.delete(entry.siren);
    else next.set(entry.siren, entry);
    return next;
  });

  const removeFromSelection = (siren: string) => setSelectedMap(m => {
    const next = new Map(m);
    next.delete(siren);
    return next;
  });

  const clearSelection = () => setSelectedMap(new Map());

  const importSelected = () => {
    if (selectedMap.size === 0) return;
    importMutation.mutate({ sirens: Array.from(selectedMap.keys()) }, {
      onSuccess: () => { clearSelection(); setSelectionOpen(false); },
    });
  };

  const importOne = (siren: string) => importMutation.mutate({ sirens: [siren] });

  // Auto-close selection sheet when empty
  React.useEffect(() => {
    if (selectedMap.size === 0 && selectionOpen) setSelectionOpen(false);
  }, [selectedMap, selectionOpen]);

  // Build entry from preview details (cached by react-query)
  const { data: previewDetails } = useFrenchCompanyDetails(previewSiren);
  const togglePreviewSelect = () => {
    if (!previewSiren) return;
    if (selectedMap.has(previewSiren)) {
      removeFromSelection(previewSiren);
      return;
    }
    const entry: SelectionEntry = previewDetails ? {
      siren: previewDetails.siren,
      nom_complet: previewDetails.nom_complet,
      denomination: previewDetails.denomination,
      ville: previewDetails.siege?.commune ?? null,
      code_postal: previewDetails.siege?.code_postal ?? null,
      code_naf: previewDetails.code_naf,
      libelle_naf: previewDetails.libelle_naf,
      etat_administratif: previewDetails.etat_administratif,
      date_cessation: previewDetails.date_cessation,
    } : { siren: previewSiren };
    toggleSelect(entry);
  };

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
                  <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, SIREN, dirigeant…" className="pl-9 pr-9" />
                  {q && (
                    <button type="button" onClick={() => setQ('')}
                      aria-label="Effacer la recherche"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <CompanySearchFiltersDrawer value={filters} onChange={setFilters} />
              </div>

              {/* Chips des filtres actifs */}
              {(() => {
                const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
                if (debouncedQ) chips.push({ key: 'q', label: `Recherche : "${debouncedQ}"`, onRemove: () => setQ('') });
                (Object.keys(filters) as Array<keyof CompanySearchFilters>).forEach((k) => {
                  if (['q', 'page', 'per_page'].includes(k as string)) return;
                  const v = (filters as any)[k];
                  if (v === undefined || v === '' || v === null || v === false) return;
                  const lbl = FILTER_LABELS[k] ?? String(k);
                  chips.push({
                    key: String(k),
                    label: `${lbl} : ${formatFilterValue(k, v)}`,
                    onRemove: () => setFilters(f => { const n = { ...f }; delete (n as any)[k]; return { ...n, page: 1 }; }),
                  });
                });
                if (chips.length === 0) return null;
                return (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {chips.map(c => (
                      <button key={c.key} type="button" onClick={c.onRemove}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted hover:bg-accent border">
                        {c.label}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => { setQ(''); setFilters({ per_page: 20, page: 1 }); }}
                      className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
                      Tout effacer
                    </button>
                  </div>
                );
              })()}

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
                  {searchError && (
                    <Card className="p-4 border-destructive/50 bg-destructive/10 text-sm text-destructive">
                      <p className="font-semibold mb-1">Erreur de recherche</p>
                      <p className="text-xs">{(searchError as Error).message}</p>
                    </Card>
                  )}
                  {isFetching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
                  {!isFetching && searchData && searchData.results.length > 0 && (
                    <div className="flex items-baseline justify-between px-1 pb-1">
                      <p className="text-sm font-medium text-foreground">
                        {searchData.total.toLocaleString('fr-FR')} résultat{searchData.total > 1 ? 's' : ''} trouvé{searchData.total > 1 ? 's' : ''}
                      </p>
                      {searchData.total_pages > 1 && (
                        <p className="text-xs text-muted-foreground">Page {searchData.page} / {searchData.total_pages}</p>
                      )}
                    </div>
                  )}
                  {searchData?.results.map(r => (
                    <CompanySearchResultCard
                      key={r.siren}
                      result={r}
                      selected={selected.has(r.siren)}
                      onToggleSelect={() => toggleSelect(r.siren)}
                      existingStage={importedBySiren.get(r.siren)}
                      onImport={() => importOne(r.siren)}
                      onPickNaf={(code) => setFilters(f => ({ ...f, activite_principale: code, page: 1 }))}
                      onPreview={() => setPreviewSiren(r.siren)}
                    />
                  ))}
                  {!isFetching && searchData?.results.length === 0 && (
                    <Card className="p-6 text-center text-muted-foreground space-y-3">
                      <p className="font-medium text-foreground">Aucun résultat.</p>
                      {debouncedQ && (
                        <div className="text-xs space-y-2">
                          <p>Votre recherche texte <span className="font-mono bg-muted px-1.5 py-0.5 rounded">"{debouncedQ}"</span> est combinée aux filtres en ET logique.</p>
                          <Button size="sm" variant="outline" onClick={() => setQ('')}>Essayer sans le texte de recherche</Button>
                        </div>
                      )}
                    </Card>
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
                      {c.code_naf && <p className="truncate">{formatNaf(c.code_naf, c.libelle_naf)}</p>}
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
        <CompanyPreviewSheet
          siren={previewSiren}
          onOpenChange={(o) => !o && setPreviewSiren(null)}
          selected={previewSiren ? selected.has(previewSiren) : false}
          onToggleSelect={() => previewSiren && toggleSelect(previewSiren)}
          existingStage={previewSiren ? importedBySiren.get(previewSiren) : undefined}
          onImport={() => previewSiren && importOne(previewSiren)}
          importing={importMutation.isPending}
        />
      </div>
    </div>
  );
};

export default CrmAnnuaire;
