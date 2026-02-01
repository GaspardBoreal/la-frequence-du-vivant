import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface HebergeurData {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  departement: string;
  url: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  especesFrequentes?: string[];
}

interface HebergeurCardProps {
  hebergeur: HebergeurData;
  index?: number;
  onSelect?: (hebergeur: HebergeurData) => void;
}

const HebergeurCard: React.FC<HebergeurCardProps> = ({ 
  hebergeur, 
  index = 0,
  onSelect 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      viewport={{ once: true }}
    >
      <Card className="bg-card/40 border-border/30 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden h-full">
        {/* Image ou placeholder */}
        {hebergeur.photo ? (
          <div className="aspect-video relative overflow-hidden">
            <img 
              src={hebergeur.photo} 
              alt={hebergeur.nom}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        ) : (
          <div className="aspect-video bg-emerald-950/30 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-emerald-500/30" />
          </div>
        )}

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-crimson text-lg text-foreground">
              {hebergeur.nom}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {hebergeur.ville} ({hebergeur.departement})
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {hebergeur.adresse}
          </p>

          {/* Espèces fréquentes */}
          {hebergeur.especesFrequentes && hebergeur.especesFrequentes.length > 0 && (
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center gap-1 mb-1.5">
                <Leaf className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">
                  Espèces fréquentes
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {hebergeur.especesFrequentes.slice(0, 3).map((espece) => (
                  <span 
                    key={espece}
                    className="px-1.5 py-0.5 text-[10px] bg-emerald-950/30 border border-emerald-500/20 rounded text-emerald-300"
                  >
                    {espece}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onSelect?.(hebergeur)}
            >
              Organiser une marche
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <a 
                href={hebergeur.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HebergeurCard;
