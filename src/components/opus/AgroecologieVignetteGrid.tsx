import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processAgroecologieData, getDomaineIcon, getTypeIcon, getFaisabiliteColor, getImpactColor, getDomaineColor, type AgroecologieLevier, type ProcessedAgroecologieData } from '@/utils/agroecologieDataUtils';
import { Sprout, Lightbulb, Clock, MapPin, Euro, Users, Target, AlertTriangle, ExternalLink, TreePine, ChevronDown, ChevronUp, Droplets, Leaf } from 'lucide-react';

interface AgroecologieVignetteGridProps {
  data: any;
  importSources?: any[];
  className?: string;
}

interface DetailedLevierCardProps {
  levier: AgroecologieLevier;
}

const DetailedLevierCard: React.FC<DetailedLevierCardProps> = ({
  levier
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const TypeIcon = getTypeIcon(levier.type);
  const DomaineIcon = getDomaineIcon(levier.domaine_application);

  return (
    <Card className="h-full overflow-hidden bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5 border-green-500/10 hover:border-green-500/20 transition-all duration-300 hover:shadow-lg group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary">
              <TypeIcon className="w-5 h-5 flex-shrink-0 text-green-600" />
              <span className="truncate text-green-700">{levier.titre}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {levier.description_courte}
            </p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Badge className={`text-xs ${getFaisabiliteColor(levier.faisabilite)}`}>
              {levier.faisabilite}
            </Badge>
            <Badge className={`text-xs ${getImpactColor(levier.impact_environnemental)}`}>
              Impact: {levier.impact_environnemental}
            </Badge>
            <Badge className={`text-xs ${getDomaineColor(levier.domaine_application)}`}>
              <DomaineIcon className="w-3 h-3 mr-1" />
              {levier.domaine_application}
            </Badge>
          </div>
        </div>

        {/* Métadonnées principales */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TreePine className="w-3 h-3 text-green-500" />
            <span>Impact: {levier.metadata.niveau_impact}/5</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>{levier.metadata.timeline_deploiement}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Euro className="w-3 h-3 text-purple-500" />
            <span>{levier.metadata.cout_estimatif}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Leaf className="w-3 h-3 text-amber-500" />
            <span>{levier.category}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Bouton d'expansion */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full mb-3 text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Masquer les détails
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Voir les détails
            </>
          )}
        </Button>

        {/* Détails expandables */}
        {isExpanded && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Techniques */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-green-700">
                <Target className="w-3 h-3" />
                Techniques clés
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {levier.metadata.techniques.slice(0, 3).map((technique, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-400 mt-2 flex-shrink-0"></span>
                    <span>{technique}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bénéfices */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-emerald-700">
                <Lightbulb className="w-3 h-3" />
                Bénéfices environnementaux
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {levier.metadata.benefices.slice(0, 2).map((benefice, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></span>
                    <span>{benefice}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Défis */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                Défis de mise en œuvre
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {levier.metadata.defis.slice(0, 2).map((defi, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                    <span>{defi}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Partenaires */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-blue-700">
                <Users className="w-3 h-3" />
                Partenaires clés
              </h4>
              <div className="flex flex-wrap gap-1">
                {levier.metadata.partenaires_potentiels.slice(0, 3).map((partenaire, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                    {partenaire}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Synergies */}
            {levier.metadata.synergies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-purple-700">
                  <ExternalLink className="w-3 h-3" />
                  Synergies
                </h4>
                <div className="flex flex-wrap gap-1">
                  {levier.metadata.synergies.map((synergie, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                      {synergie}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AgroecologieVignetteGrid: React.FC<AgroecologieVignetteGridProps> = ({
  data,
  importSources = [],
  className = ''
}) => {
  console.log('🌱 DEBUG AgroecologieVignetteGrid received data:', data);
  
  const processedData = processAgroecologieData(data);
  console.log('🌱 DEBUG AgroecologieVignetteGrid processed data:', processedData);
  
  const [generatedData, setGeneratedData] = useState<ProcessedAgroecologieData | null>(null);
  const displayData = generatedData ?? processedData;

  const handleGenerateDefaults = () => {
    const defaults = [
      'Agroforesterie productive',
      'Corridors écologiques cultivés', 
      'Gestion intégrée de l\'eau',
      'Agriculture régénérative',
      'Énergie renouvelable agricole',
    ];
    const gen = processAgroecologieData(defaults);
    setGeneratedData(gen);
  };
  
  if (processedData.totalCount === 0 && !generatedData) {
    return (
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardContent className="p-12 text-center">
          <Sprout className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Aucun levier agroécologique</h3>
          <p className="text-muted-foreground mb-4">
            Aucun levier d'agroécologie n'a été identifié pour ce territoire.
          </p>
          <Button onClick={handleGenerateDefaults} className="font-semibold">
            Proposer 5 leviers agroécologiques par défaut
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sprout className="w-6 h-6 text-green-600" />
            <div>
              <span>Transition Agroécologique Territoriale</span>
              <Badge variant="secondary" className="ml-2">
                {displayData.totalCount} levier{displayData.totalCount > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Découvrez les leviers agroécologiques adaptés au contexte territorial pour accompagner 
            la transition vers des systèmes agricoles durables et résilients.
          </p>
          
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {displayData.par_faisabilite.facile.length}
              </div>
              <div className="text-xs text-muted-foreground">Faciles à déployer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {displayData.par_faisabilite.modere.length}
              </div>
              <div className="text-xs text-muted-foreground">Complexité modérée</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {displayData.leviers.filter(l => l.impact_environnemental === 'fort').length}
              </div>
              <div className="text-xs text-muted-foreground">Impact fort</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(displayData.par_domaine).filter(key => displayData.par_domaine[key as keyof typeof displayData.par_domaine].length > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Domaines couverts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation par onglets */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="vegetal">Végétal</TabsTrigger>
          <TabsTrigger value="hydrique">Hydrique</TabsTrigger>
          <TabsTrigger value="biodiversite">Biodiversité</TabsTrigger>
          <TabsTrigger value="sol">Sol</TabsTrigger>
          <TabsTrigger value="energie">Énergie</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayData.leviers.map((levier, index) => (
              <DetailedLevierCard key={`all-${index}`} levier={levier} />
            ))}
          </div>
        </TabsContent>

        {Object.entries(displayData.par_domaine).map(([domaine, leviers]) => (
          <TabsContent key={domaine} value={domaine} className="mt-6">
            {leviers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leviers.map((levier, index) => (
                  <DetailedLevierCard key={`${domaine}-${index}`} levier={levier} />
                ))}
              </div>
            ) : (
              <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground mb-2">
                    {React.createElement(getDomaineIcon(domaine), {
                      className: "w-12 h-12 mx-auto mb-2"
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aucun levier agroécologique pour le domaine {domaine}.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};