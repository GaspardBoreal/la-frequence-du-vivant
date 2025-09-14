import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Waves, 
  Mountain, 
  TreePine, 
  Building, 
  Wheat, 
  Factory,
  MapPin,
  Download,
  Eye,
  Star,
  Search,
  Filter,
  Calendar,
  Users,
  Zap
} from 'lucide-react';

interface TemplateData {
  id: string;
  name: string;
  description: string;
  category: 'environnement' | 'urbain' | 'rural' | 'industriel';
  difficulty: 'debutant' | 'intermediaire' | 'avance';
  icon: React.ReactNode;
  tags: string[];
  completeness: number;
  popularity: number;
  lastUpdated: string;
  estimatedTime: string;
  data: any;
}

interface OpusTemplateLibraryProps {
  onTemplateSelect: (template: TemplateData) => void;
  onClose?: () => void;
}

export const OpusTemplateLibrary: React.FC<OpusTemplateLibraryProps> = ({
  onTemplateSelect,
  onClose
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Templates prédéfinis avec données complètes
  const templates: TemplateData[] = [
    {
      id: 'riviere-francaise',
      name: 'Rivière française typique',
      description: 'Template complet pour documenter une rivière avec écosystème tempéré',
      category: 'environnement',
      difficulty: 'debutant',
      icon: <Waves className="w-5 h-5" />,
      tags: ['rivière', 'écosystème', 'biodiversité', 'hydrologie'],
      completeness: 85,
      popularity: 4.8,
      lastUpdated: '2025-09-10',
      estimatedTime: '45 min',
      data: {
        dimensions: {
          contexte_hydrologique: {
            description: "Caractéristiques hydrologiques d'une rivière française",
            donnees: {
              regime_hydrologique: "Pluvial océanique avec variations saisonnières",
              debit_moyen: "[À compléter] m³/s",
              qualite_eau: "Bonne qualité générale selon indices biologiques",
              niveau_eau: "Stable avec crues hivernales modérées"
            }
          },
          especes_caracteristiques: {
            description: "Espèces typiques des cours d'eau français",
            donnees: {
              especes_vegetales: [
                {
                  nom_vernaculaire: "Saule blanc",
                  nom_scientifique: "Salix alba",
                  statut_conservation: "LC",
                  role_ecologique: "Stabilisation berges, habitat faune"
                }
              ],
              especes_aquatiques: [
                {
                  nom_vernaculaire: "Truite fario",
                  nom_scientifique: "Salmo trutta",
                  statut_conservation: "LC",
                  role_ecologique: "Prédateur, indicateur qualité eau"
                }
              ]
            }
          },
          vocabulaire_local: {
            description: "Terminologie locale des cours d'eau",
            donnees: {
              termes_hydrologiques: [
                {
                  terme: "Gour",
                  definition: "Vasque naturelle creusée par l'eau",
                  contexte_usage: "Sud de la France, rivières calcaires"
                }
              ]
            }
          }
        },
        sources: [
          {
            titre: "Guide écologique des rivières françaises",
            url: "https://www.onema.fr",
            type: "institutionnel",
            fiabilite: 5
          }
        ]
      }
    },
    {
      id: 'marche-urbain',
      name: 'Marché urbain français',
      description: 'Documentation complète pour un marché de centre-ville',
      category: 'urbain',
      difficulty: 'intermediaire',
      icon: <Building className="w-5 h-5" />,
      tags: ['marché', 'urbain', 'patrimoine', 'commerce'],
      completeness: 90,
      popularity: 4.6,
      lastUpdated: '2025-09-08',
      estimatedTime: '60 min',
      data: {
        dimensions: {
          empreintes_humaines: {
            description: "Infrastructures et aménagements urbains",
            donnees: {
              infrastructures_commerciales: [
                {
                  nom: "Halles centrales",
                  type: "Architecture commerciale XIXe",
                  description: "Structure métallique et verre",
                  impact_territorial: "Polarité commerciale historique"
                }
              ]
            }
          },
          vocabulaire_local: {
            description: "Expressions du commerce local",
            donnees: {
              termes_commerciaux: [
                {
                  terme: "Carreau",
                  definition: "Emplacement de vente au marché",
                  contexte_usage: "Tradition commerciale française"
                }
              ]
            }
          }
        }
      }
    },
    {
      id: 'territoire-rural',
      name: 'Territoire rural agricole',
      description: 'Template pour documenter un espace agricole traditionnel',
      category: 'rural',
      difficulty: 'debutant',
      icon: <Wheat className="w-5 h-5" />,
      tags: ['agriculture', 'rural', 'paysage', 'traditions'],
      completeness: 75,
      popularity: 4.3,
      lastUpdated: '2025-09-05',
      estimatedTime: '40 min',
      data: {
        dimensions: {
          leviers_agroecologiques: {
            description: "Pratiques agricoles durables",
            donnees: {
              techniques_traditionnelles: [
                {
                  nom: "Rotation triennale",
                  description: "Assolement traditionnel céréales-légumineuses-jachère",
                  avantages: "Maintien fertilité, biodiversité"
                }
              ]
            }
          },
          vocabulaire_local: {
            description: "Vocabulaire agricole régional",
            donnees: {
              termes_agricoles: [
                {
                  terme: "Ouche",
                  definition: "Petit champ clos près de la ferme",
                  contexte_usage: "France du Nord et de l'Est"
                }
              ]
            }
          }
        }
      }
    },
    {
      id: 'zone-industrielle',
      name: 'Zone industrielle',
      description: 'Documentation d\'un territoire industriel et ses impacts',
      category: 'industriel',
      difficulty: 'avance',
      icon: <Factory className="w-5 h-5" />,
      tags: ['industrie', 'pollution', 'reconversion', 'technologie'],
      completeness: 80,
      popularity: 3.9,
      lastUpdated: '2025-08-28',
      estimatedTime: '75 min',
      data: {
        dimensions: {
          technodiversite: {
            description: "Technologies industrielles et innovations",
            donnees: {
              technologies_production: [
                {
                  nom: "Méthanisation industrielle",
                  description: "Valorisation déchets organiques industriels",
                  impact_environnemental: "Réduction GES, production énergie verte"
                }
              ]
            }
          },
          empreintes_humaines: {
            description: "Infrastructures industrielles",
            donnees: {
              complexes_industriels: [
                {
                  nom: "Zone d'activité",
                  type: "Plateforme logistique",
                  impact_ecosystemique: "Artificialisation sols, fragmentation"
                }
              ]
            }
          }
        }
      }
    },
    {
      id: 'littoral-maritime',
      name: 'Territoire littoral',
      description: 'Écosystème côtier avec ses spécificités marines',
      category: 'environnement',
      difficulty: 'intermediaire',
      icon: <Waves className="w-5 h-5" />,
      tags: ['littoral', 'mer', 'marées', 'écosystème marin'],
      completeness: 88,
      popularity: 4.7,
      lastUpdated: '2025-09-12',
      estimatedTime: '55 min',
      data: {
        dimensions: {
          contexte_hydrologique: {
            description: "Dynamique marine et estuarienne",
            donnees: {
              regime_tidal: "Semi-diurne, marnage 2-6m",
              salinite: "Variable selon marées et apports fluviaux",
              qualite_eau: "Surveillance réseau REPHY"
            }
          },
          especes_caracteristiques: {
            description: "Espèces littorales et marines",
            donnees: {
              especes_marines: [
                {
                  nom_vernaculaire: "Goéland argenté",
                  nom_scientifique: "Larus argentatus",
                  statut_conservation: "LC",
                  habitat: "Côtes rocheuses, ports de pêche"
                }
              ]
            }
          }
        }
      }
    },
    {
      id: 'montagne-alpine',
      name: 'Territoire de montagne',
      description: 'Écosystème montagnard avec étagement altitudinal',
      category: 'environnement',
      difficulty: 'avance',
      icon: <Mountain className="w-5 h-5" />,
      tags: ['montagne', 'altitude', 'climat', 'pastoralisme'],
      completeness: 82,
      popularity: 4.4,
      lastUpdated: '2025-09-01',
      estimatedTime: '70 min',
      data: {
        dimensions: {
          contexte_hydrologique: {
            description: "Hydrologie montagnarde",
            donnees: {
              regime_nival: "Fonte printanière, étiage hivernal",
              altitude_bassin: "800-2500m d'altitude",
              temperature_eau: "Froide, variations saisonnières marquées"
            }
          },
          leviers_agroecologiques: {
            description: "Pastoralisme et agriculture montagnarde",
            donnees: {
              pratiques_pastorales: [
                {
                  nom: "Estive traditionnelle",
                  description: "Montée du bétail en altitude l'été",
                  benefices: "Entretien paysage, biodiversité prairies"
                }
              ]
            }
          }
        }
      }
    }
  ];

  // Filtrage des templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleTemplateSelect = (template: TemplateData) => {
    onTemplateSelect(template);
    toast({
      title: "✨ Template sélectionné",
      description: `${template.name} a été chargé avec ${template.completeness}% de données pré-remplies`,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'debutant': return 'bg-success/10 text-success border-success/20';
      case 'intermediaire': return 'bg-warning/10 text-warning border-warning/20';
      case 'avance': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environnement': return <TreePine className="w-4 h-4" />;
      case 'urbain': return <Building className="w-4 h-4" />;
      case 'rural': return <Wheat className="w-4 h-4" />;
      case 'industriel': return <Factory className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl">Bibliothèque de templates</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Démarrez rapidement avec des modèles pré-configurés pour votre type de territoire
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-lg bg-background"
              >
                <option value="all">Toutes catégories</option>
                <option value="environnement">Environnement</option>
                <option value="urbain">Urbain</option>
                <option value="rural">Rural</option>
                <option value="industriel">Industriel</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-2 border rounded-lg bg-background"
              >
                <option value="all">Tous niveaux</option>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground group-hover:from-primary/10 group-hover:to-accent/10 group-hover:text-primary transition-all">
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getCategoryIcon(template.category)}
                      <span className="text-xs text-muted-foreground capitalize">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{template.popularity}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{template.description}</p>
              
              {/* Métriques */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Complétude</span>
                  <span className="font-medium">{template.completeness}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${template.completeness}%` }}
                  />
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
              
              {/* Badges */}
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {template.estimatedTime}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    // Aperçu du template
                    console.log('Aperçu template:', template);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-primary to-accent"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Utiliser
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredTemplates.length === 0 && (
        <Card className="text-center p-8">
          <div className="space-y-3">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Aucun template trouvé</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos filtres ou votre recherche
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};