import React from 'react';
import { motion } from 'framer-motion';
import { Linkedin, ExternalLink } from 'lucide-react';

export interface ContributeurData {
  nom: string;
  role: string;
  bio?: string;
  linkedin?: string;
  photo?: string;
  couleur?: 'emerald' | 'orange' | 'blue' | 'purple';
}

interface ContributeurCardProps {
  contributeur: ContributeurData;
  index?: number;
}

const colorClasses = {
  emerald: 'border-emerald-500/30 hover:border-emerald-400/50',
  orange: 'border-orange-500/30 hover:border-orange-400/50',
  blue: 'border-blue-500/30 hover:border-blue-400/50',
  purple: 'border-purple-500/30 hover:border-purple-400/50',
};

const ContributeurCard: React.FC<ContributeurCardProps> = ({ 
  contributeur, 
  index = 0 
}) => {
  const borderClass = colorClasses[contributeur.couleur || 'emerald'];
  
  // Générer les initiales pour l'avatar par défaut
  const initials = contributeur.nom
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      viewport={{ once: true }}
      className={`bg-card/40 backdrop-blur-sm border ${borderClass} rounded-xl p-6 transition-all duration-300`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {contributeur.photo ? (
            <img 
              src={contributeur.photo} 
              alt={contributeur.nom}
              className="w-16 h-16 rounded-full object-cover border-2 border-border/50"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 border-2 border-emerald-500/30 flex items-center justify-center">
              <span className="font-crimson text-xl text-emerald-300">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <h3 className="font-crimson text-lg text-foreground">
            {contributeur.nom}
          </h3>
          <p className="text-sm text-emerald-400 font-medium">
            {contributeur.role}
          </p>
          
          {contributeur.bio && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
              {contributeur.bio}
            </p>
          )}

          {contributeur.linkedin && (
            <a
              href={contributeur.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {contributeur.linkedin.includes('linkedin.com') ? (
                <>
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Site de l'auteur</span>
                </>
              )}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContributeurCard;
