
import React from 'react';
import { motion } from 'framer-motion';
import { Database, ExternalLink, FileText, Map } from 'lucide-react';
import { Button } from '../ui/button';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';

interface EtalabSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const EtalabSubSection: React.FC<EtalabSubSectionProps> = ({ marche, theme }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="gaspard-glass rounded-3xl p-12 text-center space-y-8">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
            <Database className="h-12 w-12 text-blue-600" />
          </div>
        </motion.div>

        <div className="relative z-10 space-y-6">
          <h3 className="text-5xl font-crimson font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
            Etalab
          </h3>
          
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Accédez aux données publiques géolocalisées de{' '}
            <span className="font-semibold text-blue-600">{marche.ville}</span> via la plateforme nationale Etalab
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/50 rounded-xl p-6 text-left">
              <FileText className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Données publiques</h4>
              <p className="text-gray-600 text-sm">
                Métadonnées géographiques et administratives
              </p>
            </div>
            
            <div className="bg-white/50 rounded-xl p-6 text-left">
              <Map className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Géolocalisation</h4>
              <p className="text-gray-600 text-sm">
                Coordonnées: {marche.latitude?.toFixed(4)}, {marche.longitude?.toFixed(4)}
              </p>
            </div>
          </div>

          <motion.div
            className="pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full shadow-lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Accéder à Etalab
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EtalabSubSection;
