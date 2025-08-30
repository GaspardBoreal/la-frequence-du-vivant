import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMarcheContextes, useUpdateMarcheContexte, useContexteCompletude } from '@/hooks/useOpus';
import type { MarcheContexteHybrid } from '@/types/opus';
import { 
  Waves, 
  Leaf, 
  MessageSquare, 
  Factory, 
  Calendar, 
  Sprout, 
  Lightbulb, 
  Cpu,
  Save,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface OpusContexteEditorProps {
  marcheId: string;
  marcheName: string;
  onClose?: () => void;
}

const DIMENSIONS_CONFIG = [
  { 
    key: 'contexte_hydrologique', 
    label: 'Contexte Hydrologique', 
    icon: Waves, 
    color: 'text-blue-600',
    description: 'Caractéristiques hydrologiques du territoire'
  },
  { 
    key: 'especes_caracteristiques', 
    label: 'Espèces Caractéristiques', 
    icon: Leaf, 
    color: 'text-green-600',
    description: 'Biodiversité locale remarquable'
  },
  { 
    key: 'vocabulaire_local', 
    label: 'Vocabulaire Local', 
    icon: MessageSquare, 
    color: 'text-orange-600',
    description: 'Terminologie et expressions du territoire'
  },
  { 
    key: 'empreintes_humaines', 
    label: 'Empreintes Humaines', 
    icon: Factory, 
    color: 'text-red-600',
    description: 'Infrastructures et activités anthropiques'
  },
  { 
    key: 'projection_2035_2045', 
    label: 'Projection 2035-2045', 
    icon: Calendar, 
    color: 'text-purple-600',
    description: 'Évolutions climatiques et territoriales anticipées'
  },
  { 
    key: 'leviers_agroecologiques', 
    label: 'Leviers Agroécologiques', 
    icon: Sprout, 
    color: 'text-emerald-600',
    description: 'Solutions de transition écologique'
  },
  { 
    key: 'nouvelles_activites', 
    label: 'Nouvelles Activités', 
    icon: Lightbulb, 
    color: 'text-yellow-600',
    description: 'Innovations et développements territoriaux'
  },
  { 
    key: 'technodiversite', 
    label: 'Technodiversité', 
    icon: Cpu, 
    color: 'text-cyan-600',
    description: 'Technologies appropriées et innovation frugale'
  }
];

export const OpusContexteEditor: React.FC<OpusContexteEditorProps> = ({
  marcheId,
  marcheName,
  onClose
}) => {
  const { toast } = useToast();
  const { data: contexte, isLoading } = useMarcheContextes(marcheId);
  const updateMutation = useUpdateMarcheContexte();
  const completude = useContexteCompletude(contexte);
  
  const [editingDimension, setEditingDimension] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleDimensionEdit = (dimensionKey: string) => {
    const currentValue = contexte?.[dimensionKey as keyof MarcheContexteHybrid];
    setFormData(currentValue || {});
    setEditingDimension(dimensionKey);
  };

  const handleSaveDimension = async () => {
    if (!editingDimension || !contexte) return;

    try {
      const updates = {
        id: contexte.id,
        [editingDimension]: formData
      };

      await updateMutation.mutateAsync(updates);
      
      toast({
        title: "Dimension mise à jour",
        description: `${DIMENSIONS_CONFIG.find(d => d.key === editingDimension)?.label} sauvegardée avec succès`,
      });
      
      setEditingDimension(null);
      setFormData({});
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la dimension",
        variant: "destructive"
      });
    }
  };

  const renderDimensionContent = (dimension: any) => {
    if (!dimension.key || !contexte) return null;
    
    const data = contexte[dimension.key as keyof MarcheContexteHybrid];
    const isEmpty = !data || (typeof data === 'object' && Object.keys(data).length === 0);

    return (
      <Card key={dimension.key} className="group hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/50 ${dimension.color}`}>
                <dimension.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{dimension.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{dimension.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEmpty && (
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  À compléter
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDimensionEdit(dimension.key)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isEmpty ? 'Créer' : 'Modifier'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isEmpty && (
          <CardContent className="pt-0">
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              {typeof data === 'string' 
                ? data.substring(0, 150) + (data.length > 150 ? '...' : '')
                : `${Object.keys(data).length} éléments configurés`
              }
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderEditingModal = () => {
    if (!editingDimension) return null;
    
    const dimension = DIMENSIONS_CONFIG.find(d => d.key === editingDimension);
    if (!dimension) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${dimension.color}`}>
                  <dimension.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Édition : {dimension.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">{marcheName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveDimension} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => setEditingDimension(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 overflow-auto max-h-[70vh]">
            <div className="space-y-6">
              <div>
                <Label htmlFor="description">Description principale</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={`Décrivez les aspects de ${dimension.label.toLowerCase()} pour ce territoire...`}
                  className="min-h-[120px]"
                />
              </div>
              
              <div>
                <Label htmlFor="sources">Sources (une par ligne)</Label>
                <Textarea
                  id="sources"
                  value={formData.sources?.join('\n') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    sources: e.target.value.split('\n').filter(s => s.trim()) 
                  })}
                  placeholder="https://example.com/source1&#10;Document officiel 2024&#10;Étude locale..."
                  className="min-h-[80px]"
                />
              </div>

              {dimension.key === 'especes_caracteristiques' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Mammifères remarquables</Label>
                    <Textarea
                      value={JSON.stringify(formData.mammiferes || [], null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({ ...formData, mammiferes: JSON.parse(e.target.value) });
                        } catch {}
                      }}
                      className="font-mono text-sm"
                      placeholder={`[{"nom_commun": "Loutre d'Europe", "nom_scientifique": "Lutra lutra"}]`}
                    />
                  </div>
                  <div>
                    <Label>Oiseaux caractéristiques</Label>
                    <Textarea
                      value={JSON.stringify(formData.oiseaux || [], null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({ ...formData, oiseaux: JSON.parse(e.target.value) });
                        } catch {}
                      }}
                      className="font-mono text-sm"
                      placeholder={`[{"nom_commun": "Héron cendré", "habitat_prefere": "Zones humides"}]`}
                    />
                  </div>
                </div>
              )}

              {dimension.key === 'vocabulaire_local' && (
                <div>
                  <Label>Termes locaux</Label>
                  <Textarea
                    value={JSON.stringify(formData.termes || [], null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData({ ...formData, termes: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                    className="font-mono text-sm min-h-[120px]"
                    placeholder={`[{"terme": "Palus", "definition": "Marais asséchés", "origine": "Vieux français"}]`}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec progression */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contexte Hybride</h1>
          <p className="text-muted-foreground">{marcheName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Complétude</div>
            <div className="flex items-center gap-2">
              <Progress value={completude} className="w-32" />
              <span className="text-sm font-medium">{completude}%</span>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </div>

      {/* Grille des dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DIMENSIONS_CONFIG.map(renderDimensionContent)}
      </div>

      {/* Modal d'édition */}
      {renderEditingModal()}
    </div>
  );
};