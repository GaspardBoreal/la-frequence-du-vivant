import React from 'react';
import { motion } from 'framer-motion';
import { Database, Globe, MapPin, FileCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CSRDProofSectionProps {
  className?: string;
  onLearnMore?: () => void;
}

const CSRDProofSection: React.FC<CSRDProofSectionProps> = ({ className = '', onLearnMore }) => {
  const features = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'Protocoles GBIF',
      description: 'Données connectées au référentiel mondial de biodiversité'
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: 'Géolocalisation certifiée',
      description: 'Horodatage et coordonnées GPS vérifiables'
    },
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: 'Export CSRD',
      description: 'Format compatible rapports extra-financiers'
    }
  ];

  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-background to-blue-950/30 border border-emerald-500/20 p-8 md:p-10"
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
          
          <div className="relative">
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Database className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-crimson text-2xl md:text-3xl text-foreground mb-2">
                  Chaque marche = de la donnée CSRD
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  Vos équipes produisent de la donnée RSE opposable grâce à nos protocoles de collecte scientifique.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col"
                >
                  <div className="p-2.5 rounded-lg bg-card/40 border border-border/30 w-fit mb-3">
                    <span className="text-emerald-400">{feature.icon}</span>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                variant="outline"
                className="border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                onClick={onLearnMore}
              >
                En savoir plus sur nos protocoles
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Conforme aux exigences de reporting extra-financier CSRD 2024
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CSRDProofSection;
