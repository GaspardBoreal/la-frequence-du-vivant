import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Eye, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { exportMarchesToJSON, exportExplorationsToJSON } from '@/utils/exportUtils';

export interface ExportOptions {
  includeBasicInfo: boolean;
  includeCoordinates: boolean;
  includeTexts: boolean;
  includePhotos: boolean;
  includeAudio: boolean;
  includeBiodiversity: boolean;
  includeWeather: boolean;
  includeRealEstate: boolean;
}

interface ExportPanelProps {
  data: MarcheTechnoSensible[] | any[];
  type: 'marches' | 'explorations';
  title?: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ 
  data, 
  type, 
  title = 'Export des Données' 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json'>('json');
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | '1y'>('all');
  const [showPreview, setShowPreview] = useState(false);
  
  // Selection options for explorations
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [selectedExplorations, setSelectedExplorations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeBasicInfo: true,
    includeCoordinates: true,
    includeTexts: true,
    includePhotos: true,
    includeAudio: true,
    includeBiodiversity: true,
    includeWeather: true,
    includeRealEstate: false,
  });

  const filteredData = useMemo(() => {
    let result = data;
    
    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateFilter) {
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      result = result.filter(item => {
        // For marches, check if there's a date field, otherwise skip date filtering
        if (type === 'marches') {
          return true; // Skip date filtering for marches as they don't have created_at
        }
        const itemDate = 'created_at' in item && item.created_at ? new Date(item.created_at) : new Date();
        return itemDate >= cutoffDate;
      });
    }
    
    // Filter by exploration selection (only for explorations)
    if (type === 'explorations' && exportScope === 'selected') {
      result = result.filter(item => selectedExplorations.includes(item.id));
    }
    
    return result;
  }, [data, dateFilter, type, exportScope, selectedExplorations]);

  // Filtered explorations for selection list
  const filteredExplorationsForSelection = useMemo(() => {
    if (type !== 'explorations') return [];
    return data.filter(exploration => {
      const searchLower = searchTerm.toLowerCase();
      const name = 'name' in exploration ? exploration.name : '';
      const description = 'description' in exploration ? exploration.description : '';
      return (
        name?.toLowerCase().includes(searchLower) ||
        description?.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm, type]);

  const handleExplorationToggle = (explorationId: string) => {
    setSelectedExplorations(prev => 
      prev.includes(explorationId) 
        ? prev.filter(id => id !== explorationId)
        : [...prev, explorationId]
    );
  };

  const handleSelectAll = () => {
    setSelectedExplorations(filteredExplorationsForSelection.map(item => item.id));
  };

  const handleDeselectAll = () => {
    setSelectedExplorations([]);
  };

  const handleOptionChange = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleExport = async () => {
    const dataToExport = type === 'explorations' && exportScope === 'selected' 
      ? data.filter(item => selectedExplorations.includes(item.id))
      : filteredData;

    if (dataToExport.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    if (type === 'explorations' && exportScope === 'selected' && selectedExplorations.length === 0) {
      toast.error('Veuillez sélectionner au moins une exploration');
      return;
    }

    setIsExporting(true);
    
    try {
      let result;
      
      if (type === 'marches') {
        result = await exportMarchesToJSON(dataToExport as MarcheTechnoSensible[], exportOptions);
      } else {
        result = await exportExplorationsToJSON(dataToExport, exportOptions);
      }

      // Télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const scopeSuffix = type === 'explorations' && exportScope === 'selected' 
        ? '_selection' 
        : '';
      link.download = `${type}_export${scopeSuffix}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const scopeText = type === 'explorations' && exportScope === 'selected' 
        ? ` (${selectedExplorations.length} sélectionnées)`
        : '';
      toast.success(`Export réussi : ${result.items.length} éléments exportés${scopeText}`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const generatePreview = () => {
    const selectedOptions = Object.entries(exportOptions)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    
    const dataToPreview = type === 'explorations' && exportScope === 'selected' 
      ? data.filter(item => selectedExplorations.includes(item.id))
      : filteredData;
    
    const preview = {
      metadata: {
        exportDate: new Date().toISOString(),
        type: type,
        scope: type === 'explorations' ? exportScope : 'all',
        totalItems: dataToPreview.length,
        exportOptions: selectedOptions
      },
      items: dataToPreview.slice(0, 2).map(item => ({
        id: item.id,
        ...(exportOptions.includeBasicInfo && {
          nom: type === 'marches' ? item.ville : item.name,
          ...(type === 'marches' && { 
            ville: item.ville,
            departement: item.departement,
            region: item.region 
          })
        }),
        ...(exportOptions.includeCoordinates && type === 'marches' && {
          coordinates: { 
            latitude: item.latitude, 
            longitude: item.longitude 
          }
        }),
        '...': 'autres données selon options sélectionnées'
      }))
    };

    return preview;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            Configurez et exportez vos données avec les options sélectionnées
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Sélection des explorations (uniquement pour les explorations) */}
          {type === 'explorations' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Scope de l'export</Label>
                <RadioGroup value={exportScope} onValueChange={(value: any) => setExportScope(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">Toutes les explorations ({data.length})</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="selected" id="selected" />
                    <Label htmlFor="selected">Explorations sélectionnées ({selectedExplorations.length})</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Liste de sélection des explorations */}
              {exportScope === 'selected' && (
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Sélectionner les explorations</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Rechercher une exploration..."
                          className="w-full pl-8 pr-3 py-2 border border-input bg-background rounded-md text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={filteredExplorationsForSelection.length === 0}
                      >
                        Tout sélectionner
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDeselectAll}
                        disabled={selectedExplorations.length === 0}
                      >
                        Tout désélectionner
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {filteredExplorationsForSelection.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {searchTerm ? 'Aucune exploration trouvée' : 'Aucune exploration disponible'}
                          </p>
                        ) : (
                          filteredExplorationsForSelection.map(exploration => (
                            <div 
                              key={exploration.id} 
                              className="flex items-start space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleExplorationToggle(exploration.id)}
                            >
                              <Checkbox
                                checked={selectedExplorations.includes(exploration.id)}
                                onCheckedChange={() => handleExplorationToggle(exploration.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {exploration.name}
                                </div>
                                {exploration.description && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {exploration.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={exploration.published ? "default" : "secondary"} className="text-xs">
                                    {exploration.published ? 'Publié' : 'Brouillon'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(exploration.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {type === 'explorations' && <Separator />}

          {/* Filtres généraux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les données</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="90d">90 derniers jours</SelectItem>
                  <SelectItem value="1y">Dernière année</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Options d'export */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Données à inclure</h3>
            
            {/* Données de base */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Informations générales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="basicInfo"
                    checked={exportOptions.includeBasicInfo}
                    onCheckedChange={() => handleOptionChange('includeBasicInfo')}
                  />
                  <label htmlFor="basicInfo" className="text-sm">
                    Informations de base
                  </label>
                </div>
                
                {type === 'marches' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="coordinates"
                      checked={exportOptions.includeCoordinates}
                      onCheckedChange={() => handleOptionChange('includeCoordinates')}
                    />
                    <label htmlFor="coordinates" className="text-sm">
                      Coordonnées GPS
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Contenus */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Contenus et médias</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="texts"
                    checked={exportOptions.includeTexts}
                    onCheckedChange={() => handleOptionChange('includeTexts')}
                  />
                  <label htmlFor="texts" className="text-sm">
                    Textes littéraires
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="photos"
                    checked={exportOptions.includePhotos}
                    onCheckedChange={() => handleOptionChange('includePhotos')}
                  />
                  <label htmlFor="photos" className="text-sm">
                    Galerie photos (avec tags)
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audio"
                    checked={exportOptions.includeAudio}
                    onCheckedChange={() => handleOptionChange('includeAudio')}
                  />
                  <label htmlFor="audio" className="text-sm">
                    Fichiers audio
                  </label>
                </div>
              </div>
            </div>

            {/* Données environnementales */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Données environnementales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="biodiversity"
                    checked={exportOptions.includeBiodiversity}
                    onCheckedChange={() => handleOptionChange('includeBiodiversity')}
                  />
                  <label htmlFor="biodiversity" className="text-sm">
                    <span>Données de biodiversité</span>
                    <Badge variant="secondary" className="ml-2 text-xs">Nouveau</Badge>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weather"
                    checked={exportOptions.includeWeather}
                    onCheckedChange={() => handleOptionChange('includeWeather')}
                  />
                  <label htmlFor="weather" className="text-sm">
                    <span>Données météorologiques</span>
                    <Badge variant="secondary" className="ml-2 text-xs">Nouveau</Badge>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="realEstate"
                    checked={exportOptions.includeRealEstate}
                    onCheckedChange={() => handleOptionChange('includeRealEstate')}
                  />
                  <label htmlFor="realEstate" className="text-sm">
                    Données immobilières
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Masquer' : 'Prévisualiser'}
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={isExporting || filteredData.length === 0 || (type === 'explorations' && exportScope === 'selected' && selectedExplorations.length === 0)}
              className="flex items-center gap-2 flex-1"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter ({
                type === 'explorations' && exportScope === 'selected' 
                  ? selectedExplorations.length 
                  : filteredData.length
              } élément{(type === 'explorations' && exportScope === 'selected' ? selectedExplorations.length : filteredData.length) > 1 ? 's' : ''})
            </Button>
          </div>

          {/* Prévisualisation */}
          {showPreview && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">Aperçu de la structure JSON</h4>
              <pre className="text-xs bg-background border rounded p-3 overflow-auto max-h-60">
                {JSON.stringify(generatePreview(), null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPanel;