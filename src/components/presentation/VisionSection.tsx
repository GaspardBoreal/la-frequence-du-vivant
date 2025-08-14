import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, Music, Palette, Globe, BookOpen, Headphones, Video } from 'lucide-react';

export default function VisionSection() {
  const visionElements = [
    {
      icon: Music,
      title: "Symphonie du Futur",
      description: "Imaginez des paysages sonores qui révèlent la santé de notre planète",
      quote: "Chaque espèce a sa partition dans l'orchestre du vivant",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: Palette,
      title: "Art & Science Fusionnés",
      description: "L'intelligence artificielle devient pinceau pour peindre les futurs possibles",
      quote: "L'art révèle ce que les données murmurent",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: Globe,
      title: "Planète Connectée",
      description: "Un réseau mondial de citoyens-poètes documentant la biodiversité",
      quote: "Ensemble, nous sommes les gardiens de demain",
      color: "from-blue-400 to-cyan-500"
    }
  ];

  const experiences = [
    {
      title: "Remontée Dordogne 2050",
      description: "22 marches poétiques le long de la Dordogne, révélant l'évolution du vivant",
      participants: "2,847 participants",
      impact: "155 espèces documentées"
    },
    {
      title: "Symphonie Urbaine",
      description: "Les villes qui chantent leurs écosystèmes cachés",
      participants: "12 métropoles",
      impact: "89% d'engagement citoyen"
    },
    {
      title: "Atlas des Possibles",
      description: "Projections interactives de nos futurs climat 2025-2045",
      participants: "50K+ interactions",
      impact: "4 régions transformées"
    }
  ];

  return (
    <div className="space-y-12">
      {/* En-tête section */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-pink-500/50 text-pink-600">
          <Heart className="h-3 w-3 mr-1" />
          Vision & Rêve Collectif
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            Rêvons l'Avenir
          </span>
          <br />
          <span className="text-foreground">que nous Voulons Créer</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          La transition climatique devient une aventure poétique où chaque citoyen 
          contribue à écrire l'histoire de notre planète renaissante.
        </p>
      </div>

      {/* Éléments de vision */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {visionElements.map((element, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2">
            <div className={`absolute inset-0 bg-gradient-to-br ${element.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <CardHeader className="relative text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${element.color} flex items-center justify-center`}>
                <element.icon className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">{element.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4 text-center">
              <p className="text-muted-foreground">{element.description}</p>
              <blockquote className={`italic text-transparent bg-clip-text bg-gradient-to-r ${element.color} font-semibold`}>
                "{element.quote}"
              </blockquote>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expériences immersives */}
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
            Expériences Immersives Déjà Vécues
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {experiences.map((experience, index) => (
              <div key={index} className="text-center space-y-3 p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <h4 className="font-semibold text-lg">{experience.title}</h4>
                <p className="text-muted-foreground text-sm">{experience.description}</p>
                <div className="space-y-1">
                  <div className="text-primary font-semibold">{experience.participants}</div>
                  <div className="text-xs text-muted-foreground">{experience.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Citation de Gaspard Boréal */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
        <CardContent className="p-12 text-center relative">
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <blockquote className="text-2xl md:text-3xl italic leading-relaxed">
              "Nous ne nous contentons pas de mesurer le déclin. 
              <br />
              <span className="text-primary font-semibold">Nous composons la renaissance.</span>"
            </blockquote>
            <div className="text-muted-foreground">
              <div className="font-semibold">Gaspard Boréal</div>
              <div className="text-sm">Créateur, Poète-Technologue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Témoignages citoyens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="italic text-muted-foreground">
                "J'ai découvert que mon jardin abritait 23 espèces d'oiseaux. 
                Cette expérience a transformé mon rapport à la nature."
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">M</span>
                </div>
                <span>Marie, 34 ans • Participante Bordeaux</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="italic text-muted-foreground">
                "Mes enfants me demandent maintenant : 'Papa, on va écouter 
                les oiseaux aujourd'hui ?' C'est magique."
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">P</span>
                </div>
                <span>Pierre, 42 ans • Père de famille • Périgueux</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Vision */}
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-bold">Prêt à Rejoindre cette Aventure ?</h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Headphones className="h-4 w-4 mr-2" />
            Commencer mon Voyage Poétique
          </Button>
          <Button variant="outline" size="lg">
            <Video className="h-4 w-4 mr-2" />
            Voir les Témoignages Complets
          </Button>
        </div>
      </div>
    </div>
  );
}