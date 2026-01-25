import React from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DordoniaSilenceButtonProps {
  onClick: () => void;
  variant?: 'floating' | 'inline';
}

const DordoniaSilenceButton: React.FC<DordoniaSilenceButtonProps> = ({ 
  onClick, 
  variant = 'floating' 
}) => {
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={onClick}
          variant="outline"
          className="bg-slate-950/80 backdrop-blur-md border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900/90 hover:border-slate-600 rounded-full px-5 py-3 shadow-lg shadow-black/30"
        >
          <Moon className="h-4 w-4 mr-2" />
          Veille
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
    >
      <Moon className="h-4 w-4 mr-2" />
      Entrer en mode veille
    </Button>
  );
};

export default DordoniaSilenceButton;
