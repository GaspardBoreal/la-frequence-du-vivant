import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SecureRichTextEditor } from '@/components/ui/secure-rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMarcheContextes, useUpdateMarcheContexte } from '@/hooks/useOpus';
import type { MarcheContexteHybrid } from '@/types/opus';
import { 
  Save,
  Plus,
  Trash2,
  Eye,
  FileText,
  Link,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface OpusDimensionEditorProps {
  marcheId: string;
  marcheName: string;
  dimensionKey: string;
  onClose?: () => void;
}

export const OpusDimensionEditor: React.FC<OpusDimensionEditorProps> = ({
  marcheId,
  marcheName,
  dimensionKey,
  onClose
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { data: contexte, isLoading } = useMarcheContextes(marcheId);
  const updateMutation = useUpdateMarcheContexte();
  
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (contexte && dimensionKey) {
      const currentValue = contexte[dimensionKey as keyof MarcheContexteHybrid] || {};
      setFormData(currentValue);
      setHasChanges(false);
    }
  }, [contexte, dimensionKey]);

  const handleDataChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!contexte) return;

    try {
      const updates = {
        id: contexte.id,
        [dimensionKey]: formData
      };

      await updateMutation.mutateAsync(updates);
      
      toast({
        title: "Dimension sauvegardée",
        description: "Les modifications ont été enregistrées avec succès",
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer les modifications",
        variant: "destructive"
      });
    }
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description">Description principale</Label>
        <SecureRichTextEditor
          value={formData.description || ''}
          onChange={(value) => handleDataChange('description', value)}
          placeholder="Décrivez les aspects principaux de cette dimension..."
          className="min-h-[200px]"
        />
      </div>

      <div>
        <Label htmlFor="impact">Impact territorial</Label>
        <Textarea
          value={formData.impact_territorial || ''}
          onChange={(e) => handleDataChange('impact_territorial', e.target.value)}
          placeholder="Quel est l'impact de cette dimension sur le territoire ?"
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="enjeux">Enjeux identifiés</Label>
        <Textarea
          value={formData.enjeux?.join('\n') || ''}
          onChange={(e) => handleDataChange('enjeux', e.target.value.split('\n').filter(s => s.trim()))}
          placeholder="Un enjeu par ligne..."
          className="min-h-[120px]"
        />
      </div>
    </div>
  );

  const renderSpecificTab = () => {
    switch (dimensionKey) {
      case 'especes_caracteristiques':
        return renderEspecesTab();
      case 'vocabulaire_local':
        return renderVocabulaireTab();
      case 'projection_2035_2045':
        return renderProjectionTab();
      case 'technodiversite':
        return renderTechnodiversiteTab();
      default:
        return renderDefaultSpecificTab();
    }
  };

  const renderEspecesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Mammifères remarquables</Label>
          <Textarea
            value={JSON.stringify(formData.mammiferes || [], null, 2)}
            onChange={(e) => {
              try {
                handleDataChange('mammiferes', JSON.parse(e.target.value));
              } catch {}
            }}
            className="font-mono text-sm min-h-[150px]"
            placeholder={`[
  {
    "nom_commun": "Loutre d'Europe",
    "nom_scientifique": "Lutra lutra",
    "statut_conservation": "En danger"
  }
]`}
          />
        </div>
        
        <div>
          <Label>Oiseaux caractéristiques</Label>
          <Textarea
            value={JSON.stringify(formData.oiseaux || [], null, 2)}
            onChange={(e) => {
              try {
                handleDataChange('oiseaux', JSON.parse(e.target.value));
              } catch {}
            }}
            className="font-mono text-sm min-h-[150px]"
            placeholder={`[
  {
    "nom_commun": "Héron cendré",
    "habitat_prefere": "Zones humides"
  }
]`}
          />
        </div>
      </div>

      <div>
        <Label>Enjeux de conservation</Label>
        <Textarea
          value={formData.enjeux_conservation?.join('\n') || ''}
          onChange={(e) => handleDataChange('enjeux_conservation', e.target.value.split('\n').filter(s => s.trim()))}
          placeholder="Pollution des eaux&#10;Fragmentation des habitats&#10;Espèces invasives"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderVocabulaireTab = () => (
    <div className="space-y-6">
      <div>
        <Label>Termes locaux</Label>
        <Textarea
          value={JSON.stringify(formData.termes || [], null, 2)}
          onChange={(e) => {
            try {
              handleDataChange('termes', JSON.parse(e.target.value));
            } catch {}
          }}
          className="font-mono text-sm min-h-[200px]"
          placeholder={`[
  {
    "terme": "Palus",
    "definition": "Marais asséchés pour l'agriculture",
    "origine": "Vieux français",
    "usage_context": "Agriculture locale"
  }
]`}
        />
      </div>

      <div>
        <Label>Expressions locales</Label>
        <Textarea
          value={formData.expressions_locales?.join('\n') || ''}
          onChange={(e) => handleDataChange('expressions_locales', e.target.value.split('\n').filter(s => s.trim()))}
          placeholder="Une expression par ligne..."
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="etymologie">Étymologie du territoire</Label>
        <Textarea
          value={formData.etymologie || ''}
          onChange={(e) => handleDataChange('etymologie', e.target.value)}
          placeholder="Origine et évolution du nom du lieu..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderProjectionTab = () => (
    <div className="space-y-6">
      <div>
        <Label>Drivers climatiques</Label>
        <Textarea
          value={JSON.stringify(formData.drivers_climatiques || [], null, 2)}
          onChange={(e) => {
            try {
              handleDataChange('drivers_climatiques', JSON.parse(e.target.value));
            } catch {}
          }}
          className="font-mono text-sm min-h-[150px]"
          placeholder={`[
  {
    "nom": "Augmentation température",
    "description": "Hausse de 2-3°C d'ici 2045",
    "intensite_prevue": "forte",
    "timeline": "2030-2045"
  }
]`}
        />
      </div>

      <div>
        <Label>Impacts anticipés</Label>
        <Textarea
          value={JSON.stringify(formData.impacts_anticipes || [], null, 2)}
          onChange={(e) => {
            try {
              handleDataChange('impacts_anticipes', JSON.parse(e.target.value));
            } catch {}
          }}
          className="font-mono text-sm min-h-[150px]"
          placeholder={`[
  {
    "domaine": "Biodiversité",
    "description": "Migration d'espèces vers le nord",
    "probabilite": 0.8,
    "severite": "modérée"
  }
]`}
        />
      </div>
    </div>
  );

  const renderTechnodiversiteTab = () => (
    <div className="space-y-6">
      <div>
        <Label>Innovations technologiques</Label>
        <Textarea
          value={JSON.stringify(formData.innovations || [], null, 2)}
          onChange={(e) => {
            try {
              handleDataChange('innovations', JSON.parse(e.target.value));
            } catch {}
          }}
          className="font-mono text-sm min-h-[200px]"
          placeholder={`[
  {
    "nom": "Station phytoépuration",
    "description": "Traitement des eaux par les plantes",
    "type": "low-tech",
    "autonomie_energetique": true,
    "documentation_ouverte": true
  }
]`}
        />
      </div>

      <div>
        <Label>Fabrication locale</Label>
        <Textarea
          value={formData.fabrication_locale?.join('\n') || ''}
          onChange={(e) => handleDataChange('fabrication_locale', e.target.value.split('\n').filter(s => s.trim()))}
          placeholder="Atelier de réparation&#10;FabLab communautaire&#10;Menuiserie coopérative"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderDefaultSpecificTab = () => (
    <div className="space-y-6">
      <div className="text-center p-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4" />
        <p>Configuration spécifique non disponible pour cette dimension.</p>
        <p className="text-sm">Utilisez l'onglet "Vue d'ensemble" pour les données générales.</p>
      </div>
    </div>
  );

  const renderSourcesTab = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Sources et références</Label>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newSource = { titre: '', url: '', type: 'institutionnel' };
              handleDataChange('sources', [...(formData.sources || []), newSource]);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une source
          </Button>
        </div>
        
        <div className="space-y-4">
          {(formData.sources || []).map((source: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={source.titre || ''}
                      onChange={(e) => {
                        const newSources = [...(formData.sources || [])];
                        newSources[index] = { ...source, titre: e.target.value };
                        handleDataChange('sources', newSources);
                      }}
                      placeholder="Titre de la source"
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={source.url || ''}
                      onChange={(e) => {
                        const newSources = [...(formData.sources || [])];
                        newSources[index] = { ...source, url: e.target.value };
                        handleDataChange('sources', newSources);
                      }}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="outline">{source.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSources = formData.sources.filter((_: any, i: number) => i !== index);
                      handleDataChange('sources', newSources);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Édition de dimension</h2>
          <p className="text-muted-foreground">{marcheName}</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Modifications non sauvegardées
            </Badge>
          )}
          <Button onClick={handleSave} disabled={updateMutation.isPending || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </div>

      {/* Onglets responsives */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="overview" className="text-xs md:text-sm">
            <Eye className="h-4 w-4 mr-1" />
            {isMobile ? 'Vue' : 'Vue d\'ensemble'}
          </TabsTrigger>
          <TabsTrigger value="specific" className="text-xs md:text-sm">
            <FileText className="h-4 w-4 mr-1" />
            {isMobile ? 'Détails' : 'Configuration spécifique'}
          </TabsTrigger>
          {!isMobile && (
            <TabsTrigger value="sources" className="text-xs md:text-sm">
              <Link className="h-4 w-4 mr-1" />
              Sources
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderGeneralTab()}
        </TabsContent>

        <TabsContent value="specific" className="mt-6">
          {renderSpecificTab()}
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          {renderSourcesTab()}
        </TabsContent>
      </Tabs>

      {/* Panel Sources pour mobile */}
      {isMobile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link className="h-5 w-5" />
              Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderSourcesTab()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};