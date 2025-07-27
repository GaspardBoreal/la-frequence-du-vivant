
import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogClose } from './ui/dialog';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface PoeticNotebookProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
  isOpen: boolean;
  onClose: () => void;
}

const PoeticNotebook: React.FC<PoeticNotebookProps> = ({
  marche,
  theme,
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-transparent border-none shadow-none overflow-hidden">
        <motion.div
          className="relative w-full h-full"
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Notebook Background */}
          <div className="relative bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg shadow-2xl border-2 border-amber-200 overflow-hidden">
            {/* Notebook Ring Binding */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-200 to-amber-300 border-r-2 border-amber-400">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-amber-400 rounded-full border border-amber-500"
                  style={{
                    left: '50%',
                    top: `${15 + i * 10}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              ))}
            </div>

            {/* Notebook Lines */}
            <div className="absolute inset-0 pl-12 pr-6 py-6">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-px bg-blue-200 opacity-30"
                  style={{
                    top: `${80 + i * 25}px`,
                    left: '3rem',
                    right: '1.5rem'
                  }}
                />
              ))}
            </div>

            {/* Red Margin Line */}
            <div className="absolute top-0 bottom-0 w-px bg-red-300 opacity-50" style={{ left: '5rem' }} />

            {/* Close Button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>

            {/* Notebook Content */}
            <div className="relative pl-16 pr-8 py-8 h-full overflow-y-auto">
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {/* Title */}
                <div className="text-center mb-8">
                  <h1 
                    className="text-4xl font-bold text-gray-800 font-serif tracking-wide"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                      color: theme.colors.primary
                    }}
                  >
                    {marche.nomMarche || marche.ville}
                  </h1>
                </div>

                {/* Location and Date */}
                <div className="flex justify-end mb-6">
                  <div className="text-right text-sm text-gray-600 font-handwriting">
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      <MapPin className="h-4 w-4" />
                      <span>{marche.ville}, {marche.departement}</span>
                    </div>
                    {marche.date && (
                      <div className="flex items-center justify-end space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{marche.date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Handwritten Content */}
                {marche.descriptifLong && (
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                  >
                    <div 
                      className="text-gray-700 font-handwriting text-lg leading-loose tracking-wide"
                      style={{
                        fontFamily: 'Kalam, cursive',
                        lineHeight: '2.5rem',
                        textAlign: 'justify'
                      }}
                      dangerouslySetInnerHTML={{ __html: marche.descriptifLong }}
                    />
                  </motion.div>
                )}

                {/* Decorative Elements */}
                <div className="mt-8 flex justify-center">
                  <motion.div
                    className="w-16 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                  />
                </div>

                {/* Signature Area */}
                <div className="mt-8 flex justify-end">
                  <div className="text-right text-sm text-gray-500 font-handwriting">
                    <div className="italic">La Fréquence du Vivant</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default PoeticNotebook;
