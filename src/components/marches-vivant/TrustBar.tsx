import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  { name: 'bziiit', logo: '/logos/bziiit.svg', url: 'https://www.bziiit.com/' },
  { name: 'Piloterra', logo: '/logos/piloterra.svg', url: 'https://piloterra.fr/' },
  { name: 'Osfarm', logo: '/logos/osfarm.svg', url: 'https://www.osfarm.org/fr/' },
];

interface TrustBarProps {
  showQualiopi?: boolean;
  className?: string;
}

const TrustBar: React.FC<TrustBarProps> = ({ showQualiopi = true, className = '' }) => {
  return (
    <div className={`py-8 ${className}`}>
      <div className="text-center mb-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
          Partenaires & Certifications
        </span>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {partners.map((partner, index) => (
          <motion.a
            key={partner.name}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-card/50"
          >
            {/* Fallback text logo si pas d'image */}
            <span className="font-crimson text-lg text-muted-foreground grayscale group-hover:grayscale-0 group-hover:text-foreground transition-all duration-300">
              {partner.name}
            </span>
          </motion.a>
        ))}
        
        {showQualiopi && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg"
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-300">
              Qualiopi
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrustBar;
