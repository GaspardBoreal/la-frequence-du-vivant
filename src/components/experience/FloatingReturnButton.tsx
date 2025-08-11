import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FloatingReturnButton: React.FC = () => {
  const navigate = useNavigate();

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleReturnHome}
        className="h-14 w-14 rounded-full shadow-lg btn-nature hover:shadow-xl transition-all duration-300 group"
        size="icon"
      >
        <ArrowUp className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
        <span className="sr-only">Retour à l'accueil</span>
      </Button>
      
      {/* Tooltip discret */}
      <div className="absolute bottom-16 right-0 bg-emerald-900/90 text-emerald-100 text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
        Retour à l'accueil
      </div>
    </div>
  );
};

export default FloatingReturnButton;