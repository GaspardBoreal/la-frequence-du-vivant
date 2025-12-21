import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, FileText, Table, Download, Filter, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportTextesToWord, exportTextesToCSV } from '@/utils/wordExportUtils';
import WordExportPreview from '@/components/admin/WordExportPreview';

interface Exploration {
  id: string;
  name: string;
  slug: string;
}

interface Marche {
  id: string;
  nom_marche: string | null;
  ville: string;
  region: string | null;
  date: string | null;
}

interface TexteWithDetails {
  id: string;
  titre: string;
  contenu: string;
  type_texte: string;
  marche_id: string;
  created_at: string;
  marche_nom?: string;
  marche_ville?: string;
  marche_region?: string;
  marche_date?: string;
}

const TEXT_TYPES = [
  { id: 'haiku', label: 'Haïku' },
  { id: 'senryu', label: 'Senryū' },
  { id: 'poeme', label: 'Poème' },
  { id: 'haibun', label: 'Haïbun' },
  { id: 'texte-libre', label: 'Texte libre' },
  { id: 'fable', label: 'Fable' },
  { id: 'prose', label: 'Prose' },
  { id: 'recit', label: 'Récit' },
];

const REGIONS = [
  'NOUVELLE-AQUITAINE',
  'OCCITANIE',
  'AUVERGNE-RHÔNE-ALPES',
  'ÎLE-DE-FRANCE',
  'BRETAGNE',
  'PROVENCE-ALPES-CÔTE D\'AZUR',
  'CORSE',
];

