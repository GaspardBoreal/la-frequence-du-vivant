
import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, ExternalLink, TreePine, Flower } from 'lucide-react';
import { Button } from '../ui/button';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';

interface BioDivSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const BioDivSubSection: React.FC<BioDivSubSectionProps> = ({ marche, theme }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="gaspard-glass rounded-3xl p-12 text-center space-y-8">
        <motion.div
          className="relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-6">
            <Leaf className="h-12 w-12 text-emerald-600" />
          </div>
        </motion.div>

        <div className="relative z-10 space-y-6">
          <h3 className="text-5xl font-crimson font-bold text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text">
            BioDiv
          </h3>
          
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Découvrez la biodiversité et les données écologiques de{' '}
            <span className="font-semibold text-emerald-600">{marche.ville}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/50 rounded-xl p-6 text-left">
              <TreePine className="h-8 w-8 text-emerald-600 mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Écosystèmes locaux</h4>
              <p className="text-gray-600 text-sm">
                Inventaire de la faune et flore locale
              </p>
            </div>
            
            <div className="bg-white/50 rounded-xl p-6 text-left">
              <Flower className="h-8 w-8 text-emerald-600 mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Biodiversité</h4>
              <p className="text-gray-600 text-sm">
                Région: {marche.region} - Zone {marche.departement}
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
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 rounded-full shadow-lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Accéder à BioDiv
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BioDivSubSection;
