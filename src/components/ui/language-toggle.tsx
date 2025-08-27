import React from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'default';
  showLabels?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className, 
  size = 'default',
  showLabels = true 
}) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-accent/50 transition-all duration-200",
        className
      )}
      title={`Changer vers ${language === 'fr' ? 'English' : 'Français'}`}
    >
      <Languages className="w-4 h-4" />
      {showLabels && (
        <span className="font-medium">
          {language === 'fr' ? 'FR' : 'EN'}
          <span className="text-muted-foreground mx-1">|</span>
          <span className="text-muted-foreground opacity-60">
            {language === 'fr' ? 'EN' : 'FR'}
          </span>
        </span>
      )}
    </Button>
  );
};

export const LanguageToggleCompact: React.FC<{ className?: string }> = ({ className }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-all duration-200",
        "bg-background/60 hover:bg-accent/80 border border-border/30",
        "text-foreground hover:text-accent-foreground",
        className
      )}
      title={`Changer vers ${language === 'fr' ? 'English' : 'Français'}`}
    >
      <span className={cn(
        "transition-opacity duration-200",
        language === 'fr' ? "opacity-100" : "opacity-40"
      )}>
        FR
      </span>
      <span className="text-muted-foreground">|</span>
      <span className={cn(
        "transition-opacity duration-200",
        language === 'en' ? "opacity-100" : "opacity-40"
      )}>
        EN
      </span>
    </button>
  );
};