const ExportationsAdmin: React.FC = () => {
  // Data state
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [marches, setMarches] = useState<Marche[]>([]);
  const [allTextes, setAllTextes] = useState<TexteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter state
  const [selectedExplorations, setSelectedExplorations] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(TEXT_TYPES.map(t => t.id)));
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set(REGIONS));
  const [selectedMarches, setSelectedMarches] = useState<Set<string>>(new Set());

  // Export options state
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [organizationMode, setOrganizationMode] = useState<'type' | 'marche'>('type');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load explorations
        const { data: exploData } = await supabase
          .from('explorations')
          .select('id, name, slug')
          .order('name');
        
        if (exploData) {
          setExplorations(exploData);
          setSelectedExplorations(new Set(exploData.map(e => e.id)));
        }

        // Load marches (sorted by date for chronological order)
        const { data: marchesData } = await supabase
          .from('marches')
          .select('id, nom_marche, ville, region, date')
          .order('date', { ascending: true });
        
        if (marchesData) {
          setMarches(marchesData);
          setSelectedMarches(new Set(marchesData.map(m => m.id)));
        }

        // Load all textes with marche info
        const { data: textesData } = await supabase
          .from('marche_textes')
          .select(`
            id,
            titre,
            contenu,
            type_texte,
            marche_id,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (textesData && marchesData) {
          const marchesMap = new Map(marchesData.map(m => [m.id, m]));
          const enrichedTextes = textesData.map(t => {
            const marche = marchesMap.get(t.marche_id);
            return {
              ...t,
              marche_nom: marche?.nom_marche || undefined,
              marche_ville: marche?.ville,
              marche_region: marche?.region || undefined,
              marche_date: marche?.date || undefined,
            };
          });
          setAllTextes(enrichedTextes);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter textes based on selections
  const filteredTextes = useMemo(() => {
    return allTextes.filter(texte => {
      // Filter by type
      if (!selectedTypes.has(texte.type_texte.toLowerCase())) {
        return false;
      }

      // Filter by region
      if (texte.marche_region && !selectedRegions.has(texte.marche_region)) {
        return false;
      }

      // Filter by marche
      if (!selectedMarches.has(texte.marche_id)) {
        return false;
      }

      return true;
    });
  }, [allTextes, selectedTypes, selectedRegions, selectedMarches]);

  // Statistics
  const stats = useMemo(() => {
    const totalChars = filteredTextes.reduce((sum, t) => sum + t.contenu.length, 0);
    const estimatedWords = Math.round(totalChars / 5);
    const typeCount = new Map<string, number>();
    filteredTextes.forEach(t => {
      const type = t.type_texte.toLowerCase();
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });
    return {
      total: filteredTextes.length,
      chars: totalChars,
      words: estimatedWords,
      byType: typeCount,
    };
  }, [filteredTextes]);

  // Toggle handlers
  const toggleExploration = (id: string) => {
    const newSet = new Set(selectedExplorations);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedExplorations(newSet);
  };

  const toggleType = (id: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTypes(newSet);
  };

  const toggleRegion = (region: string) => {
    const newSet = new Set(selectedRegions);
    if (newSet.has(region)) {
      newSet.delete(region);
    } else {
      newSet.add(region);
    }
    setSelectedRegions(newSet);
  };

  const selectAllTypes = () => setSelectedTypes(new Set(TEXT_TYPES.map(t => t.id)));
  const clearAllTypes = () => setSelectedTypes(new Set());
  
  const selectAllRegions = () => setSelectedRegions(new Set(REGIONS));
  const clearAllRegions = () => setSelectedRegions(new Set());

  // Export handlers
  const handleExportWord = async () => {
    if (filteredTextes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    setExporting(true);
    try {
      await exportTextesToWord(filteredTextes, {
        title: 'Textes Littéraires - Gaspard Boréal',
        includeCoverPage,
        includeTableOfContents,
        includeMetadata,
        organizationMode,
      });
      toast.success(`${filteredTextes.length} textes exportés au format Word`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredTextes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    try {
      exportTextesToCSV(filteredTextes);
      toast.success(`${filteredTextes.length} textes exportés au format CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <FileDown className="h-8 w-8 text-accent" />
            Centre d'Exportation
          </h1>
          <p className="text-muted-foreground">
            Exportez vos contenus littéraires en différents formats
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Textes sélectionnés</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{explorations.length}</div>
              <div className="text-sm text-muted-foreground">Explorations</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{marches.length}</div>
              <div className="text-sm text-muted-foreground">Marches</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">~{stats.words.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Mots estimés</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Filters Column */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Types Filter */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Types de texte</Label>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectAllTypes}
                        className="text-xs text-primary hover:underline"
                      >
                        Tous
                      </button>
                      <button 
                        onClick={clearAllTypes}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Aucun
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {TEXT_TYPES.map(type => {
                      const count = stats.byType.get(type.id) || 0;
                      return (
                        <div key={type.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`type-${type.id}`}
                            checked={selectedTypes.has(type.id)}
                            onCheckedChange={() => toggleType(type.id)}
                          />
                          <Label 
                            htmlFor={`type-${type.id}`} 
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {type.label}
                          </Label>
                          {count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {count}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Regions Filter */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Régions</Label>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectAllRegions}
                        className="text-xs text-primary hover:underline"
                      >
                        Toutes
                      </button>
                      <button 
                        onClick={clearAllRegions}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Aucune
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {REGIONS.map(region => (
                      <div key={region} className="flex items-center gap-2">
                        <Checkbox
                          id={`region-${region}`}
                          checked={selectedRegions.has(region)}
                          onCheckedChange={() => toggleRegion(region)}
                        />
                        <Label 
                          htmlFor={`region-${region}`} 
                          className="text-sm cursor-pointer"
                        >
                          {region}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options Column */}
          <div className="md:col-span-2 space-y-4">
            {/* Word Export Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Export Word - Textes Littéraires
                </CardTitle>
                <CardDescription>
                  Générez un document Word formaté avec vos textes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Options */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Options de mise en forme</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cover-page"
                          checked={includeCoverPage}
                          onCheckedChange={(checked) => setIncludeCoverPage(checked === true)}
                        />
                        <Label htmlFor="cover-page" className="text-sm cursor-pointer">
                          Page de couverture
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="toc"
                          checked={includeTableOfContents}
                          onCheckedChange={(checked) => setIncludeTableOfContents(checked === true)}
                        />
                        <Label htmlFor="toc" className="text-sm cursor-pointer">
                          Table des matières
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="metadata"
                          checked={includeMetadata}
                          onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                        />
                        <Label htmlFor="metadata" className="text-sm cursor-pointer">
                          Métadonnées (lieu, date)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Organisation du document</Label>
                    <RadioGroup
                      value={organizationMode}
                      onValueChange={(v) => setOrganizationMode(v as 'type' | 'marche')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="type" id="org-type" />
                        <Label htmlFor="org-type" className="cursor-pointer">
                          Par type de texte
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="marche" id="org-marche" />
                        <Label htmlFor="org-marche" className="cursor-pointer">
                          Par marche / lieu
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Preview Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Prêt à exporter</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.total} textes • ~{stats.words.toLocaleString()} mots • {Math.round(stats.chars / 1000)}k caractères
                      </div>
                    </div>
                    <Button
                      onClick={handleExportWord}
                      disabled={exporting || stats.total === 0}
                      className="gap-2"
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Télécharger .docx
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Preview */}
            <WordExportPreview
              textes={filteredTextes}
              organizationMode={organizationMode}
              includeMetadata={includeMetadata}
              includeCoverPage={includeCoverPage}
            />

            {/* CSV Export Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-green-500" />
                  Export CSV / Tableur
                </CardTitle>
                <CardDescription>
                  Export simplifié pour Excel ou Google Sheets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Colonnes : Titre, Type, Marché, Ville, Région, Contenu, Date
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={stats.total === 0}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger .csv
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            {stats.byType.size > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Distribution par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(stats.byType.entries()).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="gap-1">
                        {TEXT_TYPES.find(t => t.id === type)?.label || type}
                        <span className="text-muted-foreground">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Centre d'Exportation - Gaspard Boréal © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default ExportationsAdmin;
