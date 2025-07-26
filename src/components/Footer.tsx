
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, BookOpen, Mic, MapPin, Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card/40 backdrop-blur-lg border-t border-border/20 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Écosystème Gaspard Boréal */}
          <div className="space-y-4">
            <h3 className="font-crimson text-xl text-white font-medium">
              Une Création Gaspard Boréal
            </h3>
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
                href="/marche/entre-deux-frequences-bonzac-bonzac" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <MapPin size={16} />
                <span>Marches Sensibles</span>
              </a>
              <a 
                href="/marches-techno-sensibles" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <Zap size={16} />
                <span>Explorer la cartographie</span>
              </a>
              <a 
                href="#bioacoustique-poetique" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <BookOpen size={16} />
                <span>Bioacoustique Poétique</span>
              </a>
            </div>
          </div>

          {/* Ressources académiques */}
          <div className="space-y-4">
            <h3 className="font-crimson text-xl text-white font-medium">
              Ressources Académiques
            </h3>
            <div className="space-y-2">
              <a 
                href="#ressources" 
                className="flex items-center gap-2 text-muted-foreground hover:text-[#4ade80] transition-colors"
              >
                <BookOpen size={16} />
                <span>Matériel pédagogique</span>
              </a>
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
              <span className="hover:text-[#4ade80] cursor-pointer">#BioacoustiquePoétique</span>
              <span className="hover:text-[#4ade80] cursor-pointer">#MondesHybrides</span>
              <span className="hover:text-[#4ade80] cursor-pointer">#TransitionAgroécologique</span>
              <Link 
                to="/access-admin-gb2025" 
                className="hover:text-[#4ade80] cursor-pointer"
              >
                #PoésieProspective
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
