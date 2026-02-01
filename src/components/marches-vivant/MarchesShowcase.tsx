import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Camera, Mic2, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useFeaturedMarches } from '@/hooks/useFeaturedMarches';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface MarchesShowcaseProps {
  className?: string;
  onContactClick?: () => void;
}

const MarchesShowcase: React.FC<MarchesShowcaseProps> = ({ className = '', onContactClick }) => {
  const { data: featuredMarches, isLoading } = useFeaturedMarches(5);

  if (isLoading) {
    return (
      <div className={`py-16 ${className}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-card/40 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!featuredMarches || featuredMarches.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-500/20 rounded-full mb-4">
            <Camera className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-xs uppercase tracking-wide text-amber-300">
              Preuves Visuelles
            </span>
          </div>
          <h2 className="font-crimson text-3xl md:text-4xl text-foreground mb-3">
            32 Marches Documentées
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Chaque marche est une expérience unique, documentée scientifiquement et photographiée par nos équipes.
          </p>
        </motion.div>

        {/* Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {featuredMarches.slice(0, 3).map((marche, index) => (
            <motion.div
              key={marche.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group relative overflow-hidden rounded-2xl bg-card/40 border border-border/30 hover:border-emerald-500/30 transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden">
                {marche.cover_photo_url ? (
                  <img
                    src={marche.cover_photo_url}
                    alt={marche.nom_marche || marche.ville}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-950/50 to-background flex items-center justify-center">
                    <Leaf className="w-12 h-12 text-emerald-500/30" />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                
                {/* Date badge */}
                {formatDate(marche.date) && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatDate(marche.date)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-crimson text-xl text-foreground leading-tight">
                      {marche.nom_marche || marche.ville}
                    </h3>
                    {marche.nom_marche && (
                      <p className="text-sm text-muted-foreground">{marche.ville}</p>
                    )}
                  </div>
                </div>

                {/* Stats badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {marche.total_species > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-full">
                      <Leaf className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-emerald-300">{marche.total_species.toLocaleString('fr-FR')} espèces</span>
                    </div>
                  )}
                  {marche.photos_count > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-950/40 border border-amber-500/20 rounded-full">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-300">{marche.photos_count} photos</span>
                    </div>
                  )}
                  {marche.audio_count > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-950/40 border border-purple-500/20 rounded-full">
                      <Mic2 className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-300">Audio</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onContactClick}
          >
            Organisez une expérience similaire
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default MarchesShowcase;
