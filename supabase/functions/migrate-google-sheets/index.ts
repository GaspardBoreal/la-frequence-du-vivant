
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateAuth, forbiddenResponse, corsHeaders } from "../_shared/auth-helper.ts";

interface GoogleSheetsMarche {
  ville: string;
  departement: string;
  region: string;
  theme: string;
  nomMarche: string;
  descriptifCourt: string;
  date: string;
  temperature: number;
  latitude: number;
  longitude: number;
  lien: string;
  tags: string;
  photos: string;
  audio: string;
  descriptifLong: string;
  sousThemes: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin authentication (bulk DB writes via service role)
  const { isAdmin, errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;
  if (!isAdmin) return forbiddenResponse();

  try {
    console.log('🚀 Starting Google Sheets migration...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer les données depuis Google Sheets (réutiliser la logique existante)
    const SHEET_ID = '1Xu8VmmvOXKdRh5TCqVzW5-vLJh1V3Cy4P-aZGKqFZYo';
    const API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    
    if (!API_KEY) {
      throw new Error('Google Sheets API key not configured');
    }

    const RANGE = 'A2:P';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    console.log('📊 Fetching data from Google Sheets...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    console.log(`📥 Found ${rows.length} rows to migrate`);

    const migrationResults = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Mapper les données Google Sheets
        const marcheData = {
          ville: row[0] || '',
          nom_marche: row[4] || null,
          region: row[2] || null,
          theme_principal: row[3] || null,
          descriptif_court: row[5] || null,
          descriptif_long: row[14] || null,
          date: row[6] || null,
          temperature: row[7] ? parseFloat(row[7]) : null,
          coordonnees: (row[8] && row[9]) ? `POINT(${row[9]} ${row[8]})` : null,
          lien_google_drive: row[10] || null,
          sous_themes: row[15] ? row[15].split(',').map(s => s.trim()).filter(Boolean) : []
        };

        console.log(`📝 Inserting marche: ${marcheData.ville}`);

        // Insérer dans Supabase
        const { data: insertedMarche, error: marcheError } = await supabase
          .from('marches')
          .insert(marcheData)
          .select()
          .single();

        if (marcheError) {
          console.error(`❌ Error inserting marche ${marcheData.ville}:`, marcheError);
          migrationResults.push({
            ville: marcheData.ville,
            status: 'error',
            error: marcheError.message
          });
          continue;
        }

        const marcheId = insertedMarche.id;

        // Traiter les tags
        if (row[11]) {
          const tags = row[11].split(',').map(t => t.trim()).filter(Boolean);
          
          for (const tag of tags) {
            const { error: tagError } = await supabase
              .from('marche_tags')
              .insert({
                marche_id: marcheId,
                tag: tag,
                categorie: 'theme'
              });

            if (tagError) {
              console.error(`⚠️ Error inserting tag ${tag}:`, tagError);
            }
          }
        }

        // Créer une étude de base
        if (marcheData.descriptif_long) {
          const { error: etudeError } = await supabase
            .from('marche_etudes')
            .insert({
              marche_id: marcheId,
              titre: `Étude de ${marcheData.ville}`,
              contenu: marcheData.descriptif_long,
              resume: marcheData.descriptif_court,
              type_etude: 'principale',
              ordre: 1
            });

          if (etudeError) {
            console.error(`⚠️ Error inserting etude:`, etudeError);
          }
        }

        migrationResults.push({
          ville: marcheData.ville,
          status: 'success',
          marcheId: marcheId
        });

        console.log(`✅ Successfully migrated: ${marcheData.ville}`);

      } catch (rowError) {
        console.error(`❌ Error processing row ${i}:`, rowError);
        migrationResults.push({
          ville: row[0] || `Row ${i}`,
          status: 'error',
          error: rowError.message
        });
      }
    }

    const successCount = migrationResults.filter(r => r.status === 'success').length;
    const errorCount = migrationResults.filter(r => r.status === 'error').length;

    console.log(`🎉 Migration completed: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        totalRows: rows.length,
        successCount,
        errorCount,
        results: migrationResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 Migration failed:', error);
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
