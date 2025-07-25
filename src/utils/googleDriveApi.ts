
// Utilitaires pour extraire les photos depuis Google Drive
export const extractPhotosFromGoogleDrive = async (driveUrl: string): Promise<PhotoData[]> => {
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
      
      // Générer plusieurs formats d'URLs pour chaque image
      const photoUrls = data.files.map((file: any) => {
        console.log(`Fichier trouvé: ${file.name} (${file.mimeType}) - ID: ${file.id}`);
        
        // Créer un objet avec plusieurs formats d'URLs à tester
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          urls: [
            `https://drive.google.com/uc?export=view&id=${file.id}`,
            `https://drive.google.com/uc?id=${file.id}&export=download`,
            `https://drive.google.com/file/d/${file.id}/view`,
            `https://lh3.googleusercontent.com/d/${file.id}`,
            file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`
          ]
        };
      }).slice(0, 20); // Limiter à 20 photos max
      
      console.log('Photos avec URLs multiples générées:', photoUrls);
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

// Define the PhotoData interface
export interface PhotoData {
  id: string;
  name: string;
  mimeType: string;
  urls: string[];
}

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
