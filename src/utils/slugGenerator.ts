
export function createSlug(nomMarche: string, ville: string): string {
  const cleanText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  const marcheSlug = cleanText(nomMarche || '');
  const villeSlug = cleanText(ville || '');
  
  // Use -- as semantic separator between name and city
  if (!marcheSlug && !villeSlug) return '';
  if (!villeSlug) return marcheSlug;
  if (!marcheSlug) return villeSlug;
  
  return `${marcheSlug}--${villeSlug}`;
}

export function findMarcheBySlug(marches: any[], slug: string) {
  return marches.find(marche => {
    const generatedSlug = createSlug(marche.nomMarche || marche.ville, marche.ville);
    return generatedSlug === slug;
  });
}
