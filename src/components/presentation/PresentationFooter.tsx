import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Github, 
  Twitter, 
  Linkedin, 
  MapPin, 
  Phone, 
  ExternalLink,
  Download,
  BookOpen,
  Zap,
  Users,
  Cpu,
  Heart,
  Send
} from 'lucide-react';

export default function PresentationFooter() {
  const [email, setEmail] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<'territorial' | 'innovation' | 'vision'>('territorial');

  const profiles = [
    { id: 'territorial', label: 'Acteur Territorial', icon: Users },
    { id: 'innovation', label: 'Entreprise Tech', icon: Cpu },
    { id: 'vision', label: 'Citoyen Engagé', icon: Heart }
  ];

  const resources = [
    { title: "Documentation API", icon: BookOpen, description: "Guide complet des endpoints", href: "#" },
    { title: "Open Source Components", icon: Github, description: "Composants réutilisables", href: "#" },
    { title: "Études de Cas", icon: ExternalLink, description: "Retours d'expérience détaillés", href: "#" },
    { title: "Données Ouvertes", icon: Download, description: "Accès aux datasets", href: "#" }
  ];

  const quickLinks = {
    territorial: [
      { label: "Planifier mon adaptation", action: "demo-territorial" },
      { label: "Calculer le ROI", action: "roi-calculator" },
      { label: "Cas d'usage similaires", action: "use-cases" }
    ],
    innovation: [
      { label: "Tester les APIs", action: "api-sandbox" },
      { label: "Documentation technique", action: "docs" },
      { label: "Partenariat développeur", action: "partnership" }
    ],
    vision: [
      { label: "Commencer l'expérience", action: "start-journey" },
      { label: "Rejoindre la communauté", action: "community" },
      { label: "Devenir ambassadeur", action: "ambassador" }
    ]
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique d'inscription newsletter
    console.log('Newsletter subscription:', { email, profile: selectedProfile });
    setEmail('');
  };

  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Newsletter personnalisée */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Restons Connectés</h3>
              <p className="text-muted-foreground">
                Recevez les dernières innovations, témoignages et opportunités 
                selon votre profil.
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Votre profil</label>
                  <div className="flex flex-wrap gap-2">
                    {profiles.map((profile) => (
                      <Button
                        key={profile.id}
                        variant={selectedProfile === profile.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedProfile(profile.id as any)}
                        className="flex items-center gap-2"
                      >
                        <profile.icon className="h-3 w-3" />
                        {profile.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    S'abonner aux Actualités
                  </Button>
                </form>

                {/* Liens rapides selon profil */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Actions rapides</div>
                  <div className="space-y-1">
                    {quickLinks[selectedProfile].map((link, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                      >
                        <Zap className="h-3 w-3 mr-2" />
                        {link.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ressources */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Ressources</h3>
            <div className="grid grid-cols-1 gap-4">
              {resources.map((resource, index) => (
                <Card key={index} className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <resource.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{resource.title}</div>
                        <div className="text-xs text-muted-foreground">{resource.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact & Informations */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Contact</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Bordeaux, France</div>
                  <div className="text-sm text-muted-foreground">Nouvelle-Aquitaine</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">contact@frequence-vivant.fr</div>
                  <div className="text-sm text-muted-foreground">Partenariats & Collaboration</div>
                </div>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Suivez-nous</div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Certifications</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  🇪🇺 Green Deal EU
                </Badge>
                <Badge variant="outline" className="text-xs">
                  🔬 CNRS Partnership
                </Badge>
                <Badge variant="outline" className="text-xs">
                  🌱 ADEME Labeled
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Bas de page */}
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Fréquence du Vivant • Gaspard Boréal • 
              <span className="text-primary"> Révolution Territoriale</span>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <button className="hover:text-foreground transition-colors">
                Mentions légales
              </button>
              <button className="hover:text-foreground transition-colors">
                Politique de confidentialité
              </button>
              <button className="hover:text-foreground transition-colors">
                Conditions d'utilisation
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}