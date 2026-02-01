import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight, LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface FormationData {
  id: string;
  titre: string;
  sousTitre?: string;
  duree: string;
  objectif: string;
  cible: string;
  icon: LucideIcon;
  couleur: 'emerald' | 'orange' | 'blue' | 'purple';
  tags?: string[];
}

interface FormationCardProps {
  formation: FormationData;
  index?: number;
  onContact?: (formationId: string) => void;
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    hover: 'hover:border-emerald-400/50',
  },
  orange: {
    bg: 'bg-orange-950/30',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    hover: 'hover:border-orange-400/50',
  },
  blue: {
    bg: 'bg-blue-950/30',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    hover: 'hover:border-blue-400/50',
  },
  purple: {
    bg: 'bg-purple-950/30',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    hover: 'hover:border-purple-400/50',
  },
};

const FormationCard: React.FC<FormationCardProps> = ({ 
  formation, 
  index = 0,
  onContact 
}) => {
  const colors = colorClasses[formation.couleur];
  const Icon = formation.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      viewport={{ once: true }}
    >
      <Card className={`${colors.bg} ${colors.border} ${colors.hover} border transition-all duration-300 h-full flex flex-col`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${colors.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-crimson text-xl text-foreground leading-tight">
                {formation.titre}
              </h3>
              {formation.sousTitre && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formation.sousTitre}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {formation.objectif}
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formation.duree}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{formation.cible}</span>
            </div>
          </div>

          {formation.tags && formation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formation.tags.map((tag) => (
                <span 
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-card/50 border border-border/50 rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3">
          <Button 
            variant="outline" 
            className="w-full group"
            onClick={() => onContact?.(formation.id)}
          >
            Demander un devis
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FormationCard;
