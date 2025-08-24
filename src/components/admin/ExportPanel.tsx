import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Eye, Loader2 } from 'lucide-react';
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
    if (dateFilter === 'all') return data;
    
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
    
    return data.filter(item => {
      const itemDate = item.created_at ? new Date(item.created_at) : new Date();
      return itemDate >= cutoffDate;
    });
  }, [data, dateFilter]);

  const handleOptionChange = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleExport = async () => {
    if (filteredData.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    
    try {
      let result;
      
      if (type === 'marches') {
        result = await exportMarchesToJSON(filteredData as MarcheTechnoSensible[], exportOptions);
      } else {
        result = await exportExplorationsToJSON(filteredData, exportOptions);
      }

      // Télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Export réussi : ${result.items.length} éléments exportés`);
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
    
    const preview = {
      metadata: {
        exportDate: new Date().toISOString(),
        type: type,
        totalItems: filteredData.length,
        exportOptions: selectedOptions
      },
      items: filteredData.slice(0, 2).map(item => ({
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
              disabled={isExporting || filteredData.length === 0}
              className="flex items-center gap-2 flex-1"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter ({filteredData.length} élément{filteredData.length > 1 ? 's' : ''})
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