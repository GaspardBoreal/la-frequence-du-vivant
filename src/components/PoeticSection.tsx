
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Feather } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import PoeticNotebook from './PoeticNotebook';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface PoeticSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const PoeticSection: React.FC<PoeticSectionProps> = ({ marche, theme }) => {
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-3">
            <Feather className="h-8 w-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-800">Journal Poétique</h2>
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez l'essence poétique de cette marche à travers un carnet manuscrit personnalisé
          </p>
        </motion.div>

        {/* Notebook Preview Card */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Preview Content */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-800 font-serif">
                    {marche.nomMarche || marche.ville}
                  </h3>
                  
                  <div className="text-sm text-gray-600 flex items-center justify-center space-x-4">
                    <span>{marche.ville}, {marche.departement}</span>
                    {marche.date && (
                      <>
                        <span>•</span>
                        <span>{marche.date}</span>
                      </>
                    )}
                  </div>

                  {marche.descriptifLong && (
                    <div className="text-gray-700 font-handwriting text-sm leading-relaxed max-w-md mx-auto">
                      <div 
                        className="line-clamp-3"
                        style={{ fontFamily: 'Kalam, cursive' }}
                        dangerouslySetInnerHTML={{ 
                          __html: marche.descriptifLong.substring(0, 150) + '...' 
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Open Notebook Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setIsNotebookOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Ouvrir le carnet
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Decorative Elements */}
        <div className="flex justify-center space-x-8 opacity-30">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>

      {/* Notebook Popup */}
      <PoeticNotebook
        marche={marche}
        theme={theme}
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
      />
    </>
  );
};

export default PoeticSection;
