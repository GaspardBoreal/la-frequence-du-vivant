import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Users, Building, Heart } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      category: "territorial",
      icon: Users,
      name: "Marie Dubois",
      role: "Directrice Urbanisme",
      organization: "Métropole Nouvelle-Aquitaine",
      quote: "Cette plateforme a révolutionné notre approche de l'aménagement territorial. Nous anticipons maintenant les enjeux climatiques avec 20 ans d'avance.",
      rating: 5,
      metrics: "150K€ économisés sur les études environnementales"
    },
    {
      category: "innovation",
      icon: Building,
      name: "Thomas Martin",
      role: "CTO",
      organization: "GreenTech Solutions",
      quote: "Les APIs sont remarquablement bien conçues. Nous avons intégré les données de biodiversité en moins d'une semaine dans nos solutions clients.",
      rating: 5,
      metrics: "Intégration en 3 jours • 99.9% uptime"
    },
    {
      category: "vision",
      icon: Heart,
      name: "Sophie Rousseau",
      role: "Enseignante & Mère",
      organization: "École Primaire Périgueux",
      quote: "Mes élèves découvrent leur territoire avec émerveillement. Cette approche poétique transforme leur relation à la nature.",
      rating: 5,
      metrics: "95% d'engagement des élèves"
    }
  ];

  const statistics = [
    { value: "2,847", label: "Participants actifs", subtext: "Expérience Remontée Dordogne" },
    { value: "155", label: "Espèces documentées", subtext: "Dans 4 régions françaises" },
    { value: "89%", label: "Satisfaction utilisateurs", subtext: "Sur toutes les expériences" },
    { value: "4.8/5", label: "Note moyenne", subtext: "Retours élus territoriaux" }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'territorial': return 'from-green-500 to-emerald-600';
      case 'innovation': return 'from-blue-500 to-purple-600';
      case 'vision': return 'from-purple-500 to-pink-600';
      default: return 'from-primary to-accent';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'territorial': return { text: 'Territorial', color: 'border-green-500/50 text-green-600' };
      case 'innovation': return { text: 'Innovation', color: 'border-blue-500/50 text-blue-600' };
      case 'vision': return { text: 'Vision', color: 'border-purple-500/50 text-purple-600' };
      default: return { text: 'Autre', color: 'border-primary/50 text-primary' };
    }
  };

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* En-tête */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="border-primary/50 text-primary">
            <Star className="h-3 w-3 mr-1" />
            Témoignages & Résultats
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Ils Transforment Déjà 
            <span className="text-primary"> leurs Territoires</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Découvrez comment notre plateforme génère des résultats concrets 
            pour les acteurs territoriaux, les entreprises et les citoyens.
          </p>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {statistics.map((stat, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-all">
              <CardContent className="p-0 space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="font-semibold">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.subtext}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Témoignages détaillés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => {
            const badge = getCategoryBadge(testimonial.category);
            return (
              <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2">
                <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(testimonial.category)} opacity-5`} />
                <CardContent className="relative p-8 space-y-6">
                  {/* Header avec badge */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={badge.color}>
                      <testimonial.icon className="h-3 w-3 mr-1" />
                      {badge.text}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>

                  {/* Citation */}
                  <div className="space-y-4">
                    <Quote className="h-8 w-8 text-primary/30" />
                    <blockquote className="text-lg italic leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                  </div>

                  {/* Profil */}
                  <div className="space-y-2">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.organization}
                    </div>
                  </div>

                  {/* Métriques */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-sm font-medium text-center">
                      {testimonial.metrics}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Proof points supplémentaires */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold">Validation Scientifique & Institutionnelle</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-primary">CNRS</div>
                  <div className="text-sm text-muted-foreground">
                    Partenariat recherche sur l'IA bioacoustique
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-primary">ADEME</div>
                  <div className="text-sm text-muted-foreground">
                    Label innovation transition écologique
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-primary">EUROPE</div>
                  <div className="text-sm text-muted-foreground">
                    Horizon 2020 • Green Deal funding
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}