
// Utilitaires pour extraire les photos et fichiers audio depuis Google Drive
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
      
      // Utiliser directement le format lh3.googleusercontent.com qui fonctionne
      const photoData = data.files.map((file: any) => {
        console.log(`Fichier trouvé: ${file.name} (${file.mimeType}) - ID: ${file.id}`);
        
        // Générer l'URL optimisée qui fonctionne
        const optimizedUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
        
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          urls: [optimizedUrl] // Une seule URL maintenant
        };
      }).slice(0, 20); // Limiter à 20 photos max
      
      console.log('Photos avec URLs optimisées générées:', photoData);
      return photoData;
    } else {
      console.log('Aucune photo trouvée dans le dossier ou erreur d\'accès');
      return [];
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des photos Google Drive:', error);
    return [];
  }
};

// Nouvelle fonction pour extraire les fichiers audio depuis Google Drive
export const extractAudioFromGoogleDrive = async (driveUrl: string): Promise<AudioData[]> => {
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

    console.log('Tentative de récupération des fichiers audio depuis le dossier:', folderId);

    // Construire l'URL de l'API Google Drive pour lister les fichiers audio
    // Recherche tous les formats audio courants
    const audioMimeTypes = [
      'audio/mpeg',     // MP3
      'audio/wav',      // WAV
      'audio/mp4',      // M4A
      'audio/x-m4a',    // M4A alternatif
      'audio/ogg',      // OGG
      'audio/webm',     // WebM
      'audio/aac',      // AAC
      'audio/flac'      // FLAC
    ];
    
    // Construire la requête pour tous les types audio
    const mimeTypeQuery = audioMimeTypes.map(mime => `mimeType='${mime}'`).join(' or ');
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+(${mimeTypeQuery})&key=AIzaSyBLIZXZWsOEvFeCAAHe1__khd0OVclv_4s&fields=files(id,name,mimeType,webViewLink,webContentLink,size)`;
    
    console.log('URL API audio construite:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Réponse API Drive Audio:', data);
    
    if (data.files && data.files.length > 0) {
      console.log(`${data.files.length} fichiers audio trouvés dans le dossier ${folderId}`);
      
      const audioData = data.files.map((file: any, index: number) => {
        console.log(`Fichier audio trouvé: ${file.name} (${file.mimeType}) - ID: ${file.id}`);
        
        // Utiliser une URL proxy ou embed qui fonctionne mieux avec CORS
        // Cette approche utilise l'URL d'embed de Google Drive
        const embedUrl = `https://drive.google.com/file/d/${file.id}/preview`;
        
        console.log(`URL d'embed générée pour ${file.name}: ${embedUrl}`);
        
        // Extraire le nom sans extension pour le titre
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        
        return {
          id: file.id,
          name: file.name,
          title: nameWithoutExt || `Piste Audio ${index + 1}`,
          url: embedUrl,
          directUrl: file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`,
          mimeType: file.mimeType,
          size: file.size ? parseInt(file.size) : 0,
          duration: 0 // Sera calculé lors du chargement
        };
      }).slice(0, 10); // Limiter à 10 fichiers audio max
      
      console.log('Fichiers audio avec URLs d\'embed générées:', audioData);
      return audioData;
    } else {
      console.log('Aucun fichier audio trouvé dans le dossier ou erreur d\'accès');
      return [];
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers audio Google Drive:', error);
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

// Define the AudioData interface
export interface AudioData {
  id: string;
  name: string;
  title: string;
  url: string;
  directUrl: string;
  mimeType: string;
  size: number;
  duration: number;
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
