import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Database, Brain, Zap, Globe, GitBranch, Cpu, Download } from 'lucide-react';

export default function InnovationSection() {
  const technologies = [
    {
      icon: Brain,
      title: "IA Prédictive Multicouches",
      description: "Modèles d'apprentissage profond pour projections climatiques et biodiversité",
      tech: "TensorFlow • PyTorch • Transformers",
      apiEndpoint: "/api/v1/predictions/climate"
    },
    {
      icon: Database,
      title: "Architecture Data Lake Temps Réel",
      description: "Fusion de 15+ sources de données ouvertes avec traitement temps réel",
      tech: "Supabase • PostgreSQL • Time Series",
      apiEndpoint: "/api/v1/data/biodiversity"
    },
    {
      icon: Globe,
      title: "APIs RESTful & GraphQL",
      description: "Endpoints optimisés pour intégration dans vos solutions existantes",
      tech: "REST • GraphQL • WebSockets",
      apiEndpoint: "/api/v1/integrations"
    }
  ];

  const dataSourcesCategories = [
    {
      title: "Biodiversité",
      sources: ["GBIF Global", "iNaturalist", "Xeno-Canto", "eBird", "INPN France"],
      icon: "🌿"
    },
    {
      title: "Climat & Météo",
      sources: ["Open-Meteo", "Copernicus", "Météo-France", "ECMWF"],
      icon: "🌡️"
    },
    {
      title: "Territoire",
      sources: ["IGN", "Cadastre", "OpenStreetMap", "Corine Land Cover"],
      icon: "🗺️"
    },
    {
      title: "Socio-économique",
      sources: ["INSEE", "Data.gouv.fr", "Eurostat", "World Bank"],
      icon: "📊"
    }
  ];

  return (
    <div className="space-y-12">
      {/* En-tête section */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-blue-500/50 text-blue-600">
          <Cpu className="h-3 w-3 mr-1" />
          Innovation Technologique
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">
          <span className="text-primary">Stack Technologique</span> de Nouvelle Génération
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Architecture cloud-native, APIs enterprise-ready et IA de pointe 
          pour créer vos solutions géolocalisées autour de la biodiversité.
        </p>
      </div>

      {/* Technologies Core */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {technologies.map((tech, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <tech.icon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">{tech.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <p className="text-muted-foreground">{tech.description}</p>
              <div className="space-y-2">
                <div className="text-xs font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">
                  {tech.tech}
                </div>
                <div className="text-xs font-mono bg-muted px-2 py-1 rounded flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  {tech.apiEndpoint}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sources de données */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Écosystème Data & APIs Intégrées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dataSourcesCategories.map((category, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h4 className="font-semibold">{category.title}</h4>
                </div>
                <div className="space-y-2">
                  {category.sources.map((source, sourceIndex) => (
                    <div key={sourceIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {source}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture technique */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue-600" />
            Architecture & Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime garanti</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-purple-600">&lt;100ms</div>
              <div className="text-sm text-muted-foreground">Latence API</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-600">15TB+</div>
              <div className="text-sm text-muted-foreground">Données traitées/mois</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code sample */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Intégration Simplifiée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="space-y-2">
              <div className="text-green-600">// Récupération données biodiversité temps réel</div>
              <div><span className="text-blue-600">const</span> response = <span className="text-purple-600">await</span> fetch(<span className="text-orange-600">'/api/v1/biodiversity'</span>, {'{'};</div>
              <div className="ml-4">params: {'{ lat: 45.1833, lng: 0.7167, radius: 10 }'}</div>
              <div>{'});'}</div>
              <div className="mt-4 text-green-600">// Prédictions climatiques intégrées</div>
              <div><span className="text-blue-600">const</span> predictions = <span className="text-purple-600">await</span> getClimateProjections(2025, 2045);</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Innovation */}
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-bold">Prêt à Intégrer ces Technologies ?</h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Zap className="h-4 w-4 mr-2" />
            Intégrer ces APIs à mes Solutions
          </Button>
          <Button variant="outline" size="lg">
            <Download className="h-4 w-4 mr-2" />
            Documentation Technique
          </Button>
        </div>
      </div>
    </div>
  );
}