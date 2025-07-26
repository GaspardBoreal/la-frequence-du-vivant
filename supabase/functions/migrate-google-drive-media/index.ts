
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaFile {
  url: string;
  type: 'photo' | 'audio';
  filename: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Google Drive media migration...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer toutes les marches depuis Supabase
    const { data: marches, error: marchesError } = await supabase
      .from('marches')
      .select('id, ville, lien_google_drive');

    if (marchesError) {
      throw new Error(`Error fetching marches: ${marchesError.message}`);
    }

    console.log(`📊 Found ${marches.length} marches to process`);

    const migrationResults = [];

    for (const marche of marches) {
      if (!marche.lien_google_drive) {
        console.log(`⏭️ Skipping ${marche.ville} - no Google Drive link`);
        continue;
      }

      try {
        console.log(`📁 Processing media for ${marche.ville}...`);

        // Extraire l'ID du dossier Google Drive
        const driveMatch = marche.lien_google_drive.match(/folders\/([a-zA-Z0-9-_]+)/);
        if (!driveMatch) {
          console.log(`⚠️ Invalid Google Drive link format for ${marche.ville}`);
          continue;
        }

        const folderId = driveMatch[1];
        const GOOGLE_API_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY');
        
        if (!GOOGLE_API_KEY) {
          throw new Error('Google Drive API key not configured');
        }

        // Lister les fichiers dans le dossier Google Drive
        const listUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${GOOGLE_API_KEY}&fields=files(id,name,mimeType,size)`;
        
        const listResponse = await fetch(listUrl);
        if (!listResponse.ok) {
          throw new Error(`Google Drive API error: ${listResponse.status}`);
        }

        const listData = await listResponse.json();
        const files = listData.files || [];

        console.log(`📄 Found ${files.length} files for ${marche.ville}`);

        const processedFiles = [];

        for (const file of files) {
          try {
            const isPhoto = file.mimeType?.startsWith('image/');
            const isAudio = file.mimeType?.startsWith('audio/');

            if (!isPhoto && !isAudio) {
              console.log(`⏭️ Skipping non-media file: ${file.name}`);
              continue;
            }

            console.log(`📥 Downloading ${file.name}...`);

            // Télécharger le fichier depuis Google Drive
            const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${GOOGLE_API_KEY}`;
            const downloadResponse = await fetch(downloadUrl);

            if (!downloadResponse.ok) {
              throw new Error(`Failed to download ${file.name}: ${downloadResponse.status}`);
            }

            const fileBlob = await downloadResponse.blob();
            const arrayBuffer = await fileBlob.arrayBuffer();
            
            // Déterminer le bucket et le chemin
            const bucketName = isPhoto ? 'marche-photos' : 'marche-audio';
            const fileName = `${marche.ville.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${file.name}`;
            const filePath = `${marche.id}/${fileName}`;

            console.log(`☁️ Uploading to Supabase Storage: ${bucketName}/${filePath}`);

            // Upload vers Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(filePath, arrayBuffer, {
                contentType: file.mimeType,
                upsert: false
              });

            if (uploadError) {
              throw new Error(`Upload error: ${uploadError.message}`);
            }

            // Obtenir l'URL publique
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);

            // Insérer dans la table correspondante
            if (isPhoto) {
              const { error: photoError } = await supabase
                .from('marche_photos')
                .insert({
                  marche_id: marche.id,
                  nom_fichier: fileName,
                  url_supabase: urlData.publicUrl,
                  url_originale: `https://drive.google.com/file/d/${file.id}/view`,
                  titre: file.name,
                  ordre: processedFiles.length + 1,
                  metadata: {
                    originalSize: file.size,
                    mimeType: file.mimeType,
                    driveFileId: file.id
                  }
                });

              if (photoError) {
                throw new Error(`Photo DB error: ${photoError.message}`);
              }
            } else if (isAudio) {
              const { error: audioError } = await supabase
                .from('marche_audio')
                .insert({
                  marche_id: marche.id,
                  nom_fichier: fileName,
                  url_supabase: urlData.publicUrl,
                  url_originale: `https://drive.google.com/file/d/${file.id}/view`,
                  titre: file.name,
                  format_audio: file.mimeType?.split('/')[1] || 'unknown',
                  taille_octets: parseInt(file.size) || 0,
                  ordre: processedFiles.length + 1,
                  metadata: {
                    originalSize: file.size,
                    mimeType: file.mimeType,
                    driveFileId: file.id
                  }
                });

              if (audioError) {
                throw new Error(`Audio DB error: ${audioError.message}`);
              }
            }

            processedFiles.push({
              name: file.name,
              type: isPhoto ? 'photo' : 'audio',
              url: urlData.publicUrl,
              status: 'success'
            });

            console.log(`✅ Successfully processed: ${file.name}`);

          } catch (fileError) {
            console.error(`❌ Error processing file ${file.name}:`, fileError);
            processedFiles.push({
              name: file.name,
              status: 'error',
              error: fileError.message
            });
          }
        }

        migrationResults.push({
          marche: marche.ville,
          status: 'success',
          filesProcessed: processedFiles.length,
          files: processedFiles
        });

        console.log(`✅ Completed ${marche.ville}: ${processedFiles.length} files processed`);

      } catch (marcheError) {
        console.error(`❌ Error processing marche ${marche.ville}:`, marcheError);
        migrationResults.push({
          marche: marche.ville,
          status: 'error',
          error: marcheError.message
        });
      }
    }

    const successCount = migrationResults.filter(r => r.status === 'success').length;
    const errorCount = migrationResults.filter(r => r.status === 'error').length;
    const totalFiles = migrationResults.reduce((acc, r) => acc + (r.filesProcessed || 0), 0);

    console.log(`🎉 Media migration completed: ${successCount} marches, ${totalFiles} files`);

    return new Response(
      JSON.stringify({
        success: true,
        marchesProcessed: marches.length,
        successCount,
        errorCount,
        totalFiles,
        results: migrationResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 Media migration failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
