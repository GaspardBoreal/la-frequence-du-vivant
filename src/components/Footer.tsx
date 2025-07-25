
import React from 'react';
import { ExternalLink, BookOpen, Mic, MapPin, Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card/40 backdrop-blur-lg border-t border-border/20 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Écosystème Gaspard Boréal */}
          <div className="space-y-4">
            <h3 className="font-crimson text-xl text-accent font-medium">
              Une Création Gaspard Boréal
            </h3>
            <div className="space-y-2">
              <a 
                href="https://www.gaspardboreal.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <ExternalLink size={16} />
                <span>Découvrir l'auteur</span>
              </a>
              <a 
                href="https://www.gaspardboreal.com/observatoire-2025-2037" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <BookOpen size={16} />
                <span>Observatoire Mondes Hybrides</span>
              </a>
              <a 
                href="https://www.gaspardboreal.com/conferences" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <Mic size={16} />
                <span>Conférences & Chaires</span>
              </a>
            </div>
          </div>

          {/* Domaines d'exploration */}
          <div className="space-y-4">
            <h3 className="font-crimson text-xl text-accent font-medium">
              Domaines d'Exploration
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-950/30 border border-green-500/20 rounded-full text-xs text-green-300">
                <Zap size={12} />
                Art-IA-Vivant
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-950/30 border border-green-500/20 rounded-full text-xs text-green-300">
                <MapPin size={12} />
                Géopoétique
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-950/30 border border-green-500/20 rounded-full text-xs text-green-300">
                Marches Sensibles
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-950/30 border border-green-500/20 rounded-full text-xs text-green-300">
                Bioacoustique
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-950/30 border border-green-500/20 rounded-full text-xs text-green-300">
                Transition Agroécologique
              </span>
            </div>
          </div>

          {/* Ressources académiques */}
          <div className="space-y-4">
            <h3 className="font-crimson text-xl text-accent font-medium">
              Ressources Académiques
            </h3>
            <div className="space-y-2">
              <a 
                href="#ressources" 
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <BookOpen size={16} />
                <span>Matériel pédagogique</span>
              </a>
              <a 
                href="#presse" 
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <ExternalLink size={16} />
                <span>Dossier presse & éditeurs</span>
              </a>
              <a 
                href="https://www.gaspardboreal.com/contact-institutions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <Mic size={16} />
                <span>Contact institutions</span>
              </a>
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-border/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2025 Gaspard Boréal - Observatoire Poétique des Mondes Hybrides
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="hover:text-accent cursor-pointer">#BioacoustiquePoétique</span>
              <span className="hover:text-accent cursor-pointer">#MondesHybrides</span>
              <span className="hover:text-accent cursor-pointer">#TransitionAgroécologique</span>
              <span className="hover:text-accent cursor-pointer">#PoésieProspective</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
