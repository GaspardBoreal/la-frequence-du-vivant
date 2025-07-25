
import React from 'react';
import { MapPin, Headphones, BarChart3, BookOpen, Users, ExternalLink } from 'lucide-react';

const NavigationMenu = () => {
  const menuItems = [
    {
      title: "Marches Sensibles",
      icon: MapPin,
      href: "#marches",
      description: "Cartographie interactive des territoires hybrides"
    },
    {
      title: "Bioacoustique Poétique",
      icon: Headphones,
      href: "#bioacoustique",
      description: "Explorations sonores du vivant"
    },
    {
      title: "Données Vivantes",
      icon: BarChart3,
      href: "#donnees",
      description: "Visualisations temps réel"
    },
    {
      title: "Territoires Hybrides",
      icon: BookOpen,
      href: "#territoires",
      description: "Géopoétique augmentée"
    },
    {
      title: "Ressources Académiques",
      icon: Users,
      href: "#ressources",
      description: "Matériel pédagogique et recherche"
    },
    {
      title: "L'Auteur",
      icon: ExternalLink,
      href: "https://www.gaspardboreal.com/",
      description: "Découvrir Gaspard Boréal",
      external: true
    }
  ];

  return (
    <nav className="bg-card/30 backdrop-blur-md border-b border-border/20 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Titre */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-mono text-sm uppercase tracking-wide text-green-300">
              La Fréquence du Vivant
            </span>
          </div>

          {/* Menu horizontal pour desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                target={item.external ? "_blank" : "_self"}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group"
              >
                <item.icon size={16} className="group-hover:text-accent" />
                <span>{item.title}</span>
                {item.external && <ExternalLink size={12} />}
              </a>
            ))}
          </div>

          {/* Menu mobile (hamburger) */}
          <div className="md:hidden">
            <button className="text-muted-foreground hover:text-accent">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationMenu;
