/**
 * Utilitaire pour extraire les morales des fables et nettoyer les textes poétiques
 */

// Patterns pour détecter les morales dans les fables
const MORAL_PATTERNS = [
  /Morale\s*[:\-–—]\s*(.+?)(?:\.|$)/i,
  /La morale\s*[:\-–—]?\s*(.+?)(?:\.|$)/i,
  /Ce que .+? (?:nous )?(?:apprend|enseigne|montre)[^.]*\./i,
  /On dit que[^.]+\./i,
  /Ainsi[^.]+\./i,
  /Tel est[^.]+\./i,
  /Voilà pourquoi[^.]+\./i,
  /C'est ainsi que[^.]+\./i,
];

// Patterns pour détecter les aphorismes et sentences
const APHORISM_PATTERNS = [
  /^[A-Z][^.!?]+[.!?]$/m, // Phrase simple commençant par majuscule
  /Qui .+?, .+?\./i,
  /Celui qui[^.]+\./i,
  /Rien ne[^.]+\./i,
  /Tout ce qui[^.]+\./i,
];

/**
 * Nettoie le HTML et retourne du texte brut
 */
export const cleanHtml = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<div[^>]*>/gi, '\n')   // MODIFIÉ: div ouvrante = retour ligne AVANT
    .replace(/<\/div>/gi, '')        // MODIFIÉ: supprime la div fermante (plus de \n ici)
    .replace(/<[^>]+>/g, '')         // Supprime le reste des balises
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Extrait la morale d'une fable
 */
export const extractMoralFromFable = (fableContent: string): string | null => {
  const cleanContent = cleanHtml(fableContent);
  
  // Chercher les patterns de morale explicite
  for (const pattern of MORAL_PATTERNS) {
    const match = cleanContent.match(pattern);
    if (match) {
      const moral = match[1] || match[0];
      if (moral.length > 15 && moral.length < 200) {
        return moral.trim();
      }
    }
  }
  
  // Fallback: prendre la dernière phrase significative
  const sentences = cleanContent
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 150);
  
  if (sentences.length > 0) {
    return sentences[sentences.length - 1] + '.';
  }
  
  return null;
};

/**
 * Extrait les lignes d'un haïku/senryū
 */
export const extractHaikuLines = (htmlContent: string): string[] => {
  const text = cleanHtml(htmlContent);
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 100);
  
  // Un haïku a typiquement 3 lignes
  return lines.slice(0, 5);
};

/**
 * Extrait un fragment poétique court d'un texte plus long
 */
export const extractPoeticFragment = (content: string, maxLength: number = 120): string => {
  const clean = cleanHtml(content);
  
  // Chercher une phrase poétique courte
  const sentences = clean
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length <= maxLength);
  
  if (sentences.length > 0) {
    // Préférer les phrases avec des mots poétiques
    const poeticWords = ['silence', 'ombre', 'lumière', 'eau', 'rivière', 'temps', 'nuit', 'jour', 'vent', 'soleil', 'lune'];
    const poeticSentence = sentences.find(s => 
      poeticWords.some(word => s.toLowerCase().includes(word))
    );
    
    return (poeticSentence || sentences[Math.floor(Math.random() * sentences.length)]) + '.';
  }
  
  // Fallback: tronquer proprement
  if (clean.length > maxLength) {
    const truncated = clean.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '…';
  }
  
  return clean;
};

/**
 * Détermine le type d'apparition basé sur le type de texte
 */
export const getApparitionTypeFromTextType = (
  typeTexte: string
): 'fragment' | 'moral' | 'haiku' => {
  const lower = typeTexte.toLowerCase();
  
  if (lower.includes('haiku') || lower.includes('haïku') || lower.includes('senryu') || lower.includes('senryū')) {
    return 'haiku';
  }
  
  if (lower.includes('fable') || lower.includes('conte') || lower.includes('parabole')) {
    return 'moral';
  }
  
  return 'fragment';
};
