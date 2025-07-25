
// Utilitaires pour extraire les photos depuis Google Drive
export const extractPhotosFromGoogleDrive = async (driveUrl: string): Promise<string[]> => {
  if (!driveUrl || !driveUrl.includes('drive.google.com')) {
    return [];
  }

  try {
    // Extraire l'ID du dossier depuis l'URL Google Drive
    const folderId = extractFolderIdFromUrl(driveUrl);
    if (!folderId) {
      console.log('Impossible d\'extraire l\'ID du dossier depuis:', driveUrl);
      return [];
    }

    console.log('Tentative de récupération des photos depuis le dossier:', folderId);

    // Construire l'URL de l'API Google Drive pour lister les fichiers images
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&key=AIzaSyBLIZXZWsOEvFeCAAHe1__khd0OVclv_4s&fields=files(id,name,mimeType,webViewLink,webContentLink)`;
    
    console.log('URL API construite:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Réponse API Drive:', data);
    
    if (data.files && data.files.length > 0) {
      console.log(`${data.files.length} photos trouvées dans le dossier ${folderId}`);
      
      // Utiliser le format https://drive.google.com/uc?export=view&id={FILE_ID}
      const photoUrls = data.files.map((file: any) => {
        console.log(`Fichier trouvé: ${file.name} (${file.mimeType}) - ID: ${file.id}`);
        
        // Construire l'URL pour l'affichage direct
        const url = `https://drive.google.com/uc?export=view&id=${file.id}`;
        console.log(`Photo générée: ${file.name} -> ${url}`);
        return url;
      }).slice(0, 20); // Limiter à 20 photos max
      
      return photoUrls;
    } else {
      console.log('Aucune photo trouvée dans le dossier ou erreur d\'accès');
      return [];
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des photos Google Drive:', error);
    return [];
  }
};

const extractFolderIdFromUrl = (url: string): string | null => {
  // Gestion des différents formats d'URL Google Drive
  let match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  
  // Format alternatif
  match = url.match(/id=([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  
  console.log('Format d\'URL Drive non reconnu:', url);
  return null;
};
