/**
 * Contrast-Force Hierarchy Design System for Vignettes
 * 
 * This utility provides consistent styling across all vignette variants
 * following the validated UX pattern:
 * 1. Main title: Thematic color + bold
 * 2. Secondary info: !text-white + italic  
 * 3. Status info: Light complementary color + bold
 */

export type VignetteVariant = 'default' | 'species' | 'vocabulary' | 'infrastructure' | 'agro' | 'technology' | 'ia' |
  'tech-biomimicry' | 'tech-lowtech' | 'tech-digital' | 'tech-energy' | 'tech-materials' |
  'infra-transport' | 'infra-architecture' | 'infra-energy' | 'infra-water' | 'infra-urban';

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
        container: "border-slate/20 bg-gradient-to-br from-slate/5 to-white/95 hover:from-slate/8 hover:to-white shadow-sm hover:shadow-slate/20",
        title: "text-slate-700 font-semibold",
        secondary: "text-slate-600",
        status: "text-slate-500",
        badge: "bg-slate/10 text-slate-700 border-slate/20"
      };
      
    case 'ia':
      return {
        container: `${baseContainer} border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10`,
        title: 'text-purple-500 font-bold',
        secondary: '!text-white italic',
        status: 'text-purple-200 font-bold',
        badge: 'bg-purple-500/10 text-purple-500 border-purple-500/30'
      };

    // Technodiversité variants
    case 'tech-biomimicry':
      return {
        container: `${baseContainer} border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-teal-500/5 hover:from-teal-500/20 hover:to-teal-500/10`,
        title: 'text-teal-600 font-bold',
        secondary: '!text-white italic',
        status: 'text-teal-200 font-bold',
        badge: 'bg-teal-500/10 text-teal-600 border-teal-500/30'
      };

    case 'tech-lowtech':
      return {
        container: `${baseContainer} border-amber-600/30 bg-gradient-to-br from-amber-600/10 to-amber-600/5 hover:from-amber-600/20 hover:to-amber-600/10`,
        title: 'text-amber-700 font-bold',
        secondary: '!text-white italic',
        status: 'text-amber-200 font-bold',
        badge: 'bg-amber-600/10 text-amber-700 border-amber-600/30'
      };

    case 'tech-digital':
      return {
        container: `${baseContainer} border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 hover:from-cyan-500/20 hover:to-cyan-500/10`,
        title: 'text-cyan-600 font-bold',
        secondary: '!text-white italic',
        status: 'text-cyan-200 font-bold',
        badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30'
      };

    case 'tech-energy':
      return {
        container: `${baseContainer} border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 hover:from-yellow-500/20 hover:to-yellow-500/10`,
        title: 'text-yellow-600 font-bold',
        secondary: '!text-white italic',
        status: 'text-yellow-200 font-bold',
        badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
      };

    case 'tech-materials':
      return {
        container: `${baseContainer} border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 hover:from-indigo-500/20 hover:to-indigo-500/10`,
        title: 'text-indigo-600 font-bold',
        secondary: '!text-white italic',
        status: 'text-indigo-200 font-bold',
        badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
      };

    // Infrastructure variants
    case 'infra-transport':
      return {
        container: `${baseContainer} border-slate-500/30 bg-gradient-to-br from-slate-500/10 to-slate-500/5 hover:from-slate-500/20 hover:to-slate-500/10`,
        title: 'text-slate-700 font-bold',
        secondary: '!text-white italic',
        status: 'text-slate-200 font-bold',
        badge: 'bg-slate-500/10 text-slate-700 border-slate-500/30'
      };

    case 'infra-architecture':
      return {
        container: `${baseContainer} border-stone-600/30 bg-gradient-to-br from-stone-600/10 to-stone-600/5 hover:from-stone-600/20 hover:to-stone-600/10`,
        title: 'text-stone-700 font-bold',
        secondary: '!text-white italic',
        status: 'text-stone-200 font-bold',
        badge: 'bg-stone-600/10 text-stone-700 border-stone-600/30'
      };

    case 'infra-energy':
      return {
        container: `${baseContainer} border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/20 hover:to-orange-500/10`,
        title: 'text-orange-600 font-bold',
        secondary: '!text-white italic',
        status: 'text-orange-200 font-bold',
        badge: 'bg-orange-500/10 text-orange-600 border-orange-500/30'
      };

    case 'infra-water':
      return {
        container: `${baseContainer} border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10`,
        title: 'text-blue-600 font-bold',
        secondary: '!text-white italic',
        status: 'text-blue-200 font-bold',
        badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      };

    case 'infra-urban':
      return {
        container: `${baseContainer} border-gray-500/30 bg-gradient-to-br from-gray-500/10 to-gray-500/5 hover:from-gray-500/20 hover:to-gray-500/10`,
        title: 'text-gray-700 font-bold',
        secondary: '!text-white italic',
        status: 'text-gray-200 font-bold',
        badge: 'bg-gray-500/10 text-gray-700 border-gray-500/30'
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
      return 'text-slate-700';
    case 'ia':
      return 'text-purple-500';
    // Technodiversité variants
    case 'tech-biomimicry':
      return 'text-teal-600';
    case 'tech-lowtech':
      return 'text-amber-700';
    case 'tech-digital':
      return 'text-cyan-600';
    case 'tech-energy':
      return 'text-yellow-600';
    case 'tech-materials':
      return 'text-indigo-600';
    // Infrastructure variants
    case 'infra-transport':
      return 'text-slate-700';
    case 'infra-architecture':
      return 'text-stone-700';
    case 'infra-energy':
      return 'text-orange-600';
    case 'infra-water':
      return 'text-blue-600';
    case 'infra-urban':
      return 'text-gray-700';
    default:
      return 'text-foreground';
  }
};

