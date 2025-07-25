
// Utilitaires pour extraire les photos depuis Google Drive
export const extractPhotosFromGoogleDrive = async (driveUrl: string): Promise<string[]> => {
  if (!driveUrl || !driveUrl.includes('drive.google.com')) {
    return [];
  }

  try {
    // Extraire l'ID du dossier depuis l'URL Google Drive
    const folderId = extractFolderIdFromUrl(driveUrl);
    if (!folderId) return [];

    // Construire l'URL de l'API Google Drive pour lister les fichiers
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&key=AIzaSyBLIZXZWsOEvFeCAAHe1__khd0OVclv_4s&fields=files(id,name,mimeType)`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.files && data.files.length > 0) {
      // Convertir les IDs en URLs d'images directes
      return data.files.map((file: any) => 
        `https://drive.google.com/uc?id=${file.id}&export=view`
      ).slice(0, 20); // Limiter à 20 photos max
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des photos Google Drive:', error);
    return [];
  }
};

const extractFolderIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

// Fonction pour générer des URLs de photos de fallback si Google Drive échoue
export const generateFallbackPhotos = (theme: string, count: number = 3): string[] => {
  const baseUrls = [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518743387925-4040fc4df0c8?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1574923162061-6017b4b9598e?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1587691592099-24045742c181?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=500&h=300&fit=crop'
  ];
  
  return baseUrls.slice(0, Math.min(count, baseUrls.length));
};
