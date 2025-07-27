
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogOverlay } from './ui/dialog';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';

interface PoeticNotebookProps {
  marche: MarcheTechnoSensible;
  isOpen: boolean;
  onClose: () => void;
}

const PoeticNotebook: React.FC<PoeticNotebookProps> = ({ marche, isOpen, onClose }) => {
  const descriptifLong = marche.descriptifLong || marche.descriptifCourt || '';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
      <DialogContent className="max-w-4xl w-full bg-transparent border-none shadow-none p-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Carnet ouvert */}
          <div className="relative bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl shadow-2xl p-8 border-2 border-amber-200">
            {/* Reliure centrale */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-600 to-amber-800 transform -translate-x-1/2 shadow-lg"></div>
            
            {/* Spirales de reliure */}
            <div className="absolute left-1/2 top-0 bottom-0 flex flex-col justify-evenly items-center transform -translate-x-1/2 py-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-3 h-3 border-2 border-amber-700 rounded-full bg-amber-100"></div>
              ))}
            </div>

            {/* Bouton de fermeture */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 text-amber-700 hover:text-amber-900 bg-white/50 hover:bg-white/70 rounded-full p-2 z-10"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Contenu du carnet */}
            <div className="grid grid-cols-2 gap-8 min-h-96">
              {/* Page de gauche */}
              <div className="relative">
                {/* Lignes de cahier */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full h-px bg-blue-200 opacity-30"
                      style={{ top: `${(i + 1) * 5}%` }}
                    />
                  ))}
                </div>
                
                {/* Marge rouge */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-red-300"></div>
                
                {/* Contenu page gauche */}
                <div className="relative pl-12 pr-4 pt-8">
                  <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center font-handwriting">
                    {marche.nomMarche || marche.ville}
                  </h2>
                  
                  <div className="text-right mb-8">
                    <p className="text-sm text-amber-700 font-handwriting">
                      {marche.ville}, {marche.departement}
                    </p>
                    <p className="text-sm text-amber-700 font-handwriting">
                      {marche.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Page de droite */}
              <div className="relative">
                {/* Lignes de cahier */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full h-px bg-blue-200 opacity-30"
                      style={{ top: `${(i + 1) * 5}%` }}
                    />
                  ))}
                </div>
                
                {/* Contenu page droite */}
                <div className="relative pl-4 pr-8 pt-8">
                  <div className="text-amber-900 font-handwriting leading-relaxed text-sm overflow-y-auto max-h-80">
                    {descriptifLong.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3" style={{ textIndent: '1em' }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ombres et effets de papier */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-200/20 rounded-2xl pointer-events-none"></div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default PoeticNotebook;