/**
 * Smart mapping for technodiversity variants based on content
 */
export const mapTechnodiversityVariant = (data: any): VignetteVariant => {
  const type = data?.type?.toLowerCase() || '';
  const category = data?.category?.toLowerCase() || '';
  const title = data?.titre?.toLowerCase() || '';
  const description = data?.description_courte?.toLowerCase() || '';
  
  // Combine text for analysis
  const content = `${type} ${category} ${title} ${description}`.toLowerCase();
  
  // Biomimicry detection
  if (content.includes('biomimé') || content.includes('bio-') || content.includes('nature') || 
      content.includes('vivant') || content.includes('organique') || content.includes('écosystème')) {
    return 'tech-biomimicry';
  }
  
  // Digital/Numérique detection
  if (content.includes('numérique') || content.includes('digital') || content.includes('ia') ||
      content.includes('algorithme') || content.includes('données') || content.includes('capteur') ||
      content.includes('iot') || content.includes('connecté')) {
    return 'tech-digital';
  }
  
  // Energy detection
  if (content.includes('énergie') || content.includes('solaire') || content.includes('éolien') ||
      content.includes('électrique') || content.includes('autonome') || content.includes('renouvelable')) {
    return 'tech-energy';
  }
  
  // Low-tech detection
  if (content.includes('low-tech') || content.includes('artisan') || content.includes('local') ||
      content.includes('simple') || content.includes('manuel') || content.includes('traditionnel')) {
    return 'tech-lowtech';
  }
  
  // Materials detection
  if (content.includes('matériau') || content.includes('composite') || content.includes('recyclé') ||
      content.includes('textile') || content.includes('fibre') || content.includes('polymère')) {
    return 'tech-materials';
  }
  
  return 'technology';
};

/**
 * Smart mapping for infrastructure variants based on content
 */
export const mapInfrastructureVariant = (data: any): VignetteVariant => {
  const type = data?.type?.toLowerCase() || '';
  const category = data?.category?.toLowerCase() || '';
  const title = data?.titre?.toLowerCase() || '';
  const description = data?.description_courte?.toLowerCase() || '';
  
  // Combine text for analysis
  const content = `${type} ${category} ${title} ${description}`.toLowerCase();
  
  // Transport detection
  if (content.includes('transport') || content.includes('route') || content.includes('rail') ||
      content.includes('pont') || content.includes('voie') || content.includes('circulation') ||
      content.includes('mobilité') || content.includes('véhicule')) {
    return 'infra-transport';
  }
  
  // Water/Hydraulique detection
  if (content.includes('eau') || content.includes('hydraulique') || content.includes('barrage') ||
      content.includes('canal') || content.includes('écluse') || content.includes('aqueduc') ||
      content.includes('station épuration') || content.includes('assainissement')) {
    return 'infra-water';
  }
  
  // Energy infrastructure detection
  if (content.includes('électrique') || content.includes('centrale') || content.includes('réseau') ||
      content.includes('ligne haute tension') || content.includes('transformateur') || 
      content.includes('distribution énergie')) {
    return 'infra-energy';
  }
  
  // Architecture/Heritage detection
  if (content.includes('patrimoine') || content.includes('historique') || content.includes('monument') ||
      content.includes('architecture') || content.includes('château') || content.includes('église') ||
      content.includes('bâtiment') || content.includes('construction')) {
    return 'infra-architecture';
  }
  
  // Urban development detection
  if (content.includes('urbain') || content.includes('ville') || content.includes('développement') ||
      content.includes('aménagement') || content.includes('zone') || content.includes('quartier') ||
      content.includes('lotissement')) {
    return 'infra-urban';
  }
  
  return 'infrastructure';
};