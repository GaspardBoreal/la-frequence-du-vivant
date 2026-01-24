
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, BookOpen, Mic, MapPin, Leaf, Settings } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card/40 backdrop-blur-lg border-t border-border/20 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Écosystème Gaspard Boréal */}
          <div className="space-y-4">
            <div className="font-crimson text-white text-center sm:text-left">
              <div className="text-xl font-medium">Gaspard Boréal</div>
              <div className="text-sm opacity-80">Poète des Mondes Hybrides</div>
            </div>
            <div className="space-y-2">
              <a 
                href="https://www.gaspardboreal.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <ExternalLink size={16} />
                <span>Découvrir l'auteur</span>
              </a>
              <a 
                href="https://www.gaspardboreal.com/comedie-2025" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <BookOpen size={16} />
                <span>Comédie des Mondes Hybrides</span>
              </a>
              <a 
                href="https://www.gaspardboreal.com/conferences" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <Mic size={16} />
                <span>Conférences & Chaires</span>
              </a>
            </div>
          </div>

          {/* Explorer les fréquences */}
          <div className="space-y-4">
            <a 
              href="/"
              className="font-crimson text-xl text-white font-medium hover:text-[#4ade80] transition-colors block"
            >
              Explorer les fréquences
            </a>
            <div className="space-y-2">
              <a 
                href="/bioacoustique/la-ou-elle-se-jette-je-me-redresse-a-bec-dambes--bec-dambes-gauriac" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <MapPin size={16} />
                <span>Marches Sensibles</span>
              </a>
              <Link 
                to="/explorations-sensibles" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <Leaf size={16} />
                <span>Explorations Sensibles</span>
              </Link>
              <Link 
                to="/bioacoustique-poetique" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
                onClick={() => {
                  // Scroll to top when navigating
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
              >
                <BookOpen size={16} />
                <span>Bioacoustique Poétique</span>
              </Link>
            </div>
          </div>

          {/* Ressources académiques */}
          <div className="space-y-4">
            <h3 className="font-crimson text-xl text-white font-medium">
              Ressources Académiques
            </h3>
            <div className="space-y-2">
              <Link 
                to="/materiel-pedagogique" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
                onClick={() => {
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
              >
                <BookOpen size={16} />
                <span>Matériel pédagogique</span>
              </Link>
              <a 
                href="#presse" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <ExternalLink size={16} />
                <span>Dossier presse & éditeurs</span>
              </a>
              <a 
                href="https://www.gaspardboreal.com/contact" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <Mic size={16} />
                <span>Contacter Gaspard Boréal</span>
              </a>
              <Link 
                to="/access-admin-gb2025" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors font-medium"
              >
                <Settings size={16} />
                <span>Administration</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-border/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2025 - 2026 Gaspard Boréal - Observatoire Poétique des Mondes Hybrides
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="hover:text-[#4ade80] cursor-pointer">#BioacustiquePoétique</span>
              <span className="hover:text-[#4ade80] cursor-pointer">#MondesHybrides</span>
              <span className="hover:text-[#4ade80] cursor-pointer">#TransitionAgroécologique</span>
              <span className="hover:text-[#4ade80] cursor-pointer">#PoésieProspective</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
