/**
 * Contrast-Force Hierarchy Design System for Vignettes
 * 
 * This utility provides consistent styling across all vignette variants
 * following the validated UX pattern:
 * 1. Main title: Thematic color + bold
 * 2. Secondary info: !text-white + italic  
 * 3. Status info: Light complementary color + bold
 */

export type VignetteVariant = 'default' | 'species' | 'vocabulary' | 'infrastructure' | 'agro' | 'technology';

export interface VignetteStyleClasses {
  container: string;
  title: string;
  secondary: string;
  status: string;
  badge: string;
}

/**
 * Get consistent styling classes for a vignette variant
 */
export const getVignetteStyles = (variant: VignetteVariant): VignetteStyleClasses => {
  const baseContainer = 'border transition-all duration-300 hover:shadow-lg hover:scale-105';
  
  switch (variant) {
    case 'species':
      return {
        container: `${baseContainer} border-success/30 bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10`,
        title: 'text-success font-bold',
        secondary: '!text-white italic',
        status: 'text-success-light font-bold', // Using success-light for -200 equivalent
        badge: 'bg-success/10 text-success border-success/30'
      };
      
    case 'vocabulary':
      return {
        container: `${baseContainer} border-info/30 bg-gradient-to-br from-info/10 to-info/5 hover:from-info/20 hover:to-info/10`,
        title: 'text-info font-bold',
        secondary: '!text-white italic',
        status: 'text-blue-200 font-bold',
        badge: 'bg-info/10 text-info border-info/30'
      };
      
    case 'infrastructure':
      return {
        container: `${baseContainer} border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 hover:from-warning/20 hover:to-warning/10`,
        title: 'text-warning font-bold',
        secondary: '!text-white italic',
        status: 'text-orange-200 font-bold',
        badge: 'bg-warning/10 text-warning border-warning/30'
      };
      
    case 'agro':
      return {
        container: `${baseContainer} border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10`,
        title: 'text-accent font-bold',
        secondary: '!text-white italic',
        status: 'text-accent-light font-bold', // Using accent-light for -200 equivalent
        badge: 'bg-accent/10 text-accent border-accent/30'
      };
      
    case 'technology':
      return {
        container: `${baseContainer} border-success/30 bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10`,
        title: 'text-success font-bold',
        secondary: '!text-white italic',
        status: 'text-green-200 font-bold',
        badge: 'bg-success/10 text-success border-success/30'
      };
      
    default:
      return {
        container: `${baseContainer} border-border/50 bg-gradient-to-br from-background/80 to-background/40 hover:from-background/90 hover:to-background/50`,
        title: 'text-foreground font-bold',
        secondary: 'text-muted-foreground italic',
        status: 'text-muted-foreground font-bold',
        badge: 'bg-muted text-muted-foreground border-muted'
      };
  }
};

/**
 * Get dialog header styles for consistent modal display
 */
export const getDialogHeaderStyles = (variant: VignetteVariant) => {
  switch (variant) {
    case 'species':
      return 'text-success';
    case 'vocabulary':
      return 'text-info';
    case 'infrastructure':
      return 'text-warning';
    case 'agro':
      return 'text-accent';
    case 'technology':
      return 'text-success';
    default:
      return 'text-foreground';
  }
};