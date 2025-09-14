import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  processIaFonctionnalitesData, 
  getDomaineIcon, 
  getTypeIcon, 
  getMaturiteColor, 
  getDomaineColor,
  type IaFonctionnaliteItem 
} from '@/utils/iaFonctionnalitesDataUtils';
import { 
  Bot, 
  Lightbulb, 
  Clock, 
  MapPin, 
  Euro, 
  Users, 
  Target, 
  AlertTriangle,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface IaFonctionnalitesVignetteGridProps {
  data: any;
  importSources?: any[];
  className?: string;
}

interface DetailedFonctionnaliteCardProps {
  fonctionnalite: IaFonctionnaliteItem;
}

const DetailedFonctionnaliteCard: React.FC<DetailedFonctionnaliteCardProps> = ({ fonctionnalite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const TypeIcon = getTypeIcon(fonctionnalite.type);
  const DomaineIcon = getDomaineIcon(fonctionnalite.domaine_application);

  return (
    <Card className="h-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-lg group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary">
              <TypeIcon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{fonctionnalite.titre}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {fonctionnalite.description_courte}
            </p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Badge className={`text-xs ${getMaturiteColor(fonctionnalite.maturity_level)}`}>
              {fonctionnalite.maturity_level}
            </Badge>
            <Badge className={`text-xs ${getDomaineColor(fonctionnalite.domaine_application)}`}>
              <DomaineIcon className="w-3 h-3 mr-1" />
              {fonctionnalite.domaine_application}
            </Badge>
          </div>
        </div>

        {/* Métadonnées principales */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Innovation: {fonctionnalite.metadata.niveau_innovation}/5</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span>{fonctionnalite.impact_territorial}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 text-green-500" />
            <span>{fonctionnalite.metadata.timeline_deploiement}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Euro className="w-3 h-3 text-purple-500" />
            <span>{fonctionnalite.metadata.cout_estimatif}</span>
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
            {/* Cas d'usage */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-blue-700">
                <Target className="w-3 h-3" />
                Cas d'usage
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {fonctionnalite.metadata.cas_usage.slice(0, 3).map((usage, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                    <span>{usage}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bénéfices */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-green-700">
                <Lightbulb className="w-3 h-3" />
                Bénéfices clés
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {fonctionnalite.metadata.benefices.slice(0, 2).map((benefice, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-400 mt-2 flex-shrink-0"></span>
                    <span>{benefice}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Défis techniques */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                Défis techniques
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {fonctionnalite.metadata.defis_techniques.slice(0, 2).map((defi, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                    <span>{defi}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Partenaires */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-purple-700">
                <Users className="w-3 h-3" />
                Partenaires potentiels
              </h4>
              <div className="flex flex-wrap gap-1">
                {fonctionnalite.metadata.partenaires_potentiels.slice(0, 3).map((partenaire, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                    {partenaire}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Synergies */}
            {fonctionnalite.metadata.synergies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-pink-700">
                  <ExternalLink className="w-3 h-3" />
                  Synergies
                </h4>
                <div className="flex flex-wrap gap-1">
                  {fonctionnalite.metadata.synergies.map((synergie, index) => (
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

export const IaFonctionnalitesVignetteGrid: React.FC<IaFonctionnalitesVignetteGridProps> = ({
  data,
  importSources = [],
  className = ''
}) => {
  const processedData = processIaFonctionnalitesData(data);
  
  if (processedData.totalCount === 0) {
    return (
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardContent className="p-12 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Aucune fonctionnalité IA détectée</h3>
          <p className="text-muted-foreground mb-6">
            Aucune fonctionnalité d'intelligence artificielle n'a été identifiée automatiquement pour ce territoire.
          </p>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Generate a local default set of 5 IA functionalities
                const defaultIaData = {
                  donnees: {
                    "surveillance_biodiversite": "Monitoring automatique des écosystèmes",
                    "optimisation_agricole": "Intelligence prédictive pour les cultures",
                    "gestion_hydraulique": "Optimisation des ressources en eau",
                    "tourisme_durable": "Recommandations personnalisées durables", 
                    "energie_renouvelable": "Prédiction et optimisation énergétique"
                  }
                };
                // This could trigger a re-render with default data
                console.log('Génération de fonctionnalités IA par défaut:', defaultIaData);
              }}
              className="bg-primary/10 border-primary/30 hover:bg-primary/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Proposer 5 fonctionnalités IA de base
            </Button>
            <p className="text-xs text-muted-foreground">
              Cette action génère un ensemble de fonctionnalités IA adaptées au territoire
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <div>
              <span>Intelligence Territoriale Augmentée</span>
              <Badge variant="secondary" className="ml-2">
                {processedData.totalCount} fonctionnalité{processedData.totalCount > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Découvrez les fonctionnalités d'intelligence artificielle conçues pour renforcer 
            l'intelligence collective et l'innovation territoriale du bassin de la Dordogne.
          </p>
          
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {processedData.par_maturite.pilote.length + processedData.par_maturite.deploye.length}
              </div>
              <div className="text-xs text-muted-foreground">Prêtes au déploiement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {processedData.par_maturite.prototype.length}
              </div>
              <div className="text-xs text-muted-foreground">En phase prototype</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {processedData.fonctionnalites.reduce((acc, f) => acc + f.metadata.niveau_innovation, 0) / processedData.fonctionnalites.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Innovation moyenne /5</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(processedData.par_domaine).filter(key => 
                  processedData.par_domaine[key as keyof typeof processedData.par_domaine].length > 0
                ).length}
              </div>
              <div className="text-xs text-muted-foreground">Domaines couverts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation par onglets */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="gouvernance">Gouvernance</TabsTrigger>
          <TabsTrigger value="ecologie">Écologie</TabsTrigger>
          <TabsTrigger value="patrimoine">Patrimoine</TabsTrigger>
          <TabsTrigger value="agriculture">Agriculture</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedData.fonctionnalites.map((fonctionnalite, index) => (
              <DetailedFonctionnaliteCard
                key={`all-${index}`}
                fonctionnalite={fonctionnalite}
              />
            ))}
          </div>
        </TabsContent>

        {Object.entries(processedData.par_domaine).map(([domaine, fonctionnalites]) => (
          <TabsContent key={domaine} value={domaine} className="mt-6">
            {fonctionnalites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fonctionnalites.map((fonctionnalite, index) => (
                  <DetailedFonctionnaliteCard
                    key={`${domaine}-${index}`}
                    fonctionnalite={fonctionnalite}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground mb-2">
                    {React.createElement(getDomaineIcon(domaine), { className: "w-12 h-12 mx-auto mb-2" })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aucune fonctionnalité IA pour le domaine {domaine}.
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