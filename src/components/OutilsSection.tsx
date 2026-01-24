import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Headphones, 
  BookOpen, 
  ExternalLink, 
  Database,
  Wrench,
  Bird,
  Leaf,
  Music,
  FileText,
  Globe,
  CloudSun
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Outil {
  nom: string;
  description: string;
  url?: string;
  inApp?: boolean;
}

interface CategorieOutils {
  categorie: string;
  icon: React.ElementType;
  color: string;
  description: string;
  outils: Outil[];
}

const OUTILS_MARCHEUR: CategorieOutils[] = [
  {
    categorie: "Identifier",
    icon: Search,
    color: "emerald",
    description: "Reconnaissance sur le terrain",
    outils: [
      { nom: "Merlin Bird ID", description: "Reconnaissance audio des oiseaux en temps réel", url: "https://merlin.allaboutbirds.org/" },
      { nom: "Seek", description: "Identification visuelle de la flore et faune", url: "https://www.inaturalist.org/pages/seek_app" }
    ]
  },
  {
    categorie: "Écouter",
    icon: Headphones,
    color: "cyan",
    description: "Exploration des paysages sonores",
    outils: [
      { nom: "Xeno-Canto", description: "Bibliothèque mondiale de chants d'oiseaux", url: "https://xeno-canto.org/" },
      { nom: "Spectrogrammes", description: "Visualisation des signatures acoustiques", inApp: true }
    ]
  },
  {
    categorie: "Documenter",
    icon: BookOpen,
    color: "purple",
    description: "Traces et récits de terrain",
    outils: [
      { nom: "Carnet de terrain", description: "Croquis, haïkus, observations manuscrites" },
      { nom: "la-frequence-du-vivant.com", description: "Plateforme de documentation et d'archivage", url: "/" }
    ]
  }
];

interface SourceOpenData {
  nom: string;
  description: string;
  url: string;
  icon: React.ElementType;
  volume?: string;
}

const SOURCES_OPEN_DATA: SourceOpenData[] = [
  { nom: "GBIF", description: "Occurrences biodiversité mondiales", url: "https://www.gbif.org/", icon: Globe, volume: "1.8 Mrd" },
  { nom: "iNaturalist", description: "Science citoyenne géolocalisée", url: "https://www.inaturalist.org/", icon: Leaf },
  { nom: "eBird", description: "Base ornithologique Cornell", url: "https://ebird.org/", icon: Bird },
  { nom: "Xeno-Canto", description: "Chants d'oiseaux (qualité A)", url: "https://xeno-canto.org/", icon: Music },
  { nom: "INPN", description: "Taxonomie officielle France", url: "https://inpn.mnhn.fr/", icon: FileText },
  { nom: "Open-Meteo", description: "Météo historique précise", url: "https://open-meteo.com/", icon: CloudSun }
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string; badge: string; iconBg: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      iconBg: 'bg-emerald-500/20'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      iconBg: 'bg-cyan-500/20'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      iconBg: 'bg-purple-500/20'
    }
  };
  return colors[color] || colors.emerald;
};

const CategorieCard: React.FC<{ categorie: CategorieOutils; delay: number }> = ({ categorie, delay }) => {
  const colorClasses = getColorClasses(categorie.color);
  const Icon = categorie.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative ${colorClasses.bg} backdrop-blur-sm border ${colorClasses.border} rounded-2xl p-6 hover:border-opacity-50 transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${colorClasses.iconBg}`}>
          <Icon className={`w-6 h-6 ${colorClasses.text}`} />
        </div>
        <div>
          <h3 className="font-libre text-lg font-semibold text-foreground">{categorie.categorie}</h3>
          <p className="text-sm text-muted-foreground">{categorie.description}</p>
        </div>
      </div>
      
      {/* Outils */}
      <div className="space-y-3">
        {categorie.outils.map((outil, index) => (
          <div key={index} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background/30">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm">{outil.nom}</span>
                {outil.inApp && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-foreground/20 text-muted-foreground">
                    intégré
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{outil.description}</p>
            </div>
            {outil.url && (
              <a 
                href={outil.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`p-1.5 rounded-lg ${colorClasses.bg} hover:scale-110 transition-transform`}
              >
                <ExternalLink className={`w-3.5 h-3.5 ${colorClasses.text}`} />
              </a>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const OutilsSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Outils & Ressources
            </span>
          </div>
          <h2 className="font-libre text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ce que le marcheur emporte
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Applications de terrain, bases de données naturalistes et outils de documentation 
            pour une exploration scientifiquement ancrée.
          </p>
        </motion.div>

        {/* Grille des catégories */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {OUTILS_MARCHEUR.map((cat, index) => (
            <CategorieCard key={cat.categorie} categorie={cat} delay={index * 0.1} />
          ))}
        </div>

        {/* Sources Open Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-libre text-xl font-semibold text-foreground">Sources Open Data</h3>
              <p className="text-sm text-muted-foreground">Données scientifiques alimentant nos analyses</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SOURCES_OPEN_DATA.map((source, index) => {
              const Icon = source.icon;
              return (
                <motion.a
                  key={source.nom}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/20 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{source.nom}</span>
                      {source.volume && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-400">
                          {source.volume}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{source.description}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors flex-shrink-0" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OutilsSection;
