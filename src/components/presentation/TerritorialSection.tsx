import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MapPin, BarChart3, Target, Euro, Clock, Users, ChevronRight } from 'lucide-react';

export default function TerritorialSection() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "ROI Territorial Immédiat",
      description: "Économies de 30-50% sur les études environnementales grâce à l'automatisation IA",
      metric: "150K€ économisés/an",
      color: "text-green-500"
    },
    {
      icon: Target,
      title: "Aide à la Décision Prédictive",
      description: "Projections climatiques 2025-2045 pour anticiper les adaptations nécessaires",
      metric: "20 ans d'avance",
      color: "text-blue-500"
    },
    {
      icon: Users,
      title: "Engagement Citoyen Gamifié",
      description: "Participation active des habitants via expériences immersives",
      metric: "85% de satisfaction",
      color: "text-purple-500"
    }
  ];

  const useCases = [
    "Planification urbaine adaptée au climat",
    "Optimisation des corridors écologiques",
    "Gestion prédictive des risques naturels",
    "Valorisation du patrimoine naturel",
    "Stratégies de résilience territoriale"
  ];

  return (
    <div className="space-y-12">
      {/* En-tête section */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-green-500/50 text-green-600">
          <Euro className="h-3 w-3 mr-1" />
          Approche Économique
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">
          Transformez vos Territoires en 
          <span className="text-primary"> Leaders Climatiques</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Une solution complète pour anticiper, planifier et réussir votre transition écologique 
          avec un retour sur investissement mesurable.
        </p>
      </div>

      {/* Bénéfices clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className={`w-12 h-12 rounded-lg bg-background border flex items-center justify-center ${benefit.color}`}>
                <benefit.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{benefit.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <p className="text-muted-foreground">{benefit.description}</p>
              <div className={`text-2xl font-bold ${benefit.color}`}>
                {benefit.metric}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cas d'usage territoriaux */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Cas d'Usage Territoriaux Concrets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map((useCase, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{useCase}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Témoignage territorial */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="text-lg italic text-foreground/90">
              "Cette plateforme a révolutionné notre approche de l'aménagement territorial. 
              Nous anticipons maintenant les enjeux climatiques avec 20 ans d'avance."
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <span>Marie Dubois, Directrice Urbanisme • Métropole Nouvelle-Aquitaine</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Territorial */}
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-bold">Prêt à Révolutionner votre Territoire ?</h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Planifier mon Adaptation Climatique
          </Button>
          <Button variant="outline" size="lg">
            <Clock className="h-4 w-4 mr-2" />
            Demander une Démo Territoire
          </Button>
        </div>
      </div>
    </div>
  );
}